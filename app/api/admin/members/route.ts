import { access, reply, failure, readBody, AdminError } from "@/lib/admin/access";
export async function POST(request:Request){try{
  const a=await access(request);if(a.role!=="admin")throw new AdminError("只有管理员可以管理成员。",403);
  if(a.mode==="local")throw new AdminError("本地预览不修改真实账号权限，请在 Supabase 模式下操作。");
  const b=await readBody(request);
  if(!b || !/^[a-f0-9-]{36}$/i.test(b.userId) || !["admin","editor","reviewer","remove"].includes(b.role))throw new AdminError("请提供已注册账号的 UUID 和有效角色。");
  const {error}=await a.client.rpc("bloomie_set_staff",{target_user:b.userId,next_role:b.role});
  if(error)throw new AdminError("操作失败：账号需已注册，且至少保留一位管理员。");
  return reply({ok:true});
}catch(e){return failure(e);}}
