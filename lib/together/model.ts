import rows from './activities.json';
import {familyCircleConfig} from './config';
import type {Locale} from '@/lib/psylink/i18n';
export const ages=['baby','toddler','preschool'] as const;
export type Age=typeof ages[number];
export const categories=['read','routine','emotion','move'] as const;
export type Category=typeof categories[number];
export type Copy={title:string;materials:string[];steps:string[];why:string};
export type Activity={id:string;age:Age;category:Category;minutes:number;relatedArticleId:string;reviewStatus:string;copy:{'zh-CN':Copy;'en-US':Copy}};
export const activities=rows as Activity[];
export const localized=<T>(copy:{'zh-CN':T;'en-US':T},locale:Locale):T=>copy[locale==='zh-CN'?'zh-CN':'en-US'];
export function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function weekDates(day:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return [];const date=new Date(day+'T12:00:00');date.setDate(date.getDate()-((date.getDay()+6)%7));return Array.from({length:7},(_,i)=>{const d=new Date(date);d.setDate(d.getDate()+i);return dateKey(d);});}
export type ThemeWeek={id:string;weekOf:string;start:string;category:Category;title:{'zh-CN':string;'en-US':string}};
export function weekTheme<T extends ThemeWeek=ThemeWeek>(day:string,weeks:readonly T[]=familyCircleConfig.weeks as unknown as readonly T[]){return weeks.find(w=>w.weekOf===weekDates(day)[0]);}
export function circleForDay<T extends ThemeWeek=ThemeWeek>(day:string,weeks:readonly T[]=familyCircleConfig.weeks as unknown as readonly T[]){return weekTheme(day,weeks)||weeks.find(w=>w.weekOf>day)||weeks.at(-1);}
function hash(text:string){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function recommend(day:string,age:Age,swap=0,category?:Category,exclude:string[]=[],catalog:Activity[]=activities,weeks:readonly ThemeWeek[]=familyCircleConfig.weeks){const theme=category||weekTheme(day,weeks)?.category;let pool=catalog.filter(a=>a.age===age&&(!theme||a.category===theme));if(!pool.length)pool=catalog.filter(a=>a.age===age);if(!pool.length)return undefined;const start=hash(day+':'+age)%pool.length;const options=Array.from({length:pool.length},(_,i)=>pool[(start+i)%pool.length]);return options.find((a,i)=>i>=swap&&!exclude.includes(a.id))||options.find(a=>!exclude.includes(a.id))||catalog.find(a=>a.age===age&&!exclude.includes(a.id))||pool[start];}
export type Completion={id:string;age:Age;note:string;at:string};
export type Choice={id:string;swaps:number;seen:string[]};
export type LocalState={ages:Age[];dailyReminder:{enabled:boolean;time:string};choices:Record<string,Partial<Record<Age,Choice>>>;completions:Record<string,Completion[]>;circles:Record<string,{interested:boolean;remind:boolean}>;snooze:Record<string,number>;notified:Record<string,boolean>};
export const emptyState=():LocalState=>({ages:[],dailyReminder:{enabled:false,time:'19:00'},choices:{},completions:{},circles:{},snooze:{},notified:{}});
export function parseState(raw:string|null):LocalState{let input;try{input=JSON.parse(raw||'null');}catch{return emptyState();}const next=emptyState();if(!input||typeof input!=='object')return next;
 next.ages=Array.isArray(input.ages)?ages.filter(a=>input.ages.includes(a)):[];next.dailyReminder={enabled:input.dailyReminder?.enabled===true,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(input.dailyReminder?.time)?input.dailyReminder.time:'19:00'};
 for(const [day,list] of Object.entries(input.completions||{})){if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Array.isArray(list))next.completions[day]=list.filter(c=>c&&ages.includes(c.age)&&typeof c.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(c.id)).map(c=>({id:c.id,age:c.age,note:typeof c.note==='string'?c.note.slice(0,200):'',at:typeof c.at==='string'?c.at:''}));}
 for(const [day,list] of Object.entries(input.choices||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!list||typeof list!=='object')continue;next.choices[day]={};for(const age of ages){const c=(list as Record<string,Choice>)[age];if(c&&typeof c.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(c.id)&&Number.isInteger(c.swaps)&&c.swaps>=0&&c.swaps<=2)next.choices[day]![age]={id:c.id,swaps:c.swaps,seen:Array.isArray(c.seen)?c.seen.filter(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)).slice(0,3):[c.id]};}}
 for(const [id,c] of Object.entries(input.circles||{}) as [string,{interested?:boolean;remind?:boolean}][]){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))continue;if(c)next.circles[id]={interested:c.interested===true,remind:c.remind===true};}
 for(const [day,time] of Object.entries(input.snooze||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&typeof time==='number'&&Number.isFinite(time))next.snooze[day]=time;
 for(const [key,value] of Object.entries(input.notified||{}))if(value===true&&/^(daily:|snooze:|circle:)/.test(key))next.notified[key]=true;
 return next;}
