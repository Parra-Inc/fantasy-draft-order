#!/usr/bin/env node
// Worker load check: boot each Cloudflare Worker the way production runs it
// (workerd, strict ES modules, the real bundle) and request a short list of
// routes. Catches code that crashes while its module is evaluated, which no
// Node-based test sees: a CommonJS dependency doing `var g = this` (undefined
// in an ES module), a Node-only API called at the top level, a missing
// nodejs_compat polyfill. Those failures are silent in production: every
// request to the route returns 500 and analytics only ever sees successes.
// Only Recipes lost recipe import for a day to exactly this (PR #213).
//
// Fleet copy. Source of truth:
//   skills/deploy-local/templates/worker-load-check.mjs (Parra-Inc/skills)
// Copy it to <repo>/scripts/worker-load-check.mjs unchanged; fix bugs upstream.
//
// Usage (from the repo root, after the build the pre-push check already runs):
//   node scripts/worker-load-check.mjs                 uses ./load-check.routes.json
//   node scripts/worker-load-check.mjs path/to/routes.json
//   node scripts/worker-load-check.mjs --only site     one worker by name
//
// Without a routes file it checks ./wrangler.jsonc with GET /.
//
// Route list format (load-check.routes.json, paths relative to the file):
//   {
//     "workers": [
//       {
//         "name": "site",                       // label for output
//         "config": "wrangler.jsonc",           // the real wrangler config
//         "secrets": ["AUTH_SECRET"],           // extra placeholder secrets
//         "vars": { "FEATURE_X": "off" },       // extra or overriding vars
//         "routes": [
//           "/",
//           { "path": "/api/v1/parser", "method": "POST",
//             "headers": { "content-type": "application/json" },
//             "body": { "url": "https://example.com" } }
//         ]
//       }
//     ]
//   }
//
// OpenNext loads route code lazily, so every route group (each heavy API
// route, the MCP endpoint, admin) needs one request in the list. A plain
// Worker evaluates all of its code at startup, so "/" is enough.
// A Worker with no fetch handler (queue or cron only) takes "routes": [] and
// passes when it boots cleanly.
//
// Fails (exit 1) when the Worker does not start, when any route answers 5xx
// or does not answer, or when any log line mentions "module evaluation".
// A 4xx is a pass: the route's code loaded and ran far enough to refuse.
//
// Bindings are stubbed, never live. The check writes a stripped copy of each
// wrangler config to a temp directory and boots that:
//   - Hyperdrive: a dummy connection string to a closed local port
//   - D1, KV, R2, Queues, Durable Objects, rate limits, Analytics Engine:
//     local Miniflare simulations, persisted to a temp dir that is deleted;
//     each D1 database gets the repo's migrations applied first
//   - every secret in `secrets.required` plus the route file's "secrets":
//     the string "load-check-placeholder"
//   - service bindings to other Workers are removed (no dev registry); a
//     binding to the Worker itself is kept
//   - remote-only bindings (ai, browser, images, vectorize, flagship,
//     dispatch namespaces, mTLS, containers, secrets store, pipelines,
//     unsafe) are removed, so env.X is undefined; code that needs one at
//     module scope must guard it
//   - routes, custom domains, observability, tail consumers and `env`
//     blocks are dropped; .dev.vars and .env are never read (the config is
//     booted from the temp dir, so wrangler finds none)
// Ports are random free ports and the inspector is off, so this never clashes
// with a running `wrangler dev` or another session.

import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);

