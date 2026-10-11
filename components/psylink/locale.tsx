"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import {
  translate,
  preferredLocale,
  validLocale,
  locales,
  localeLabels,
  type Locale,
} from "@/lib/psylink/i18n";
const Context = createContext({
  locale: "en-US" as Locale,
  setLocale: (_value: Locale) => {void _value;},
  t: (text: string) => text,
});
export function LocaleProvider({ children, titles }: { children: ReactNode; titles?: {"zh-CN":string;"en-US":string} }) {
  const [locale, setLocale] = useState<Locale>("en-US");
  useEffect(() => {
    let initial = preferredLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    try {
      const value = localStorage.getItem("psylink-locale");
      if (validLocale(value)) initial = value;
    } catch {}
    setLocale(initial);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = titles ? titles[locale === "zh-CN" ? "zh-CN" : "en-US"] : translate(locale, "Bloomie · 给家庭一处安心的空间");
  }, [locale,titles]);
  const change = (value: Locale) => {
    setLocale(value);
    try {
      localStorage.setItem("psylink-locale", value);
    } catch {}
  };
  return (
    <Context.Provider
      value={{
        locale,
        setLocale: change,
        t: (text) => translate(locale, text),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLocale() {
  return useContext(Context);
}
export function LanguagePicker() {
  const { locale, setLocale, t } = useLocale();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="language-picker" aria-label={`${t("语言")}: ${localeLabels[locale]}`}>
          <span>{localeLabels[locale]}</span><ChevronDown size={15} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="language-menu" align="end" sideOffset={8} collisionPadding={12} aria-label={t("语言")}>
          <DropdownMenu.RadioGroup value={locale} onValueChange={value=>{if(validLocale(value))setLocale(value);}}>
            {locales.map(value=>(
              <DropdownMenu.RadioItem className="language-option" key={value} value={value}>
                <span lang={value}>{localeLabels[value]}</span>
                <DropdownMenu.ItemIndicator className="language-check"><Check size={16} aria-hidden="true" /></DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
