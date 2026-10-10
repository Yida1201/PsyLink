import {access,reply,failure,readBody,AdminError} from '@/lib/admin/access';
import {canEdit} from '@/lib/admin/model';
import {readCommunity,localEventMutation} from '@/lib/community/local';
import {validEvent} from '@/lib/community/model';
import {communitySeeds} from '@/lib/community/seed';
export const runtime='nodejs';
export async function GET(request:Request){try{const a=await access(request);if(a.mode==='local'){const s=await readCommunity();return reply({events:s.events.filter(e=>!e.deleted).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)),counts:s.events.map(e=>({event_id:e.id,interested:s.registrations.filter(r=>r.event_id===e.id&&r.status==='interested').length,cancelled:s.registrations.filter(r=>r.event_id===e.id&&r.status==='cancelled').length})),registrations:s.registrations.map(r=>({...r,email:'本机预览用户 · '+r.user_id.slice(0,6)})),audit:s.audit.slice(0,100),mode:'local',seeds:[]});}
 const [events,counts]=await Promise.all([a.client.from('community_events').select('*').eq('deleted',false).order('updated_at',{ascending:false}),a.client.rpc('community_registration_counts')]);if(events.error||counts.error)throw new AdminError('请先应用社区活动数据库迁移。',503);let registrations:unknown[]=[];if(a.role==='admin'){const result=await a.client.rpc('community_registration_list');if(result.error)throw new AdminError('无法读取 RSVP 记录。',503);registrations=result.data||[];}const audit=await a.client.from('community_event_audit').select('*').order('created_at',{ascending:false}).limit(100);if(audit.error)throw new AdminError('无法读取活动变更记录。',503);return reply({events:events.data,counts:counts.data,registrations,audit:audit.data,mode:'supabase',seeds:communitySeeds()});
}catch(e){return failure(e);}}
export async function POST(request:Request){try{const a=await access(request),b=await readBody(request);if(!b||!['save','publish','unpublish','delete'].includes(b.action)||!validEvent(b.event))throw new AdminError('活动资料格式不正确。');if(b.action==='save'&&!canEdit(a.role)||b.action!=='save'&&!['admin','reviewer'].includes(a.role)||b.action==='delete'&&a.role!=='admin')throw new AdminError('当前角色不能执行此活动操作。',403);
 if(a.mode==='local')return reply({event:await localEventMutation(b.action,b.event)});
 const {data,error}=await a.client.rpc('community_event_mutate',{action_name:b.action,item:b.event,expected_version:b.event.version});if(error)throw new AdminError(error.code==='40001'?'活动已更新，请刷新后重试。':'活动操作失败，请检查资料、状态与权限。',error.code==='40001'?409:400);return reply({event:data});
}catch(e){return failure(e);}}
