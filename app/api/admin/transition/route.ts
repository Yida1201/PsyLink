import { access, reply, failure, readBody, AdminError } from "@/lib/admin/access";
import { transitionLocal } from "@/lib/admin/local-store";
import { canTransition, publicationError, type Checks, type Status } from "@/lib/admin/model";
export const runtime="nodejs";
export async function POST(request:Request){try{
  const a=await access(request),b=await readBody(request);
  if(!b || typeof b.id!=="string" || !Number.isInteger(b.version) || !["draft","review","published","archived"].includes(b.status))throw new AdminError("审核请求格式不正确。");
  const status=b.status as Status,checks=(b.checks||{}) as Checks;
  if(!canTransition(a.role,status))throw new AdminError("当前角色没有审核发布权限。",403);
  if(a.mode==="local")return reply({record:await transitionLocal(b.id,b.version,status,checks,a.role)});
  if(status==="published"){
    const {data,error}=await a.client.from("bloomie_records").select("*").eq("id",b.id).single();
    if(error)throw new AdminError("资料不存在。",404);
    const validation=publicationError(data,checks);if(validation)throw new AdminError(validation);
  }
  const {data,error}=await a.client.rpc("bloomie_transition",{record_id:b.id,expected_version:b.version,next_status:status,review_checks:checks});
  if(error)throw new AdminError(error.code==="40001"?"资料已更新，请刷新后重试。":"审核操作失败，请检查状态、复核项目与权限。",error.code==="40001"?409:400);
  return reply({record:data});
}catch(e){return failure(e);}}
