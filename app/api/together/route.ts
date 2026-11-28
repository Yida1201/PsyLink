import { isAuthSessionMissingError } from '@supabase/supabase-js';
import {localAdmin,reply,failure,AdminError} from '@/lib/admin/access';
import {readTogether} from '@/lib/together-admin/local';
import {publicCatalog} from '@/lib/together-admin/model';
import {previewIdentity} from '@/lib/community/local';
import {createClient} from '@/lib/supabase/server';
import {validSupabaseConfig} from '@/lib/supabase/config';
import {eventPreview} from '@/lib/psylink/event-access';
export const runtime='nodejs';
export async function GET(request:Request){
 try{
  // A facilitated test session (valid event code) is told so, and leaves the draft notice off activity cards.
  const preview=eventPreview(process.env,Date.now(),request.headers.get('x-bloomie-event'));
  const out=(b:Record<string,unknown>)=>reply(preview?{...b,eventPreview:true}:b);
  if(localAdmin(request)){
   const s=await readTogether(),who=previewIdentity(request),catalog=publicCatalog(s.publications);
   return out({...catalog,circles:catalog.circles.map(c=>({...c,isDemo:true})),registrations:s.registrations.filter(r=>r.user_id===who.id).map(({event_id,status})=>({event_id,status})),mode:'local'});
  }
  if(!validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))return out({...publicCatalog([]),registrations:[],mode:'builtin'});
  const c=await createClient(),r=await c.from('together_publications').select('id,kind,data,active');
  if(r.error){
   // A fresh deployment can show the bundled editorial drafts before migration
   // 006 is installed. Do not substitute defaults for network/permission errors:
   // those could conceal existing withdrawal records and resurrect content.
   if(['PGRST205','42P01'].includes(r.error.code))return out({activities:publicCatalog([]).activities,circles:[],registrations:[],mode:'builtin',setupRequired:true});
   throw new AdminError('活动与聚会服务暂时不可用，请稍后重试。',503);
  }
  const {data:{user},error}=await c.auth.getUser();
  // Public activities are readable without a Supabase session.
  if(error&&!isAuthSessionMissingError(error))throw new AdminError('登录状态暂时无法验证。',503);
  let registrations:unknown[]=[];
  if(user&&!error){
   const rows=await c.from('together_registrations').select('event_id,status').eq('user_id',user.id);
   if(rows.error)throw new AdminError('参加意向暂时无法读取。',503);
   registrations=rows.data||[];
  }
  return out({...publicCatalog(r.data||[]),registrations,mode:'supabase'});
 }catch(e){return failure(e);}
}
