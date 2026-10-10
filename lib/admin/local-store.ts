import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { seedRecords } from "./seed";
import { AdminError } from "./access";
import { canEdit, canTransition, publicationError, publicPayload, type RecordItem, type Publication, type Audit, type Role, type Status, type Checks } from "./model";
type Store={records:RecordItem[];publications:Publication[];audit:Audit[]};
const folder=path.join(process.cwd(),".data");
const file=path.join(folder,"admin-preview.json");
const state=globalThis as typeof globalThis & {bloomieAdminQueue?:Promise<unknown>};
export async function readLocal():Promise<Store> {
  try {return JSON.parse(await readFile(file,"utf8"));} catch(e) {
    if ((e as NodeJS.ErrnoException).code!=="ENOENT") throw e;
    return {records:seedRecords(),publications:[],audit:[]};
  }
}
async function mutate<T>(fn:(s:Store)=>T):Promise<T> {
  const job=(state.bloomieAdminQueue || Promise.resolve()).then(async()=>{
    const s=await readLocal(), result=fn(s);
    await mkdir(folder,{recursive:true});
    const temp=file+"."+crypto.randomUUID()+".tmp";
    await writeFile(temp,JSON.stringify(s),{mode:0o600}); await rename(temp,file); return result;
  });
  state.bloomieAdminQueue=job.catch(()=>{}); return job;
}
function event(s:Store,r:RecordItem,action:string){s.audit.unshift({id:crypto.randomUUID(),record_id:r.id,action,actor:"local-preview",created_at:r.updated_at,version:r.version});s.audit=s.audit.slice(0,200);}
export function saveLocal(input:RecordItem,role:Role){return mutate(s=>{
  if(!canEdit(role))throw new AdminError("只有编辑或管理员可以修改资料。",403);
  const current=s.records.find(r=>r.id===input.id);
  if ((current?.version||0)!==input.version)throw new AdminError("资料已被其他操作修改，请刷新后重新编辑。",409);
  if(current&&(current.kind!==input.kind||current.content_id!==input.content_id||current.locale!==input.locale))throw new AdminError("现有资料的编号与语言不能改变。",400);
  if(s.records.some(r=>r.id!==input.id&&r.kind===input.kind&&r.content_id===input.content_id&&r.locale===input.locale))throw new AdminError("该编号与语言已有资料。",409);
  const next={...input,status:"draft" as const,version:input.version+1,updated_at:new Date().toISOString()};
  s.records=s.records.filter(r=>r.id!==input.id);s.records.push(next);event(s,next,"save");return next;
});}
export function transitionLocal(id:string,version:number,status:Status,checks:Checks,role:Role){return mutate(s=>{
  if(!canTransition(role,status))throw new AdminError("当前角色不能执行这个审核操作。",403);
  const r=s.records.find(r=>r.id===id);if(!r)throw new AdminError("资料不存在。",404);
  if(r.version!==version)throw new AdminError("资料已更新，请刷新后重试。",409);
  if(status==="published"){
    if(r.status!=="review")throw new AdminError("请先将草稿提交审核。",400);
    const error=publicationError(r,checks);if(error)throw new AdminError(error);
    s.publications=s.publications.filter(p=>p.id!==id);s.publications.push({id,content_id:r.content_id,kind:r.kind,locale:r.locale,payload:publicPayload(r.payload),active:true});
  } else if(status==="review" && r.status!=="draft") throw new AdminError("只有草稿可以提交审核。");
  else if(status==="archived"){
    s.publications=s.publications.filter(p=>p.id!==id);s.publications.push({id,content_id:r.content_id,kind:r.kind,locale:r.locale,payload:{} as Publication["payload"],active:false});
  }
  r.status=status;r.version++;r.updated_at=new Date().toISOString();event(s,r,status);if(status==="published")s.audit[0].details=checks;return r;
});}
