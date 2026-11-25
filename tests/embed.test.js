import {test,expect} from 'bun:test';
import {parseEmbedParams} from '../lib/psylink/embed';

test('no parameters leaves the normal welcome flow untouched',()=>{
  expect(parseEmbedParams('')).toEqual({guest:false,tab:null,event:null});
  expect(parseEmbedParams('?auth=error')).toEqual({guest:false,tab:null,event:null});
});
test('guest=1 skips the welcome page; other values do not',()=>{
  expect(parseEmbedParams('?guest=1').guest).toBe(true);
  expect(parseEmbedParams('?guest=true').guest).toBe(true);
  expect(parseEmbedParams('?guest=0').guest).toBe(false);
  expect(parseEmbedParams('?guest=').guest).toBe(false);
});
test('tab accepts only the four real screens',()=>{
  for(const tab of ['chat','library','today','care'])expect(parseEmbedParams(`?tab=${tab}`).tab).toBe(tab);
  expect(parseEmbedParams('?tab=admin').tab).toBeNull();
  expect(parseEmbedParams('?tab=TODAY').tab).toBeNull();
  expect(parseEmbedParams('?tab=<script>').tab).toBeNull();
});
test('both parameters combine, and malformed input never throws',()=>{
  expect(parseEmbedParams('?guest=1&tab=today')).toEqual({guest:true,tab:'today',event:null});
  expect(parseEmbedParams('?%E0%A4%A&tab=care')).toEqual({guest:false,tab:'care',event:null});
});
test('event carries a well-formed code only',()=>{
  expect(parseEmbedParams('?guest=1&tab=chat&event=theater-1203')).toEqual({guest:true,tab:'chat',event:'theater-1203'});
  for(const bad of ['short','has%20space%20in','%3Cscript%3Ealert(1)','x'.repeat(65)])expect(parseEmbedParams(`?event=${bad}`).event).toBeNull();
});
