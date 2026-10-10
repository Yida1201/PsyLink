import {guardOrigin,localAdmin,reply,failure,readBody,AdminError} from '@/lib/admin/access';
import {validId} from '@/lib/together-admin/model';
import {localRsvp} from '@/lib/together-admin/local';
import {previewIdentity} from '@/lib/community/local';
import {createClient} from '@/lib/supabase/server';
export const runtime='nodejs';
export async function POST(request:Request){try{guardOrigin(request);const b=await readBody(request);if(!validId(b?.eventId)||!['interested','cancelled'].includes(b.status))throw new AdminError('参加意向格式不正确。');if(localAdmin(request)){const who=previewIdentity(request),r=await localRsvp(b.eventId,who.id,b.status),response=reply({registration:r,mode:'local'});if(who.newCookie)response.headers.append('Set-Cookie',`bloomie_event_preview=${who.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);return response;}const c=await createClient(),{data:{user},error}=await c.auth.getUser();if(error||!user)throw new AdminError('请先登录，再记录参加意向。',401);const r=await c.rpc('together_rsvp',{target_event:b.eventId,next_status:b.status});if(r.error)throw new AdminError('无法保存，聚会可能已下架。',409);return reply({registration:r.data,mode:'supabase'});}catch(e){return failure(e);}}