const PLACEHOLDER = "load-check-placeholder";
const DUMMY_HYPERDRIVE = "postgresql://load-check:load-check@127.0.0.1:9/load-check";
const REQUEST_TIMEOUT_MS = 90_000;
const STARTUP_TIMEOUT_MS = 120_000;
const strip = (t) => t.replace(/\x1b\[[0-9;]*m/g, "");
const FAIL_PATTERNS = [/module evaluation/i];

// Keys that would reach a live Cloudflare resource or only exist remotely.
const REMOTE_ONLY_KEYS = [
  "ai", "browser", "images", "vectorize", "flagship", "dispatch_namespaces",
  "mtls_certificates", "containers", "secrets_store_secrets", "pipelines",
  "unsafe", "worker_loaders", "vpc_services", "media",
];
// Deploy-time keys with no meaning for a local boot.
const DEPLOY_ONLY_KEYS = [
  "routes", "route", "workers_dev", "preview_urls", "observability",
  "tail_consumers", "logpush", "placement", "limits", "upload_source_maps",
  "env", "build", "triggers", "account_id", "keep_vars", "minify",
  "$schema", "dev",
];

const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const positional = args.filter((a, i) => !a.startsWith("--") && (onlyIdx < 0 || i !== onlyIdx + 1));
const routesFile = path.resolve(positional[0] ?? "load-check.routes.json");

// ---------------------------------------------------------------- JSONC ----

function parseJsonc(text) {
  let out = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inString) {
      out += c;
      if (c === "\\") { out += n ?? ""; i += 2; continue; }
      if (c === '"') inString = false;
      i++;
    } else if (c === '"') {
      inString = true; out += c; i++;
    } else if (c === "/" && n === "/") {
      while (i < text.length && text[i] !== "\n") i++;
    } else if (c === "/" && n === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
    } else {
      out += c; i++;
    }
  }
  // Trailing commas, outside strings (strings were copied verbatim above, so
  // re-scan and only drop commas followed by a closing bracket).
  let clean = "";
  inString = false;
  for (let j = 0; j < out.length; j++) {
    const c = out[j];
    if (inString) {
      clean += c;
      if (c === "\\") { clean += out[++j] ?? ""; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; clean += c; continue; }
    if (c === ",") {
      let k = j + 1;
      while (k < out.length && /\s/.test(out[k])) k++;
      if (out[k] === "}" || out[k] === "]") continue;
    }
    clean += c;
  }
  return JSON.parse(clean);
}

function readConfig(file) {
  const text = fs.readFileSync(file, "utf8");
  return file.endsWith(".toml") ? null : parseJsonc(text);
}

// ------------------------------------------------------------- stubbing ----

