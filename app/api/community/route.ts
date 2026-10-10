import {localAdmin,reply,failure,AdminError} from '@/lib/admin/access';
import {readCommunity,previewIdentity} from '@/lib/community/local';
import {communitySeeds} from '@/lib/community/seed';
import {createClient} from '@/lib/supabase/server';
import {validSupabaseConfig} from '@/lib/supabase/config';
export const runtime='nodejs';
export async function GET(request:Request){try{
 if(localAdmin(request)){const s=await readCommunity(),who=previewIdentity(request);return reply({events:s.publications,registrations:s.registrations.filter(r=>r.user_id===who.id).map(({event_id,status})=>({event_id,status})),mode:'local'});}
 if(!validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))return reply({events:communitySeeds(),registrations:[],mode:'builtin'});
 const client=await createClient();const {data,error}=await client.from('community_event_publications').select('id,data,version,updated_at').eq('active',true).order('updated_at',{ascending:false});if(error)throw new AdminError('活动服务尚未就绪，请稍后再试。',503);
 const {data:{user}}=await client.auth.getUser();let registrations:unknown[]=[];if(user){const result=await client.from('community_registrations').select('event_id,status').eq('user_id',user.id);if(result.error)throw new AdminError('参加意向暂时无法读取。',503);registrations=result.data||[];}
 return reply({events:(data||[]).map(e=>({...e,published:true,deleted:false})),registrations,mode:'supabase'});
}catch(e){return failure(e);}}
