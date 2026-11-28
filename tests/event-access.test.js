import {test,expect,beforeEach} from 'bun:test';
import {eventPreview,eventConfig,codeMatches,consumeGuest,eventCookieHeader,readEventCookie,resetEventTotals,validEventCode,EVENT_COOKIE} from '../lib/psylink/event-access';

const now=Date.parse('2026-12-03T14:00:00-05:00');
const env=(extra={})=>({EVENT_CODE:'theater-1203',EVENT_CODE_EXPIRES:'2026-12-03T18:00:00-05:00',OPENAI_API_KEY:'server-secret',...extra});
beforeEach(resetEventTotals);

test('the event is off unless a well-formed code and a near expiry are both set',()=>{
  expect(eventConfig({},now)).toBeNull();
  expect(eventConfig(env({EVENT_CODE_EXPIRES:undefined}),now)).toBeNull();
  expect(eventConfig(env({EVENT_CODE_EXPIRES:'soon'}),now)).toBeNull();
  expect(eventConfig(env({EVENT_CODE:'short'}),now)).toBeNull();
  expect(eventConfig(env({EVENT_CODE:'SBS574'}),now)).not.toBeNull();
  expect(eventConfig(env({EVENT_CODE:'has spaces!!'}),now)).toBeNull();
  expect(eventConfig(env({OPENAI_API_KEY:undefined}),now)).toBeNull();
  expect(eventConfig(env(),now)).not.toBeNull();
});
test('an expired code, or one set to last longer than two weeks, is inert',()=>{
  expect(eventConfig(env(),Date.parse('2026-12-03T18:00:00-05:00'))).toBeNull();
  expect(eventConfig(env({EVENT_CODE_EXPIRES:'2027-06-01T00:00:00-05:00'}),now)).toBeNull();
});
test('only the exact code matches; other types and near misses do not',()=>{
  const c=eventConfig(env(),now);
  expect(codeMatches(c,'theater-1203')).toBe(true);
  for(const bad of ['theater-1204','THEATER-1203','theater-1203 ','',null,undefined,123,['theater-1203']])expect(codeMatches(c,bad)).toBe(false);
  expect(validEventCode('theater-1203')).toBe(true);expect(validEventCode('<script>alert(1)</script>')).toBe(false);
});
test('each guest gets a fixed number of replies, carried in a signed cookie',()=>{
  const c=eventConfig(env({EVENT_GUEST_LIMIT:'3'}),now);let cookie;
  for(let i=0;i<3;i++){const r=consumeGuest(c,cookie);expect(r.allowed).toBe(true);cookie=r.cookie;}
  expect(consumeGuest(c,cookie).allowed).toBe(false);
  // Another browser is unaffected.
  expect(consumeGuest(c,undefined).allowed).toBe(true);
});
test('a tampered or foreign cookie is treated as a new guest, never as extra allowance',()=>{
  const c=eventConfig(env({EVENT_GUEST_LIMIT:'2'}),now);
  const first=consumeGuest(c,undefined).cookie,[id,,sig]=first.split('.');
  // Rewinding the counter breaks the signature, so it starts again at 1 of 2.
  const rewound=consumeGuest(c,`${id}.0.${sig}`);expect(rewound.allowed).toBe(true);expect(rewound.cookie.split('.')[1]).toBe('1');
  // A cookie signed for another code or by another server key is not honoured.
  const other=eventConfig(env({EVENT_CODE:'another-code',EVENT_GUEST_LIMIT:'2'}),now);
  const full=consumeGuest(other,consumeGuest(other,undefined).cookie).cookie;
  expect(consumeGuest(c,full).cookie.split('.')[1]).toBe('1');
  for(const junk of ['','a.b','a.1.b.c','a.99999.b','..'])expect(consumeGuest(c,junk).allowed).toBe(true);
});
test('a total cap stops the event even for new guests',()=>{
  const c=eventConfig(env({EVENT_TOTAL_LIMIT:'4'}),now);
  for(let i=0;i<4;i++)expect(consumeGuest(c,undefined).allowed).toBe(true);
  expect(consumeGuest(c,undefined).allowed).toBe(false);
});
test('nonsense limits fall back to the defaults',()=>{
  for(const v of ['0','-5','abc','1e9','2.5']){const c=eventConfig(env({EVENT_GUEST_LIMIT:v,EVENT_TOTAL_LIMIT:v}),now);expect(c.guestLimit).toBe(12);expect(c.totalLimit).toBe(600);}
});
test('the cookie is HttpOnly, scoped to chat, expires with the event and works in an iframe',()=>{
  const c=eventConfig(env(),now),h=eventCookieHeader(c,'v',now,true);
  expect(h).toContain(`${EVENT_COOKIE}=v`);expect(h).toContain('HttpOnly');expect(h).toContain('Path=/api/chat');expect(h).toContain('Max-Age=14400');
  expect(h).toContain('Secure; SameSite=None; Partitioned');
  expect(eventCookieHeader(c,'v',now,false)).toContain('SameSite=Lax');
  expect(readEventCookie(`a=1; ${EVENT_COOKIE}=x.2.y; b=2`)).toBe('x.2.y');expect(readEventCookie(null)).toBeUndefined();
});

test('a test session is recognised only by the exact, still-valid event code',()=>{
  expect(eventPreview(env(),now,'theater-1203')).toBe(true);
  for(const bad of ['theater-1204','',null,undefined,'x'.repeat(200)])expect(eventPreview(env(),now,bad)).toBe(false);
  expect(eventPreview({},now,'theater-1203')).toBe(false);
  expect(eventPreview(env(),Date.parse('2026-12-04T00:00:00-05:00'),'theater-1203')).toBe(false);
});