function stubConfig(raw, configDir, extraSecrets, extraVars) {
  const cfg = structuredClone(raw);
  const removed = [];
  for (const key of [...REMOTE_ONLY_KEYS, ...DEPLOY_ONLY_KEYS]) {
    if (key in cfg) {
      if (REMOTE_ONLY_KEYS.includes(key)) removed.push(key);
      delete cfg[key];
    }
  }
  const abs = (p) => (p && !path.isAbsolute(p) ? path.resolve(configDir, p) : p);
  cfg.main = abs(cfg.main);
  if (cfg.base_dir) cfg.base_dir = abs(cfg.base_dir);
  if (cfg.tsconfig) cfg.tsconfig = abs(cfg.tsconfig);
  if (cfg.assets?.directory) cfg.assets.directory = abs(cfg.assets.directory);
  if (cfg.site?.bucket) cfg.site.bucket = abs(cfg.site.bucket);
  if (cfg.alias) {
    for (const [k, v] of Object.entries(cfg.alias)) {
      if (typeof v === "string" && v.startsWith(".")) cfg.alias[k] = abs(v);
    }
  }
  for (const db of cfg.d1_databases ?? []) {
    db.migrations_dir = abs(db.migrations_dir ?? "migrations");
  }
  for (const hd of cfg.hyperdrive ?? []) hd.localConnectionString = DUMMY_HYPERDRIVE;

  // Service bindings to other Workers have nothing to connect to locally (the
  // dev registry is off) and workerd refuses to start; a binding to this same
  // Worker is kept. Code that calls a dropped one sees env.X undefined.
  if (Array.isArray(cfg.services)) {
    const kept = cfg.services.filter((s) => s.service === cfg.name);
    if (kept.length !== cfg.services.length) {
      removed.push(...cfg.services.filter((s) => s.service !== cfg.name).map((s) => `service ${s.binding}`));
    }
    if (kept.length) cfg.services = kept;
    else delete cfg.services;
  }

  // No binding may opt into remote mode.
  const stripRemote = (v) => {
    if (Array.isArray(v)) v.forEach(stripRemote);
    else if (v && typeof v === "object") {
      delete v.remote;
      delete v.experimental_remote;
      Object.values(v).forEach(stripRemote);
    }
  };
  stripRemote(cfg);

  const secrets = new Set([...(cfg.secrets?.required ?? []), ...extraSecrets]);
  delete cfg.secrets;
  cfg.vars = { ...(cfg.vars ?? {}) };
  for (const name of secrets) if (!(name in cfg.vars)) cfg.vars[name] = PLACEHOLDER;
  Object.assign(cfg.vars, extraVars);

  return { cfg, removed, secrets: [...secrets] };
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// ---------------------------------------------------------------- run ------
//
// The Worker boots in a child process. When a module throws during
// evaluation, workerd refuses the script and wrangler never reports ready
// (in-process, it also stalls the event loop), so the parent watches the
// child's output for the crash and kills the whole process group.

const say = (msg) => process.stdout.write(`${msg}\n`);

function requireFrom(fromDir) {
  return createRequire(path.join(fromDir, "package.json"));
}

function wranglerBin(fromDir) {
  return path.join(path.dirname(requireFrom(fromDir).resolve("wrangler/package.json")), "bin", "wrangler.js");
}

// Child: boot the stub config and request every route. Exit 0 when all
// routes answered below 500, 1 otherwise.
async function child(jobPath) {
  const job = JSON.parse(fs.readFileSync(jobPath, "utf8"));
  const { unstable_dev } = await import(pathToFileURL(requireFrom(job.configDir).resolve("wrangler")).href);
  const worker = await unstable_dev(job.main, {
    config: job.stubPath,
    ip: "127.0.0.1",
    port: await freePort(),
    inspectorPort: await freePort(),
    inspect: false,
    local: true,
    persist: true,
    persistTo: job.stateDir,
    logLevel: "log",
    experimental: {
      disableExperimentalWarning: true,
      disableDevRegistry: true,
      forceLocal: true,
      watch: false,
      liveReload: false,
      showInteractiveDevSession: false,
    },
  });
  let failed = false;
  for (const r of job.routes) {
    const route = typeof r === "string" ? { path: r } : r;
    const method = route.method ?? "GET";
    const headers = { ...(route.headers ?? {}) };
    let body = route.body;
    if (body !== undefined && typeof body !== "string") {
      body = JSON.stringify(body);
      headers["content-type"] ??= "application/json";
    }
    const label = `${method} ${route.path}`;
    try {
      const res = await worker.fetch(route.path, {
        method, headers, body, redirect: "manual",
        signal: AbortSignal.timeout(route.timeoutMs ?? REQUEST_TIMEOUT_MS),
      });
      await res.arrayBuffer().catch(() => {});
      const ok = res.status < 500;
      say(`    ${ok ? "ok  " : "FAIL"} ${res.status} ${label}`);
      if (!ok) failed = true;
    } catch (err) {
      say(`    FAIL ${label}: did not answer: ${err?.message ?? err}`);
      failed = true;
    }
  }
  // Give workerd a moment to flush logs for the last request.
  await new Promise((r) => setTimeout(r, 500));
  await Promise.race([worker.stop().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
  process.exit(failed ? 1 : 0);
}

function runChild(jobPath, timeoutMs) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [SELF, "--child", jobPath], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });
    let out = "";
    let crash = null;
    let done = false;
    const kill = () => {
      try { process.kill(-proc.pid, "SIGKILL"); } catch {}
    };
    const onData = (stream) => (chunk) => {
      const text = String(chunk);
      out += text;
      stream.write(text);
      if (!crash) {
        // workerd refusing the script, or wrangler failing to bundle a source
        // entry (a missing generated file): either way it never becomes ready.
        const line = strip(out).split("\n").find((l) =>
          (/ Uncaught /.test(l) && /service core:user/.test(l)) || /\[ERROR\] (Build failed|Worker ".*" ?'s binding)/.test(l));
        if (line) { crash = line.trim(); kill(); }
      }
    };
    proc.stdout.on("data", onData(process.stdout));
    proc.stderr.on("data", onData(process.stderr));
    const timer = setTimeout(() => { if (!done) { crash ??= `timed out after ${timeoutMs / 1000}s`; kill(); } }, timeoutMs);
    proc.on("exit", (code) => {
      done = true;
      clearTimeout(timer);
      kill(); // reap workerd and anything else left in the group
      resolve({ code, crash, logs: strip(out) });
    });
  });
}

