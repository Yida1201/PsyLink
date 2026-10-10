import {test,expect} from 'bun:test';
import {safeScientificURL,filterSearchResults,validSearchPlan,searchQuery} from '../lib/psylink/scientific-search';
import {chatPrompt} from '../lib/psylink/chat-prompt';
test('scientific URL policy rejects spoofing and non-HTTPS/contact credentials',()=>{
  for(const u of ['http://nhs.uk/a','https://nhs.uk.evil.com/a','https://evilnhs.uk/a','https://user:secret@nhs.uk/a','https://nhs.uk:9443/a','javascript:alert(1)','https://localhost/a'])expect(safeScientificURL(u)).toBeNull();
  expect(safeScientificURL('https://pubmed.ncbi.nlm.nih.gov/123/')).not.toBeNull();
  expect(filterSearchResults({results:[{url:'https://who.int/a',title:'Guideline',content:'Evidence ' .repeat(50)},{url:'https://who.int/a',title:'Duplicate',content:'Evidence ' .repeat(50)},{url:'https://marketing.com/a',title:'Blog',content:'Evidence ' .repeat(50)}]})).toHaveLength(1);
});
test('search planner cannot put user text into provider query',()=>{
  expect(validSearchPlan({needed:true,topics:['John Smith'],age:'school'})).toBe(false);
  expect(validSearchPlan({needed:true,topics:['sleep'],age:'Secret School'})).toBe(false);
  expect(validSearchPlan({needed:true,topics:[],age:'school'})).toBe(false);
  expect(searchQuery({needed:true,topics:['speech'],age:'preschool'})).toContain('speech language');
});
test('prompt supports depth and warmth without erasing safety or evidence uncertainty',()=>{
  const p=chatPrompt('en-US',[],'disabled');
  for(const phrase of ['American English','multi-part question','do not invent emotions','at most one focused follow-up','2–5 short paragraphs','Association is not causation','untrusted DATA','safety=true','Set safety=false for ordinary parenting questions','only describe a successful web search'])expect(p).toContain(phrase);
});
