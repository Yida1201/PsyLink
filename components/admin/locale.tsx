"use client";
import {useLocale} from '@/components/psylink/locale';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {Check,ChevronDown} from 'lucide-react';
import {adminEnglish} from '@/lib/admin/translations';
export function useAdminLocale(){
 const {locale,setLocale,t}=useLocale(),english=locale!=='zh-CN',uiLocale:'en-US'|'zh-CN'=english?'en-US':'zh-CN';
 const at=(text:string)=>{if(!english)return text;const exact=adminEnglish[text.trim()];if(exact)return exact;const imported=text.match(/^已导入 (\d+) 份初始材料为草稿，没有自动发布。$/);if(imported)return `Imported ${imported[1]} initial materials as drafts. Nothing was published automatically.`;return t(text);};
 return {at,english,uiLocale,setLocale};
}
export function AdminLanguagePicker(){const {english,setLocale}=useAdminLocale();return <DropdownMenu.Root modal={false}><DropdownMenu.Trigger asChild><button type="button" className="language-picker" aria-label={english?'Studio language':'后台语言'}><span>{english?'English (US)':'简体中文'}</span><ChevronDown size={15}/></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="language-menu" align="end" sideOffset={8} collisionPadding={12}><DropdownMenu.RadioGroup value={english?'en-US':'zh-CN'} onValueChange={v=>setLocale(v as 'en-US'|'zh-CN')}>{[['zh-CN','简体中文'],['en-US','English (US)']].map(([value,label])=><DropdownMenu.RadioItem className="language-option" value={value} key={value}><span lang={value}>{label}</span><DropdownMenu.ItemIndicator className="language-check"><Check size={16}/></DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}</DropdownMenu.RadioGroup></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>}