export function selectedActivity(s:LocalState,day:string,age:Age,catalog:Activity[]=activities,weeks:readonly ThemeWeek[]=familyCircleConfig.weeks){const choice=s.choices[day]?.[age];return catalog.find(a=>a.id===choice?.id&&a.age===age)||recommend(day,age,0,undefined,[],catalog,weeks);}
export function dailySwapCount(s:LocalState,day:string){return Object.values(s.choices[day]||{}).reduce((sum,c)=>sum+(c?.swaps||0),0);}
export function swapActivity(s:LocalState,day:string,age:Age,catalog:Activity[]=activities,weeks:readonly ThemeWeek[]=familyCircleConfig.weeks){const current=selectedActivity(s,day,age,catalog,weeks);if(!current)return s;const choice=s.choices[day]?.[age]||{id:current.id,swaps:0,seen:[current.id]};if(dailySwapCount(s,day)>=2)return s;const next=recommend(day,age,choice.swaps+1,undefined,choice.seen,catalog,weeks);if(!next)return s;return {...s,choices:{...s.choices,[day]:{...s.choices[day],[age]:{id:next.id,swaps:choice.swaps+1,seen:[...choice.seen,next.id]}}}};}
export function completeActivity(s:LocalState,day:string,a:Activity,note?:string){const list=s.completions[day]||[],old=list.find(c=>c.id===a.id&&c.age===a.age);return {...s,completions:{...s.completions,[day]:[...list.filter(c=>c!==old),{id:a.id,age:a.age,note:(note??old?.note??'').slice(0,200),at:old?.at||new Date().toISOString()}]}};}
export function completedDays(s:LocalState,day:string){return weekDates(day).filter(d=>(s.completions[d]?.length||0)>0);}
export function dueReminders(s:LocalState,now:Date,weeks:readonly ThemeWeek[]=familyCircleConfig.weeks){const day=dateKey(now),done=(s.completions[day]?.length||0)>0,out:{id:string;type:'daily'|'circle';circleId?:string}[]=[];
 const [h,m]=s.dailyReminder.time.split(':').map(Number),time=now.getHours()*60+now.getMinutes();
 if(s.dailyReminder.enabled&&s.ages.length&&!done&&(!s.snooze[day]||now.getTime()>=s.snooze[day])&&time>=h*60+m&&!s.notified['daily:'+day])out.push({id:'daily:'+day,type:'daily'});
 if(s.snooze[day]&&!done&&now.getTime()>=s.snooze[day]&&!s.notified['snooze:'+day+':'+s.snooze[day]])out.push({id:'snooze:'+day+':'+s.snooze[day],type:'daily'});
 for(const w of weeks){const start=new Date(w.start).getTime();if(s.circles[w.id]?.remind&&now.getTime()>=start-86400000&&now.getTime()<start&&!s.notified['circle:'+w.id])out.push({id:'circle:'+w.id,type:'circle',circleId:w.id});}
 return out.filter((r,i)=>r.type==='circle'||out.findIndex(v=>v.type==='daily')===i);
}

export function acknowledgeReminder(s:LocalState,id:string,day:string){return {...s,notified:{...s.notified,[id]:true,...(id.startsWith('daily:')||id.startsWith('snooze:')?{['daily:'+day]:true,...(s.snooze[day]?{['snooze:'+day+':'+s.snooze[day]]:true}:{})}:{})}};}
