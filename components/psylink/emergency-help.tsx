"use client";
import { useEffect, useRef, useState } from 'react';
import { Phone, ArrowUpRight } from 'lucide-react';
import { useLocale } from './locale';
import { emergencyDirectory, emergencyChecked, supportedEmergencyCountry } from '@/lib/psylink/emergency';
export function EmergencyHelp() {
  const {locale,t} = useLocale();
  const [country,setCountry] = useState('');
  const [detected,setDetected] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const manual = useRef(false);
  useEffect(()=>{
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),4000);
    fetch('/api/emergency-region',{cache:'no-store',signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return response.json();})
      .then(data=>{if(controller.signal.aborted)return;const region=typeof data.country==='string'&&/^[A-Z]{2}$/.test(data.country)?data.country:null;setDetected(region);if(!manual.current)setCountry(supportedEmergencyCountry(region)||'');})
      .catch(()=>{})
      .finally(()=>{clearTimeout(timer);setLoading(false);});
    return ()=>{clearTimeout(timer);controller.abort();};
  },[]);
  const names = new Intl.DisplayNames([locale],{type:'region'});
  const resources = supportedEmergencyCountry(country) ? emergencyDirectory[country] : [];
  return <section className="emergency-help" aria-label={t('当地紧急联系方式')}>
    <label className="emergency-country">{t('你目前所在的国家或地区')}
      <select value={country} onChange={event=>{manual.current=true;setCountry(event.target.value);}}>
        <option value="">{t('请选择所在地')}</option>
        {Object.keys(emergencyDirectory).sort((a,b)=>(names.of(a)||a).localeCompare(names.of(b)||b,locale)).map(code=><option key={code} value={code}>{names.of(code)||code}{code==='CN'?` · ${t('中国大陆')}`:''}</option>)}
        <option value="other">{t('其他国家或地区')}</option>
      </select>
    </label>
    <p className="fine-print" role="status">{t(manual.current?'按你选择的所在地显示。':loading?'正在确认访问所在国家…':detected?'默认参考访问 IP 的国家；VPN 可能影响判断，请确认所在地。':'无法确认所在地，请手动选择。')}</p>
    {resources.length ? <div className="emergency-resources">{resources.map(resource=><article className={`emergency-resource ${resource.crisis?'crisis':''}`} key={resource.number}>
      <div><span>{t(resource.crisis?'心理危机支持':'紧急救援')}</span><p>{t(resource.label)}</p></div>
      <a className="emergency-call" href={`tel:${resource.number}`} aria-label={`${t('拨打')} ${resource.number}`}><Phone size={17}/>{resource.number}</a>
      <footer><a href={resource.source} target="_blank" rel="noreferrer">{t('官方来源')}<ArrowUpRight size={12}/></a>{resource.crisis&&<a href="sms:988">{t('发送短信至 988')}</a>}<small>{t('核验：')}{emergencyChecked}</small></footer>
    </article>)}</div> : <div className="safety-box"><strong>{t('请联系所在地的官方紧急服务')}</strong><p>{t('未确认所在地或目录尚未覆盖这里，不能假定 911、110 或 112 适用。请向身边的人、当地警方或最近的急诊求助。')}</p></div>}
    <p className="fine-print">{t('号码适用于所选所在地。点击会打开设备的拨号功能；Bloomie 不会代你呼叫，也没有真人值守。')}</p>
  </section>;
}
