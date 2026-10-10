import {describe,expect,test} from 'bun:test';
import {activities,ages,categories,dateKey,weekDates,weekTheme,emptyState,parseState,recommend,selectedActivity,swapActivity,dailySwapCount,completeActivity,completedDays,dueReminders,acknowledgeReminder} from '../lib/together/model';
import {circleCalendar} from '../lib/together/calendar';
import {articles} from '../lib/psylink/content';
import {familyCircleConfig} from '../lib/together/config';
describe('local family activities',()=>{
 test('24 bilingual drafts have age/category coverage, safe lengths and real reading links',()=>{
  expect(activities).toHaveLength(24);expect(new Set(activities.map(a=>a.id)).size).toBe(24);
  for(const age of ages){expect(activities.filter(a=>a.age===age)).toHaveLength(8);for(const c of categories)expect(activities.filter(a=>a.age===age&&a.category===c)).toHaveLength(2);}
  for(const a of activities){expect(a.reviewStatus).toBe('draft');expect(a.minutes).toBeGreaterThanOrEqual(5);expect(a.minutes).toBeLessThanOrEqual(10);expect(articles.some(r=>r.id===a.relatedArticleId)).toBe(true);for(const c of Object.values(a.copy)){expect(c.title.length).toBeGreaterThan(2);expect(c.materials.length).toBeGreaterThan(0);expect(c.steps.length).toBeGreaterThanOrEqual(3);expect(c.steps.length).toBeLessThanOrEqual(5);expect(c.why.length).toBeGreaterThan(5);}}
 });
 test('date/age seed is stable and initially prioritizes the configured weekly theme',()=>{
  for(const age of ages){const a=recommend('2026-10-10',age);expect(a).toEqual(recommend('2026-10-10',age));expect(a.age).toBe(age);expect(a.category).toBe(weekTheme('2026-10-10').category);}
  expect(dateKey(new Date(2026,9,10,23,59))).toBe('2026-10-10');
  expect(weekDates('2026-01-01')).toEqual(['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03','2026-01-04']);
  expect(weekDates('2026-11-01')).toHaveLength(7);
 });
 test('only two swaps per day across all children; fresh day resets and choices survive reload',()=>{
  let s=emptyState();const first=selectedActivity(s,'2026-10-10','baby').id;
  s=swapActivity(s,'2026-10-10','baby');const second=selectedActivity(s,'2026-10-10','baby').id;
  s=swapActivity(s,'2026-10-10','baby');const third=selectedActivity(s,'2026-10-10','baby').id;
  expect(new Set([first,second,third]).size).toBe(3);expect(dailySwapCount(s,'2026-10-10')).toBe(2);
  expect(swapActivity(s,'2026-10-10','toddler')).toBe(s);expect(selectedActivity(parseState(JSON.stringify(s)),'2026-10-10','baby').id).toBe(third);
  expect(dailySwapCount(swapActivity(s,'2026-10-11','baby'),'2026-10-11')).toBe(1);
 });
 test('completion is idempotent, notes stay local and review counts days rather than tasks',()=>{
  let s=completeActivity(emptyState(),'2026-10-10',activities[0],'a'.repeat(250));s=completeActivity(s,'2026-10-10',activities[0]);
  expect(s.completions['2026-10-10']).toHaveLength(1);expect(s.completions['2026-10-10'][0].note).toHaveLength(200);
  s=completeActivity(s,'2026-10-10',activities[8]);expect(completedDays(s,'2026-10-10')).toHaveLength(1);
  s=completeActivity(s,'2026-10-09',activities[0]);expect(completedDays(s,'2026-10-10')).toHaveLength(2);
  expect(parseState(JSON.stringify(s))).toEqual(s);
 });
 test('invalid local storage is sanitized and default reminders are off',()=>{
  expect(parseState('{')).toEqual(emptyState());const s=parseState(JSON.stringify({ages:['baby','secret','baby'],dailyReminder:{enabled:true,time:'27:80'},choices:{'2026-10-10':{baby:{id:'bad',swaps:99}}},completions:{'2026-10-10':[{id:'bad id',age:'baby'}]},circles:{'bad id':{interested:true}}}));
  expect(s.ages).toEqual(['baby']);expect(s.dailyReminder.time).toBe('19:00');expect(s.completions['2026-10-10']).toEqual([]);expect(s.circles).toEqual({});expect(emptyState().dailyReminder.enabled).toBe(false);
 });
 test('daily reminders respect time, completion, snoozing and avoid duplicate delivery',()=>{
  const now=new Date(2026,9,10,19,1),day=dateKey(now);let s=emptyState();s.ages=['toddler'];s.dailyReminder.enabled=true;
  expect(dueReminders(s,new Date(2026,9,10,18,59))).toEqual([]);expect(dueReminders(s,now)).toHaveLength(1);
  s.snooze[day]=now.getTime()+60000;expect(dueReminders(s,now)).toEqual([]);
  const later=new Date(now.getTime()+60001),r=dueReminders(s,later);expect(r).toHaveLength(1);s=acknowledgeReminder(s,r[0].id,day);expect(dueReminders(s,later)).toEqual([]);
  s.snooze[day]=later.getTime()+60000;expect(dueReminders(s,new Date(later.getTime()+60001))[0].id).toContain('snooze:');
  s=completeActivity(s,day,activities[8]);expect(dueReminders(s,new Date(later.getTime()+60001))).toEqual([]);
 });
 test('circle reminders begin 24 hours before the offset-aware date and never fire after it',()=>{
  const w=familyCircleConfig.weeks[3],start=new Date(w.start).getTime(),s=emptyState();s.circles[w.id]={interested:true,remind:true};
  expect(dueReminders(s,new Date(start-86400001))).toEqual([]);const r=dueReminders(s,new Date(start-86400000));expect(r[0].id).toBe('circle:'+w.id);
  expect(dueReminders(s,new Date(start))).toEqual([]);expect(dueReminders(acknowledgeReminder(s,r[0].id,dateKey(new Date(start))),new Date(start-3600000))).toEqual([]);
 });
 test('calendar uses UTC across DST, sample status, correct duration and optional one-day alarm',()=>{
  const first=circleCalendar(familyCircleConfig.weeks[0].id,'en-US',true),dst=circleCalendar(familyCircleConfig.weeks[3].id,'zh-CN',false);
  expect(first).toContain('BEGIN:VCALENDAR');expect(first).toContain('DTSTART:20261011T190000Z');expect(dst).toContain('DTSTART:20261101T200000Z');expect(first).toContain('DURATION:PT90M');expect(first).toContain('STATUS:TENTATIVE');expect(first).toContain('Sample');expect(first).toContain('BEGIN:VALARM');expect(first).toContain('TRIGGER:-PT24H');expect(dst).not.toContain('BEGIN:VALARM');expect(first).not.toContain('ATTENDEE');expect(first).not.toContain('ORGANIZER');expect(()=>circleCalendar('bad','en-US',false)).toThrow();
 });
});
