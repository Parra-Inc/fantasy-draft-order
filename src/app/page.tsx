import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          The draft order you can actually trust.
        </h1>
        <p className="text-lg text-muted-foreground">
          Set a time. Share a link. Your league watches the draft order drawn
          live — from open-source code.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/new"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create a draft
          </Link>
        </div>
      </div>
    </main>
  );
}
