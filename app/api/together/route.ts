import {localAdmin,reply,failure,AdminError} from '@/lib/admin/access';
import {readTogether} from '@/lib/together-admin/local';
import {publicCatalog} from '@/lib/together-admin/model';
import {previewIdentity} from '@/lib/community/local';
import {createClient} from '@/lib/supabase/server';
import {validSupabaseConfig} from '@/lib/supabase/config';
export const runtime='nodejs';
export async function GET(request:Request){try{if(localAdmin(request)){const s=await readTogether(),who=previewIdentity(request);const catalog=publicCatalog(s.publications);return reply({...catalog,circles:catalog.circles.map(c=>({...c,isDemo:true})),registrations:s.registrations.filter(r=>r.user_id===who.id).map(({event_id,status})=>({event_id,status})),mode:'local'});}if(!validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))return reply({...publicCatalog([]),registrations:[],mode:'builtin'});const c=await createClient(),r=await c.from('together_publications').select('id,kind,data,active');if(r.error)throw new AdminError('活动与聚会服务尚未就绪，请应用 006 迁移。',503);const {data:{user},error}=await c.auth.getUser();if(error)throw new AdminError('登录状态暂时无法验证。',503);let registrations:unknown[]=[];if(user){const rows=await c.from('together_registrations').select('event_id,status').eq('user_id',user.id);if(rows.error)throw new AdminError('参加意向暂时无法读取。',503);registrations=rows.data||[];}return reply({...publicCatalog(r.data||[]),registrations,mode:'supabase'});}catch(e){return failure(e);}}
