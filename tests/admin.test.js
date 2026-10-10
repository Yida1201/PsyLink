import {test,expect} from "bun:test";
import {emptyPayload,validateRecord,publicationError,canEdit,canTransition} from "../lib/admin/model";
import {buildCatalog} from "../lib/admin/catalog";
import {localAdmin,guardOrigin} from "../lib/admin/access";
import {retrieveKnowledge} from "../lib/psylink/knowledge";
const record=()=>({id:"test-record",content_id:"test-reading",kind:"article",locale:"en-US",version:1,status:"review",updated_at:"",payload:{...emptyPayload(),title:"A bedtime reading",subtitle:"Test catalog entry",paragraphs:[{heading:"Finding",text:"A source-based summary."},{heading:"Scope",text:"Ages 7 to 36 months."},{heading:"Limits",text:"Short study, parent report."}],research:true,knowledgeEnabled:true,keywords:["bedtime"],source:{id:"editable",title:"Sleep study",publisher:"Sleep",url:"https://pubmed.ncbi.nlm.nih.gov/19480226/",checked:"2026-10-10"}}});
test("admin role boundaries separate editing from review",()=>{expect(canEdit("editor")).toBe(true);expect(canEdit("reviewer")).toBe(false);expect(canTransition("editor","published")).toBe(false);expect(canTransition("reviewer","published")).toBe(true);expect(canTransition("reviewer","review")).toBe(false);});
test("publication requires complete review, provenance, scope and licensed media",()=>{
  const r=record(),checks={source:true,rights:true,professional:true};
  expect(publicationError(r,checks)).toBe(null);
  expect(publicationError(r,{...checks,professional:false})).not.toBe(null);
  expect(publicationError({...r,payload:{...r.payload,source:{...r.payload.source,url:""}}},checks)).not.toBe(null);
  expect(publicationError({...r,payload:{...r.payload,paragraphs:r.payload.paragraphs.slice(0,1)}},checks)).not.toBe(null);
  expect(publicationError({...r,kind:"podcast",payload:{...r.payload,isDemo:false,audioUrl:""}},checks)).not.toBe(null);
  expect(publicationError({...r,kind:"professional",payload:{...r.payload,isDemo:false}},checks)).not.toBe(null);
});
test("CMS blocks unsafe links, path IDs and malformed paragraph data",()=>{
  const r=record();expect(validateRecord(r)).toBe(true);
  expect(validateRecord({...r,id:"../../private"})).toBe(false);
  expect(validateRecord({...r,payload:{...r.payload,audioUrl:"javascript:alert(1)"}})).toBe(false);
  expect(validateRecord({...r,payload:{...r.payload,paragraphs:"raw"}})).toBe(false);
  expect(validateRecord({...r,payload:{...r.payload,contactUrl:"https://user:pass@example.com/"}})).toBe(false);
});
test("published content connects to matching-language shelf, sources and chat",()=>{
  const r=record(),catalog=buildCatalog([{...r,active:true}],"en-US");
  expect(catalog.articles.some(a=>a.id===r.content_id)).toBe(true);
  expect(catalog.sources.some(s=>s.id==="cms-test-record")).toBe(true);
  const result=retrieveKnowledge([{role:"user",content:"bedtime"}],"en-US",catalog);
  expect(result.evidence.some(e=>e.sourceId==="cms-test-record")).toBe(true);
  expect(buildCatalog([{...r,active:true}],"zh-CN").articles.some(a=>a.id===r.content_id)).toBe(false);
});
test("unpublish suppresses built-in IDs and standalone evidence without leaking private credentials",()=>{
  const r=record();expect(buildCatalog([{...r,content_id:"pause",active:false}],"en-US").articles.some(a=>a.id==="pause")).toBe(false);
  const prof={...r,kind:"professional",payload:{...r.payload,qualificationReference:"https://example.org/private",consentNote:"staff-only"},active:true};
  const catalog=buildCatalog([prof],"en-US");expect(JSON.stringify(catalog)).not.toContain("staff-only");expect(JSON.stringify(catalog)).not.toContain("example.org/private");
  const kb=buildCatalog([{...r,kind:"knowledge",active:true}],"en-US");expect(kb.knowledge.some(a=>a.id===r.content_id)).toBe(true);expect(kb.articles.some(a=>a.id===r.content_id)).toBe(false);
});
test("local admin preview never permits production or nonlocal host, rejects cross-site requests",()=>{
  const env={NODE_ENV:process.env.NODE_ENV,LOCAL_ADMIN_PREVIEW:process.env.LOCAL_ADMIN_PREVIEW};
  try{process.env.LOCAL_ADMIN_PREVIEW="true";process.env.NODE_ENV="development";expect(localAdmin(new Request("http://localhost:3000/admin"))).toBe(true);expect(localAdmin(new Request("https://example.com/admin"))).toBe(false);process.env.NODE_ENV="production";expect(localAdmin(new Request("http://localhost:3000/admin"))).toBe(false);expect(()=>guardOrigin(new Request("http://localhost:3000/admin",{headers:{origin:"https://attacker.example","host":"localhost:3000"}}))).toThrow();expect(()=>guardOrigin(new Request("http://localhost:3000/admin",{headers:{"sec-fetch-site":"cross-site"}}))).toThrow();}
  finally{for(const [k,v] of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
