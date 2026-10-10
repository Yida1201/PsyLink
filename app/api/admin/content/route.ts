import { access, reply, failure, readBody, AdminError } from "@/lib/admin/access";
import { readLocal, saveLocal } from "@/lib/admin/local-store";
import { validateRecord, canEdit } from "@/lib/admin/model";
import { seedRecords } from "@/lib/admin/seed";
export const runtime="nodejs";
export async function GET(request:Request){try{
  const a=await access(request);
  if(a.mode==="local"){const s=await readLocal();return reply({...s,records:[...s.records].sort((a,b)=>b.updated_at.localeCompare(a.updated_at)),mode:a.mode,role:a.role,seeds:[]});}
  const results=await Promise.all([a.client.from("bloomie_records").select("*").order("updated_at",{ascending:false}),a.client.from("bloomie_audit").select("*").order("created_at",{ascending:false}).limit(100),a.client.from("bloomie_staff").select("user_id,role")]);
  if(results.some(r=>r.error))throw new AdminError("后台数据读取失败，请检查迁移与权限。",503);
  return reply({records:results[0].data,audit:results[1].data,members:results[2].data,mode:a.mode,role:a.role,seeds:seedRecords()});
}catch(e){return failure(e);}}
export async function POST(request:Request){try{
  const a=await access(request),body=await readBody(request);
  if(!canEdit(a.role))throw new AdminError("当前角色只能审核，不能编辑。",403);
  if(!validateRecord(body))throw new AdminError("请检查标题、正文、语言及链接格式。",400);
  if(a.mode==="local")return reply({record:await saveLocal(body,a.role)});
  const {data,error}=await a.client.rpc("bloomie_save",{item:body,expected_version:body.version});
  if(error)throw new AdminError(error.code==="40001"?"资料已被修改，请刷新后重试。":"保存失败，请检查资料编号、内容格式及权限。",error.code==="40001"?409:400);
  return reply({record:data});
}catch(e){return failure(e);}}
