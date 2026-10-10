import {guardOrigin,localAdmin,reply,failure,AdminError,readBody} from '@/lib/admin/access';
import {previewIdentity,localRsvp} from '@/lib/community/local';
import {createClient} from '@/lib/supabase/server';
import {validSupabaseConfig} from '@/lib/supabase/config';
export const runtime='nodejs';
export async function POST(request:Request){try{guardOrigin(request);const b=await readBody(request);if(!b||typeof b.eventId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(b.eventId)||!['interested','cancelled'].includes(b.status))throw new AdminError('参加意向格式不正确。');
 if(localAdmin(request)){const who=previewIdentity(request),r=await localRsvp(b.eventId,who.id,b.status),response=reply({registration:{event_id:r.event_id,status:r.status},mode:'local'});if(who.newCookie)response.headers.append('Set-Cookie',`bloomie_event_preview=${who.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);return response;}
 if(!validSupabaseConfig(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))throw new AdminError('活动报名服务尚未配置。',503);
 const client=await createClient(),{data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new AdminError('请先登录，再记录参加意向。',401);
 const {data,error}=await client.rpc('community_rsvp',{target_event:b.eventId,next_status:b.status});if(error)throw new AdminError('暂时无法更新参加意向，活动可能已下架。',409);return reply({registration:{event_id:data.event_id,status:data.status},mode:'supabase'});
}catch(e){return failure(e);}}
