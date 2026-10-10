import {guardOrigin} from '@/lib/admin/access';
import {localPreview,serviceStatus} from '@/lib/psylink/service';
import {createClient} from '@/lib/supabase/server';
export const runtime='nodejs';
export const maxDuration=60;
const limit=3*1024*1024;
function result(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function POST(request:Request){
 try{guardOrigin(request);}catch{return result({code:'origin'},403);}
 if(!serviceStatus(request).stt)return result({code:'unavailable'},503);
 if(!localPreview(request)){
  try{const client=await createClient(),{data:{user},error}=await client.auth.getUser();if(error||!user)return result({code:'login'},401);
   const {data,error:quotaError}=await client.rpc('consume_speech_quota');if(quotaError)return result({code:'unavailable'},503);if(!data)return result({code:'quota'},429);
  }catch{return result({code:'unavailable'},503);}
 }
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data;'))return result({code:'format'},400);
 if(Number(request.headers.get('content-length')||0)>limit+65536)return result({code:'size'},413);
 try{
  // Bound chunked uploads too; do not write audio or transcripts to disk.
  const reader=request.body?.getReader();if(!reader)return result({code:'format'},400);
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit+65536){await reader.cancel();return result({code:'size'},413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')!}}).formData(),file=form.get('audio');
  if(!(file instanceof File)||file.size<44||file.size>limit)return result({code:'size'},413);
  const type=file.type.split(';')[0],ext=({'audio/webm':'webm','video/webm':'webm','audio/mp4':'mp4','audio/x-m4a':'m4a','audio/wav':'wav','audio/x-wav':'wav'} as Record<string,string>)[type];
  if(!ext)return result({code:'format'},400);
  const header=new Uint8Array(await file.slice(0,16).arrayBuffer()),ascii=(a:number,b:number)=>String.fromCharCode(...header.slice(a,b));
  if(ext==='webm'?!(header[0]===0x1a&&header[1]===0x45&&header[2]===0xdf&&header[3]===0xa3):ext==='wav'?!(ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE'):ascii(4,8)!=='ftyp')return result({code:'format'},400);
  const model=process.env.OPENAI_STT_MODEL||'gpt-transcribe';if(!['gpt-transcribe','gpt-4o-mini-transcribe','gpt-4o-transcribe','whisper-1'].includes(model))return result({code:'unavailable'},503);
  const upload=new FormData();upload.set('file',file,'speech.'+ext);upload.set('model',model);
  // No language hint: transcribe the speaker's language, never translate to UI locale.
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:upload,signal:AbortSignal.any([request.signal,AbortSignal.timeout(45000)])});
  if(!response.ok)return result({code:'provider'},502);
  const data=await response.json();if(typeof data.text!=='string'||!data.text.trim())return result({code:'empty'},422);
  if(data.text.trim().length>2000)return result({code:'length'},413);
  return result({text:data.text.trim()});
 }catch{return result({code:'provider'},502);}
}
