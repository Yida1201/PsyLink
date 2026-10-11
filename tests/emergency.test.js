import {test,expect} from 'bun:test';
import {emergencyCountry,emergencyDirectory,supportedEmergencyCountry} from '../lib/psylink/emergency';
import translations from '../lib/psylink/translations.json';
test('country comes from Vercel, never language, query or arbitrary forwarded IP',()=>{
 const headers=new Headers({'x-vercel-ip-country':'US','accept-language':'zh-CN','x-forwarded-for':'1.2.3.4'});
 expect(emergencyCountry(headers,true)).toBe('US');
 expect(emergencyCountry(headers,false)).toBeNull();
 for(const code of ['','us','USA','US,CN','<script>'])expect(emergencyCountry(new Headers({'x-vercel-ip-country':code}),true)).toBeNull();
 expect(emergencyCountry(new Headers(),true)).toBeNull();
 expect(supportedEmergencyCountry('ZZ')).toBeNull();
 expect(supportedEmergencyCountry('toString')).toBeNull();
});
test('country resources remain separate, with verified source and complete translations',()=>{
 expect(emergencyDirectory.US.map(r=>r.number)).toEqual(['911','988']);
 expect(emergencyDirectory.CN.map(r=>r.number)).toEqual(['120','110','119']);
 expect(emergencyDirectory.JP.map(r=>r.number)).toEqual(['119','110']);
 expect(emergencyDirectory.KR.map(r=>r.number)).toEqual(['119','112']);
 expect(emergencyDirectory.ES.map(r=>r.number)).toEqual(['112']);
 expect(emergencyDirectory.GB).toBeUndefined();
 for(const rows of Object.values(emergencyDirectory))for(const r of rows){
  expect(r.number).toMatch(/^\d{3}$/);
  expect(r.source).toMatch(/^https:\/\//);
  for(const locale of ['en-US','es','ja','ko'])expect(translations[r.label][locale].length).toBeGreaterThan(0);
 }
 expect(emergencyDirectory.US.filter(r=>r.crisis).map(r=>r.number)).toEqual(['988']);
});
test('region endpoint is anonymous, uncached and returns no IP or coordinates',async()=>{
 const {GET}=await import('../app/api/emergency-region/route');
 const previous=process.env.VERCEL;
 try{
  process.env.VERCEL='1';
  const result=await GET(new Request('https://bloomie.example/api/emergency-region',{headers:{'x-vercel-ip-country':'CN','x-forwarded-for':'1.2.3.4','x-vercel-ip-latitude':'30'}}));
  expect(await result.json()).toEqual({country:'CN'});
  expect(result.headers.get('Cache-Control')).toBe('private, no-store');
  process.env.VERCEL='0';
  expect(await (await GET(new Request('http://localhost/api/emergency-region',{headers:{'x-vercel-ip-country':'US'}}))).json()).toEqual({country:null});
 }finally{if(previous===undefined)delete process.env.VERCEL;else process.env.VERCEL=previous;}
});
