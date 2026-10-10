"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {buildCatalog,type Catalog} from "@/lib/admin/catalog";
import {useLocale} from "./locale";
const Context=createContext<Catalog>(buildCatalog([],"zh-CN"));
export function CatalogProvider({children}:{children:ReactNode}){
  const {locale}=useLocale();const [catalog,setCatalog]=useState<Catalog>(buildCatalog([],locale));
  useEffect(()=>{
    const controller=new AbortController();let generation=0;
    const refresh=async()=>{const current=++generation;try{const r=await fetch(`/api/catalog?locale=${locale}`,{cache:"no-store",signal:controller.signal});if(r.ok){const data=await r.json();if(current===generation&&!controller.signal.aborted)setCatalog(data);}}catch{}};
    setCatalog(buildCatalog([],locale));void refresh();
    const onFocus=()=>void refresh();window.addEventListener("focus",onFocus);
    const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);
    return()=>{controller.abort();window.removeEventListener("focus",onFocus);clearInterval(timer);};
  },[locale]);
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}
export const useCatalog=()=>useContext(Context);
