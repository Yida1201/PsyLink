import { createClient } from "@/lib/supabase/server";
import { validSupabaseConfig } from "@/lib/supabase/config";
import type { Role } from "./model";
export class AdminError extends Error { constructor(message:string,public status=400){super(message);} }
export function localAdmin(request: Request) {
  const host=request.headers.get("host") || new URL(request.url).host;
  const forwarded=request.headers.get("x-forwarded-host");
  return process.env.NODE_ENV === "development" && process.env.LOCAL_ADMIN_PREVIEW === "true" && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) && (!forwarded || forwarded===host);
}
export function guardOrigin(request:Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new AdminError("请求来源不被允许。",403);
  const origin=request.headers.get("origin");
  if(origin){try{if(new URL(origin).host !== (request.headers.get("host") || new URL(request.url).host))throw new Error();}catch{throw new AdminError("请求来源不被允许。",403);}}
}
export async function access(request:Request) {
  guardOrigin(request);
  if (localAdmin(request)) return {mode:"local" as const,role:"admin" as Role,actor:"local-preview",client:null};
  if (!validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) throw new AdminError("请先配置 Supabase 与后台数据库。",503);
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) throw new AdminError("请先登录管理员账号。",401);
  const result=await client.from("bloomie_staff").select("role").eq("user_id",user.id).maybeSingle();
  if (result.error) throw new AdminError("后台数据库尚未就绪，请应用后台迁移文件。",503);
  if (!result.data || !["admin","editor","reviewer"].includes(result.data.role)) throw new AdminError("这个账号没有后台访问权限。",403);
  return {mode:"supabase" as const,role:result.data.role as Role,actor:user.id,client};
}
export function reply(data:unknown,status=200) {return Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
export function failure(e:unknown) { return reply({error:e instanceof AdminError?e.message:"服务暂时不可用，请稍后重试。"},e instanceof AdminError?e.status:503); }
export async function readBody(request:Request) {
  if (Number(request.headers.get("content-length")||0)>120000) throw new AdminError("资料过长。",413);
  const raw=await request.text();
  if (raw.length>60000) throw new AdminError("资料过长。",413);
  try {return JSON.parse(raw);} catch {throw new AdminError("资料格式不正确。",400);}
}
