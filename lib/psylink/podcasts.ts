// Editorial concepts only: these are not published episodes or expert recordings.
export const podcasts = [
  {
    id: "recharge",
    title: "家长也需要充电",
    series: "给自己的十分钟",
    description: "把照顾自己的时间，放回日常里。",
    minutes: 10,
    color: "sage",
    articleId: "pause",
  },
  {
    id: "listen-first",
    title: "先听见，再回应",
    series: "慢慢长大",
    description: "在急着讲道理之前，给孩子一个被听见的时刻。",
    minutes: 8,
    color: "clay",
    articleId: "listen",
  },
  {
    id: "together-parenting",
    title: "一起养育，不必同一种答案",
    series: "家里的小圆桌",
    description: "一起聊聊家庭里的分工、期待和不同意见。",
    minutes: 12,
    color: "blue",
    articleId: "boundaries",
  },
] as const;
export type Podcast = {id:string;title:string;series:string;description:string;minutes:number;color:string;articleId:string;audioUrl?:string;isDemo?:boolean};
