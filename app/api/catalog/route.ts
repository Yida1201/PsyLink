import {publicCatalog} from "@/lib/admin/public-store";
import {validLocale} from "@/lib/psylink/i18n";
export const runtime="nodejs";
export async function GET(request:Request){
  const locale=new URL(request.url).searchParams.get("locale");
  if(!validLocale(locale))return Response.json({error:"Unsupported language"},{status:400});
  try {const data=await publicCatalog(request,locale);return Response.json(data,{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"内容暂时无法读取。"},{status:503});}
}
