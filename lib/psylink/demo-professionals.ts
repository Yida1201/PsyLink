import {professionals,type Professional} from './content';
import {translate,type Locale} from './i18n';
// Fictional English demo personas. Never rename a published practitioner.
const englishPersonas=[
  {base:0,id:'lin',name:'Emily Carter'},
  {base:1,id:'chen',name:'Maya Johnson'},
  {base:2,id:'zhou',name:'Sofia Ramírez'},
  {base:0,id:'demo-daniel-kim',name:'Daniel Kim'},
] as const;
export function demoProfessionals(locale:Locale):Professional[]{
  const localize=(p:typeof professionals[number]):Professional=>({...p,name:translate(locale,p.name),role:translate(locale,p.role),focus:translate(locale,p.focus),description:translate(locale,p.description),initial:translate(locale,p.initial),isDemo:true});
  if(locale!=='en-US')return professionals.map(localize);
  return englishPersonas.map(persona=>({...localize(professionals[persona.base]),id:persona.id,name:persona.name,initial:persona.name[0],...(persona.id==='demo-daniel-kim'?{color:'sand'}:{})}));
}
