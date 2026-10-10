// Replace sample program metadata and each confirmed start when the real group is ready.
export const familyCircleConfig={
 id:'bloomie-family-circle-preview',isDemo:true,
 name:{'zh-CN':'每周家庭聚会','en-US':'Weekly Family Circle'},
 location:{'zh-CN':'地点待定 · New Haven','en-US':'Location to be confirmed · New Haven'},
 timeZone:'America/New_York',durationMinutes:90,jointMinutes:15,
 offers:{free:true,childcare:true,transportAssistance:true},
 weeks:[
  {id:'2026-10-11',weekOf:'2026-10-05',start:'2026-10-11T15:00:00-04:00',category:'read',title:{'zh-CN':'一起读书，一起说话','en-US':'Read together, talk together'}},
  {id:'2026-10-18',weekOf:'2026-10-12',start:'2026-10-18T15:00:00-04:00',category:'routine',title:{'zh-CN':'小规律，大一点安心','en-US':'Small routines, a little steadiness'}},
  {id:'2026-10-25',weekOf:'2026-10-19',start:'2026-10-25T15:00:00-04:00',category:'emotion',title:{'zh-CN':'看见情绪，慢慢回应','en-US':'Notice feelings, respond gently'}},
  {id:'2026-11-01',weekOf:'2026-10-26',start:'2026-11-01T15:00:00-05:00',category:'move',title:{'zh-CN':'走出去，一起发现','en-US':'Step outside, notice together'}},
  {id:'2026-11-08',weekOf:'2026-11-02',start:'2026-11-08T15:00:00-05:00',category:'read',title:{'zh-CN':'让孩子讲一个故事','en-US':'Let your child tell a story'}},
  {id:'2026-11-15',weekOf:'2026-11-09',start:'2026-11-15T15:00:00-05:00',category:'routine',title:{'zh-CN':'睡前留一个小时刻','en-US':'A little moment before bedtime'}},
  {id:'2026-11-22',weekOf:'2026-11-16',start:'2026-11-22T15:00:00-05:00',category:'emotion',title:{'zh-CN':'不同的需要，都能说出来','en-US':'Different needs, room for every voice'}},
  {id:'2026-11-29',weekOf:'2026-11-23',start:'2026-11-29T15:00:00-05:00',category:'move',title:{'zh-CN':'家里也能动一动','en-US':'A little movement at home'}}
 ]
} as const;
