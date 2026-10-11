import { TogetherProvider } from "@/components/psylink/together-state";
import { Bloomie } from "@/components/psylink/app";
import { LocaleProvider } from "@/components/psylink/locale";
import { CatalogProvider } from "@/components/psylink/catalog";
import { Specular } from "@/components/psylink/material";
export default function Home() {
  return (
    <LocaleProvider>
      <Specular />
      <CatalogProvider><TogetherProvider><Bloomie /></TogetherProvider></CatalogProvider>
    </LocaleProvider>
  );
}
