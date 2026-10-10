import {articles,sources,type Article,type Source,type Professional} from "@/lib/psylink/content";
import {demoProfessionals} from "@/lib/psylink/demo-professionals";
import {podcasts,type Podcast} from "@/lib/psylink/podcasts";
import {translate,type Locale} from "@/lib/psylink/i18n";
import {emptyPayload,validateRecord,type Publication} from "./model";
export type Catalog={articles:Article[];sources:Source[];professionals:Professional[];podcasts:Podcast[];knowledge:Article[];mode:string;notice?:string};
export function buildCatalog(rows:Publication[],locale:Locale,mode="builtin"):Catalog {
  const localized=(a:Article)=>({...a,title:translate(locale,a.title),subtitle:translate(locale,a.subtitle),paragraphs:a.paragraphs.map(p=>({heading:translate(locale,p.heading),text:translate(locale,p.text)}))});
  const result:Catalog={articles:articles.map(localized),sources:[...sources],professionals:demoProfessionals(locale),podcasts:podcasts.map(p=>({...p,title:translate(locale,p.title),series:translate(locale,p.series),description:translate(locale,p.description),isDemo:true})),knowledge:articles.map(localized),mode};
  for(const row of rows.filter(r=>r.locale===locale)){
    if(!row.active){
      if(row.kind==="knowledge")result.knowledge=result.knowledge.filter(a=>a.id!==row.content_id);
      if(row.kind==="article"){result.articles=result.articles.filter(a=>a.id!==row.content_id);result.knowledge=result.knowledge.filter(a=>a.id!==row.content_id);}
      if(row.kind==="professional")result.professionals=result.professionals.filter(p=>p.id!==row.content_id);
      if(row.kind==="podcast")result.podcasts=result.podcasts.filter(p=>p.id!==row.content_id);
      continue;
    }
    const p={...emptyPayload(),...row.payload,qualificationReference:"",consentNote:""};
    if(!validateRecord({...row,payload:p,version:1,status:"published",updated_at:""}))continue;
    if(row.kind==="article"||row.kind==="knowledge"){
      // IDs come from the published record, never an external source's editable ID.
      const sourceId=`cms-${row.id}`;
      const article:Article={id:row.content_id,title:p.title,subtitle:p.subtitle,category:p.category,minutes:p.minutes,color:p.color,motif:p.motif,sourceId,kind:p.research?"research":undefined,keywords:p.keywords,reviewed:mode==="supabase",paragraphs:p.paragraphs};
      result.sources.push({...p.source,id:sourceId});
      if(row.kind==="article")result.articles=[...result.articles.filter(a=>a.id!==row.content_id),article];
      result.knowledge=result.knowledge.filter(a=>a.id!==row.content_id);
      if(row.kind==="knowledge"||p.knowledgeEnabled)result.knowledge.push(article);
    }
    if(row.kind==="professional")result.professionals=[...result.professionals.filter(a=>a.id!==row.content_id),{id:row.content_id,name:p.title,role:p.category,description:p.subtitle,focus:p.series,initial:p.title[0],color:p.color,isDemo:p.isDemo,contactUrl:p.contactUrl,qualification:p.qualification}];
    if(row.kind==="podcast")result.podcasts=[...result.podcasts.filter(a=>a.id!==row.content_id),{id:row.content_id,title:p.title,description:p.subtitle,series:p.series,minutes:p.minutes,color:p.color,articleId:p.articleId,audioUrl:p.audioUrl,isDemo:p.isDemo}];
  }
  return result;
}
