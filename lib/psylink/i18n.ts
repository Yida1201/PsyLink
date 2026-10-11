import dictionary from "./translations.json";
import researchDictionary from "./research-translations.json";
export const locales = ["zh-CN", "en-US", "es", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const languageNames: Record<Locale, string> = {
  "zh-CN": "Simplified Chinese",
  "en-US": "American English",
  es: "Spanish",
  ja: "Japanese",
  ko: "Korean",
};
export const localeLabels: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "en-US": "English (US)",
  es: "Español",
  ja: "日本語",
  ko: "한국어",
};
/** Match browser preferences in order; only supported locales can be selected. */
export function preferredLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === "zh") return "zh-CN";
    if (base === "en") return "en-US";
    if (base === "es" || base === "ja" || base === "ko") return base;
  }
  return "en-US";
}
export function validLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}
const entries = { ...dictionary, ...researchDictionary } as Record<
  string,
  Partial<Record<Locale, string>>
>;
const originalByTranslation = new Map<string, string>();
for (const [original, versions] of Object.entries(entries))
  for (const value of Object.values(versions))
    if (value) originalByTranslation.set(value, original);
export function translate(locale: Locale, text: string): string {
  const original = entries[text]
    ? text
    : originalByTranslation.get(text) || text;
  return locale === "zh-CN" ? original : entries[original]?.[locale] || text;
}
