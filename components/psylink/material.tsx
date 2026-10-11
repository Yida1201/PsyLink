"use client";
import { useEffect, useState } from "react";
import { useLocale } from "./locale";

type Theme = "light" | "dark";
// Keep in sync with the specular ::after list in app/material.css.
const GLASS = ".conversation, .modal, .welcome-entry, .chat-aside > *, .library-feature, .care-intro, .together-intro, .listening-room, .together-week-review";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Physical toggle: the knob shows the current mode, the track the other one. */
export function ThemeSwitch({ className = "", showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { t } = useLocale();
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(currentTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("bloomie-theme"); } catch {}
      if (saved !== "light" && saved !== "dark") apply(media.matches ? "dark" : "light", false);
    };
    media.addEventListener("change", follow);
    // Every switch instance mirrors the real document state.
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { media.removeEventListener("change", follow); observer.disconnect(); };
  }, []);
  function apply(next: Theme, save = true) {
    document.documentElement.dataset.theme = next;
    setTheme(next);
    if (save) { try { localStorage.setItem("bloomie-theme", next); } catch {} }
  }
  const dark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t("深色模式")}
      className={`theme-switch ${className}`}
      onClick={() => apply(dark ? "light" : "dark")}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <svg className="theme-switch-sun" viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></g></svg>
        <svg className="theme-switch-moon" viewBox="0 0 24 24" width="13" height="13"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" /></svg>
        <span className="theme-switch-knob">
          {dark
            ? <svg viewBox="0 0 24 24" width="12" height="12"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="4" fill="currentColor" /><g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M5.6 18.4l1-1M17.4 6.6l1-1" /></g></svg>}
        </span>
      </span>
      {showLabel && <span className="theme-switch-label">{t("深色模式")}</span>}
    </button>
  );
}

/** Moves a soft specular highlight across glass panels under the pointer. */
export function Specular() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(GLASS) as HTMLElement | null;
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - box.left}px`);
        el.style.setProperty("--my", `${e.clientY - box.top}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(frame); };
  }, []);
  return null;
}