async function checkWorker(spec, baseDir) {
  const name = spec.name ?? spec.config ?? "worker";
  const configPath = path.resolve(baseDir, spec.config ?? "wrangler.jsonc");
  const configDir = path.dirname(configPath);
  say(`\n==> load check: ${name} (${path.relative(process.cwd(), configPath) || configPath})`);

  const raw = readConfig(configPath);
  if (!raw) return [`${name}: only wrangler.json / wrangler.jsonc configs are supported`];
  if (!raw.main) return [`${name}: wrangler config has no "main"`];

  const { cfg, removed, secrets } = stubConfig(raw, configDir, spec.secrets ?? [], spec.vars ?? {});
  if (!fs.existsSync(cfg.main)) {
    return [`${name}: entry ${cfg.main} does not exist (run the build first)`];
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "worker-load-check-"));
  try {
    const stubPath = path.join(tmp, "wrangler.json");
    const stateDir = path.join(tmp, "state");
    fs.writeFileSync(stubPath, JSON.stringify(cfg, null, 2));
    if (removed.length) say(`    stubbed out remote-only bindings: ${removed.join(", ")}`);
    if (secrets.length) say(`    placeholder secrets: ${secrets.join(", ")}`);

    // Local D1 starts empty: apply the repo's migrations so routes can query it.
    for (const db of cfg.d1_databases ?? []) {
      if (!fs.existsSync(db.migrations_dir)) continue;
      const r = spawnSync(
        process.execPath,
        [wranglerBin(configDir), "d1", "migrations", "apply", db.database_name ?? db.binding,
          "--local", "--persist-to", stateDir, "--config", stubPath],
        { cwd: tmp, encoding: "utf8", env: { ...process.env, CI: "1" } },
      );
      if (r.status !== 0) {
        return [`${name}: applying local D1 migrations for ${db.binding} failed:\n${r.stdout}${r.stderr}`];
      }
      say(`    applied local D1 migrations: ${db.binding}`);
    }

    const jobPath = path.join(tmp, "job.json");
    // An explicit empty list boots the Worker without requests: for a Worker with
    // no fetch handler (queue or cron only), a clean start proves its modules load.
    const routes = Array.isArray(spec.routes) ? spec.routes : ["/"];
    fs.writeFileSync(jobPath, JSON.stringify({ main: cfg.main, configDir, stubPath, stateDir, routes }));
    const timeout = STARTUP_TIMEOUT_MS + routes.length * REQUEST_TIMEOUT_MS;
    const { code, crash, logs } = await runChild(jobPath, timeout);

    const failures = [];
    if (crash) failures.push(`${name}: Worker failed to start: ${crash}`);
    for (const line of logs.split("\n")) {
      if (/^\s+FAIL /.test(line)) failures.push(`${name}: ${line.trim().slice(5)}`);
      if (FAIL_PATTERNS.some((p) => p.test(line))) failures.push(`${name}: log line: ${line.trim()}`);
    }
    if (code !== 0 && !failures.length) failures.push(`${name}: load check exited with code ${code}`);
    return failures;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function main() {
  if (args[0] === "--child") return child(args[1]);

  let specs;
  let baseDir = process.cwd();
  if (fs.existsSync(routesFile)) {
    baseDir = path.dirname(routesFile);
    specs = parseJsonc(fs.readFileSync(routesFile, "utf8")).workers ?? [];
  } else if (positional[0]) {
    console.error(`worker-load-check: ${routesFile} not found`);
    process.exit(2);
  } else {
    specs = [{ name: "worker", config: "wrangler.jsonc", routes: ["/"] }];
  }
  if (only) specs = specs.filter((s) => s.name === only);
  if (!specs.length) {
    console.error("worker-load-check: no workers to check");
    process.exit(2);
  }

  const failures = [];
  for (const spec of specs) failures.push(...(await checkWorker(spec, baseDir)));

  if (failures.length) {
    say(`\n==> worker load check FAILED (${failures.length})`);
    for (const f of failures) say(`    - ${f}`);
    process.exit(1);
  }
  say(`\n==> worker load check passed (${specs.length} worker${specs.length === 1 ? "" : "s"})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
