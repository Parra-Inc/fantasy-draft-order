"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ffdo:newsletter-subscribed";
const COOKIE_NAME = "ffdo_newsletter";
const CHANGE_EVENT = "ffdo:newsletter-change";

function read(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {
    // Private mode or blocked storage: fall through to the cookie.
  }
  return document.cookie.split("; ").some((c) => c === `${COOKIE_NAME}=1`);
}

/** Remember the signup (a flag, never the address) and flip every form on the page. */
export function markNewsletterSubscribed() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Cookie below is the fallback.
  }
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=1; Path=/; Max-Age=${60 * 60 * 24 * 730}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Server snapshot is false, so SSR renders the form and the client swaps without a hydration mismatch. */
export function useNewsletterSubscribed() {
  return useSyncExternalStore(subscribe, read, () => false);
}
