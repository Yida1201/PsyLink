import {createClient} from "@/lib/supabase/server";
import {validSupabaseConfig} from "@/lib/supabase/config";
import {localAdmin} from "./access";
import {readLocal} from "./local-store";
import {buildCatalog} from "./catalog";
import type {Locale} from "@/lib/psylink/i18n";
export async function publicCatalog(request:Request,locale:Locale){
  if(localAdmin(request)){const s=await readLocal();return buildCatalog(s.publications,locale,"local");}
  if(validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)){
    try {const client=await createClient();const {data,error}=await client.from("bloomie_publications").select("id,content_id,kind,locale,payload,active").eq("locale",locale);if(!error)return buildCatalog(data||[],locale,"supabase");}catch{}
  }
  return {...buildCatalog([],locale),notice:"管理内容暂时未连接，当前显示内置材料。"};
}
