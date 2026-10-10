"use client";
import {useEffect,useRef,useState} from 'react';
export type VoicePhase='idle'|'requesting'|'recording'|'transcribing';
export type VoiceIntent='edit'|'send'|'cancel';
export function useVoiceInput({onText,onLogin}:{onText:(text:string,send:boolean)=>void;onLogin:()=>void}){
 const [phase,setPhase]=useState<VoicePhase>('idle'),[intent,setIntent]=useState<VoiceIntent>('edit'),[seconds,setSeconds]=useState(0),[notice,setNotice]=useState('');
 const refs=useRef({held:false,generation:0,stream:null as MediaStream|null,recorder:null as MediaRecorder|null,started:0,timer:undefined as ReturnType<typeof setInterval>|undefined,abort:null as AbortController|null,intent:'edit' as VoiceIntent});
 const callbacks=useRef({onText,onLogin});callbacks.current={onText,onLogin};
 function releaseTracks(){refs.current.stream?.getTracks().forEach(t=>t.stop());refs.current.stream=null;clearInterval(refs.current.timer);}
 function cancel(){const r=refs.current;r.held=false;r.generation++;r.abort?.abort();r.abort=null;if(r.recorder?.state==='recording')r.recorder.stop();r.recorder=null;releaseTracks();setPhase('idle');setIntent('edit');setNotice('cancelled');}
 useEffect(()=>{const stop=()=>{const r=refs.current;if(r.held||r.recorder||r.abort)cancel();};window.addEventListener('blur',stop);const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hide);const r=refs.current;r.generation++;r.held=false;r.abort?.abort();if(r.recorder?.state==='recording')r.recorder.stop();r.stream?.getTracks().forEach(t=>t.stop());clearInterval(r.timer);};},[]);
 async function transcribe(blob:Blob,send:boolean,generation:number){
  const r=refs.current;if(generation!==r.generation)return;setPhase('transcribing');r.abort=new AbortController();
  try{const f=new FormData();f.set('audio',blob,blob.type.includes('mp4')?'speech.mp4':'speech.webm');const response=await fetch('/api/transcribe',{method:'POST',body:f,signal:r.abort.signal});const b=await response.json();if(generation!==r.generation)return;
   if(response.status===401){setNotice('login');callbacks.current.onLogin();return;}if(!response.ok){setNotice(b.code||'provider');return;}
   if(typeof b.text!=='string'||!b.text.trim()){setNotice('empty');return;}
   setNotice(send?'':'ready');callbacks.current.onText(b.text,send);
  }catch{if(generation===r.generation)setNotice('provider');}finally{if(generation===r.generation){r.abort=null;setPhase('idle');setIntent('edit');}}
 }
 function finish(requested?:VoiceIntent){
  const r=refs.current;if(!r.held)return;const next=requested??r.intent;r.held=false;r.intent=next;setIntent(next);
  if(next==='cancel'){cancel();return;}
  if(r.recorder?.state==='recording'){setPhase('transcribing');r.recorder.stop();releaseTracks();}
  else{r.generation++;releaseTracks();setPhase('idle');setNotice('short');}
 }
 async function start(){
  const r=refs.current;if(r.held||r.recorder||r.abort)return;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setNotice('unsupported');return;}
  r.held=true;r.intent='edit';setIntent('edit');setSeconds(0);setNotice('');setPhase('requesting');const generation=++r.generation;
  try{
   const status=await fetch('/api/status',{cache:'no-store'}).then(v=>v.json());if(!r.held||generation!==r.generation)return;if(!status.stt){r.held=false;setPhase('idle');setNotice('unavailable');return;}
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
   if(!r.held||generation!==r.generation){stream.getTracks().forEach(t=>t.stop());return;}
   r.stream=stream;const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(v=>MediaRecorder.isTypeSupported(v));if(!mime){releaseTracks();r.held=false;setPhase('idle');setNotice('unsupported');return;}
   const recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000});r.recorder=recorder;const chunks:Blob[]=[];let size=0;
   recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);size+=e.data.size;if(size>3*1024*1024){cancel();setNotice('size');}}};
   recorder.onerror=()=>{cancel();setNotice('provider');};
   recorder.onstop=()=>{if(generation!==r.generation)return;const autoSend=!r.held&&r.intent==='send';r.held=false;r.recorder=null;releaseTracks();if(performance.now()-r.started<350||!size){setPhase('idle');setNotice('short');return;}void transcribe(new Blob(chunks,{type:mime}),autoSend,generation);};
   r.started=performance.now();recorder.start(250);setPhase('recording');r.timer=setInterval(()=>{setSeconds(Math.min(60,Math.floor((performance.now()-r.started)/1000)));if(performance.now()-r.started>=60000)finish('edit');},250);
  }catch(e){if(generation!==r.generation)return;r.held=false;releaseTracks();setPhase('idle');setNotice((e as DOMException).name==='NotAllowedError'?'permission':'provider');}
 }
 function aim(intent:VoiceIntent){refs.current.intent=intent;setIntent(intent);}
 return {phase,intent,seconds,notice,start,finish,cancel,aim,clearNotice:()=>setNotice('')};
}
