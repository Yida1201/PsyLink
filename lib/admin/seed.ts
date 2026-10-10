import { articles, sources, professionals } from "@/lib/psylink/content";
import { podcasts } from "@/lib/psylink/podcasts";
import { emptyPayload, type RecordItem } from "./model";
import research from "@/lib/psylink/research.json";
export function seedRecords(): RecordItem[] {
  const stamp=new Date().toISOString();
  const wrap=(kind:RecordItem["kind"],id:string,payload:RecordItem["payload"]):RecordItem=>({id:`seed-${kind}-${id}`,content_id:id,kind,locale:"zh-CN",payload,status:"draft",version:1,updated_at:stamp});
  return [
    ...articles.map(a=>wrap("article",a.id,{...emptyPayload(),...a,research:a.kind === "research",knowledgeEnabled:true,source:sources.find(s=>s.id===a.sourceId)!,keywords:research.find(r=>r.id===a.id)?.keywords || [a.category]})),
    ...podcasts.map(p=>wrap("podcast",p.id,{...emptyPayload(),...p,subtitle:p.description})),
    ...professionals.map(p=>wrap("professional",p.id,{...emptyPayload(),title:p.name,category:p.role,subtitle:p.description,series:p.focus})),
  ];
}
