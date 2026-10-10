import {locales,type Locale} from '@/lib/psylink/i18n';
import {httpsURL} from '@/lib/admin/model';
export type EventCopy={title:string;description:string;schedule:string;venue:string};
export type EventData={copy:Partial<Record<Locale,EventCopy>>;organizer:string;officialUrl:string;checkedAt:string;category:'arts'|'community'|'reading';color:'sage'|'sand'|'clay'|'blue';annual:boolean;nextDateConfirmed:boolean};
export type CommunityEvent={id:string;data:EventData;version:number;deleted:boolean;published:boolean;updated_at:string};
export type Registration={event_id:string;user_id:string;status:'interested'|'cancelled';created_at:string;updated_at:string;email?:string};
export type Counts={event_id:string;interested:number;cancelled:number};
const str=(v:unknown,n:number)=>typeof v==='string'&&v.length<=n;
export function validEvent(value:unknown):value is CommunityEvent {const e=value as CommunityEvent,p=e?.data;if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(e.id)||!Number.isInteger(e.version)||e.version<0||!p||!p.copy||typeof p.copy!=='object'||!['arts','community','reading'].includes(p.category)||!['sage','sand','clay','blue'].includes(p.color)||typeof p.annual!=='boolean'||typeof p.nextDateConfirmed!=='boolean'||!str(p.organizer,200)||!httpsURL(p.officialUrl,true)||!str(p.checkedAt,10))return false;return Object.keys(p.copy).every(l=>locales.includes(l as Locale))&&Object.values(p.copy).every(c=>!!c&&str(c.title,180)&&str(c.description,2000)&&str(c.schedule,300)&&str(c.venue,300))&&!!p.copy['en-US']?.title.trim();}
export function canPublish(e:CommunityEvent){return validEvent(e)&&!!e.data.organizer.trim()&&httpsURL(e.data.officialUrl)&&/^\d{4}-\d{2}-\d{2}$/.test(e.data.checkedAt)&&!!e.data.copy['en-US']?.description.trim()&&!!e.data.copy['en-US']?.schedule.trim()&&Object.values(e.data.copy).every(c=>!!c.title.trim()&&!!c.description.trim()&&!!c.schedule.trim()&&!!c.venue.trim());}
export function eventCopy(e:CommunityEvent,locale:Locale){return e.data.copy[locale]||e.data.copy['en-US']!;}
export function emptyEvent():CommunityEvent{return {id:crypto.randomUUID(),version:0,deleted:false,published:false,updated_at:'',data:{copy:{'en-US':{title:'',description:'',schedule:'',venue:''}},organizer:'',officialUrl:'',checkedAt:'',category:'community',color:'sage',annual:false,nextDateConfirmed:false}};}
