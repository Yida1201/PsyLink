import { validLocale, type Locale } from "@/lib/psylink/i18n";
import type { Source } from "@/lib/psylink/content";
export const kinds = ["article", "podcast", "knowledge", "professional"] as const;
export type Kind = (typeof kinds)[number];
export type Role = "admin" | "editor" | "reviewer";
export type Status = "draft" | "review" | "published" | "archived";
export type Payload = {
  title: string; subtitle: string; category: string; minutes: number;
  color: string; motif: "leaf" | "sun" | "waves" | "circles";
  paragraphs: { heading: string; text: string }[];
  source: Source; keywords: string[]; knowledgeEnabled: boolean;
  research: boolean; series: string; articleId: string; audioUrl: string;
  isDemo: boolean; contactUrl: string; qualification: string;
  qualificationReference: string; consentNote: string;
};
export type RecordItem = {
  id: string; content_id: string; kind: Kind; locale: Locale; payload: Payload;
  status: Status; version: number; updated_at: string;
};
export type Publication = Pick<RecordItem, "id" | "content_id" | "kind" | "locale"> & {payload: Payload; active: boolean};
export type Audit = {id: string; record_id: string; action: string; actor: string; created_at: string; version: number; details?:Checks};
export type Checks = {source: boolean; rights: boolean; professional: boolean};
export const labels: Record<Kind, string> = {article:"听读材料",podcast:"播客音源",knowledge:"知识库",professional:"咨询师入驻"};
export const statuses: Record<Status,string> = {draft:"草稿",review:"待审核",published:"已发布",archived:"已下架"};
export function emptyPayload(): Payload {
  return {title:"",subtitle:"",category:"亲子沟通",minutes:3,color:"sage",motif:"leaf",paragraphs:[{heading:"",text:""}],source:{id:"",title:"",publisher:"",url:"",checked:""},keywords:[],knowledgeEnabled:false,research:false,series:"",articleId:"",audioUrl:"",isDemo:true,contactUrl:"",qualification:"",qualificationReference:"",consentNote:""};
}
export function httpsURL(value: unknown, optional = false) {
  if (optional && value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !/^(localhost|127\.|0\.|\[::1\])/.test(u.hostname); } catch { return false; }
}
const short = (s: unknown, max: number) => typeof s === "string" && s.length <= max;
export function validateRecord(value: unknown): value is RecordItem {
  if (!value || typeof value !== "object") return false;
  const r = value as RecordItem, p = r.payload;
  if (!short(r.id,100) || !/^[a-zA-Z0-9_-]+$/.test(r.id) || !short(r.content_id,100) || !/^[a-zA-Z0-9_-]+$/.test(r.content_id) || !kinds.includes(r.kind) || !validLocale(r.locale) || !Number.isInteger(r.version) || r.version < 0 || !p) return false;
  return short(p.title,180) && !!p.title.trim() && short(p.subtitle,1500) && short(p.category,80) && Number.isInteger(p.minutes) && p.minutes > 0 && p.minutes <= 180 && ["sage","clay","sand","blue"].includes(p.color) && ["leaf","sun","waves","circles"].includes(p.motif) && Array.isArray(p.paragraphs) && p.paragraphs.length <= 30 && p.paragraphs.every(s=>short(s.heading,180)&&short(s.text,6000)) && Array.isArray(p.keywords) && p.keywords.length <= 80 && p.keywords.every(s=>short(s,80)) && typeof p.knowledgeEnabled === "boolean" && typeof p.research === "boolean" && typeof p.isDemo === "boolean" && [p.series,p.articleId,p.qualification,p.consentNote].every(s=>short(s,1500)) && httpsURL(p.audioUrl,true) && httpsURL(p.contactUrl,true) && httpsURL(p.qualificationReference,true) && !!p.source && [p.source.id,p.source.title,p.source.publisher,p.source.checked].every(s=>short(s,500)) && httpsURL(p.source.url,true);
}
export function publicationError(r: RecordItem, checks: Checks) {
  if (!validateRecord(r)) return "资料格式不完整，请先保存有效草稿。";
  if (!checks.source || !checks.rights || !checks.professional) return "发布前需要确认来源或身份、使用授权与专业复核。";
  const p=r.payload;
  if (r.kind === "article" || r.kind === "knowledge") {
    if (!p.paragraphs.some(s=>s.heading.trim()&&s.text.trim()) || !p.source.title.trim() || !p.source.publisher.trim() || !httpsURL(p.source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(p.source.checked)) return "请补齐正文、来源标题、机构、HTTPS 链接与核验日期。";
    if ((r.kind === "knowledge" || p.knowledgeEnabled) && !p.keywords.some(s=>s.trim())) return "聊天检索需要至少一个主题词。";
    if ((r.kind === "knowledge" || p.research) && p.paragraphs.length < 3) return "研究资料请分别说明发现、适用范围和局限，至少三个段落。";
  }
  if (r.kind === "podcast" && !p.isDemo && !httpsURL(p.audioUrl)) return "真实播客需要已获授权的 HTTPS 音源。";
  if (r.kind === "professional" && !p.isDemo && (!p.qualification.trim() || !httpsURL(p.qualificationReference) || !p.consentNote.trim() || !httpsURL(p.contactUrl))) return "真实咨询师需补齐资质、核验依据、入驻授权及联系渠道。";
  return null;
}
export function publicPayload(p: Payload): Payload {
  // Verification documents and consent notes are staff-only, never published.
  return {...p,qualificationReference:"",consentNote:""};
}
export function canEdit(role: Role) { return role === "admin" || role === "editor"; }
export function canTransition(role: Role, status: Status) {
  return status === "review" ? canEdit(role) : role === "admin" || role === "reviewer";
}
