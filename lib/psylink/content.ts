import research from "./research.json";
export type Source = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  checked: string;
  authors?: string;
  year?: string;
  doi?: string;
};
export const sources: Source[] = [
  {
    id: "positive",
    publisher: "UNICEF",
    title: "Positive discipline",
    url: "https://www.unicef.org/parenting/child-care/how-discipline-your-child-smart-and-healthy-way",
    checked: "2026-10-09",
  },
  {
    id: "selfcare",
    publisher: "UNICEF",
    title: "Self-care for parents",
    url: "https://www.unicef.org/parenting/mental-health/parent-self-care-tips",
    checked: "2026-10-09",
  },
  {
    id: "communication",
    publisher: "UNICEF",
    title: "Communicating with your young child",
    url: "https://www.unicef.org/parenting/child-care/9-tips-for-better-communication",
    checked: "2026-10-09",
  },
  ...research.map((item) => item.source),
];
export type Article = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  minutes: number;
  color: string;
  motif: "leaf" | "sun" | "waves" | "circles";
  sourceId: (typeof sources)[number]["id"];
  kind?: "research";
  keywords?: string[];
  reviewed?: boolean;
  paragraphs: { heading: string; text: string }[];
};
export const articles: Article[] = [
  {
    id: "pause",
    title: "先照顾自己，\n再拥抱孩子",
    subtitle: "给忙碌的你，留一点呼吸的空间。",
    category: "照顾自己",
    minutes: 3,
    color: "sage",
    motif: "leaf",
    sourceId: "selfcare",
    paragraphs: [
      {
        heading: "从一个小小的停顿开始",
        text: "照顾自己也可以是日常中短暂的休息：走一会儿、放下手机，或联系一位信任的人。不必把它变成新的任务。",
      },
      {
        heading: "给支持留一个位置",
        text: "需要时向家人、朋友或专业人员求助，也是自我照顾的一部分。可以先想一想：今天有什么事，可以请别人分担？",
      },
      {
        heading: "今天只试一件小事",
        text: "挑一个适合自己的时刻，留几分钟做能让你舒缓的事。本文是对 UNICEF 家长自我照顾资料的简短中文整理，不是个体化治疗建议。",
      },
    ],
  },
  {
    id: "listen",
    title: "听见情绪，\n也听见孩子",
    subtitle: "在急着讲道理之前，先试着理解。",
    category: "亲子沟通",
    minutes: 3,
    color: "clay",
    motif: "circles",
    sourceId: "communication",
    paragraphs: [
      {
        heading: "把注意力交给孩子",
        text: "当孩子说话时，尽可能停下手边的事，用孩子能理解的语言回应。可以复述你听到的内容，给他补充和纠正的机会。",
      },
      {
        heading: "帮助情绪找到名字",
        text: "可以说：听起来你有些难过，我理解得对吗？描述情绪时保留询问，不急着替孩子下结论。",
      },
      {
        heading: "看见具体的行动",
        text: "比起笼统地评价好坏，描述你看到的行为更清楚，例如：我看到你把玩具收回盒子了。本文依据 UNICEF 沟通资料整理，待专业复核。",
      },
    ],
  },
  {
    id: "boundaries",
    title: "温柔，\n也可以有边界",
    subtitle: "用清楚的期待，替代反复的责备。",
    category: "日常养育",
    minutes: 4,
    color: "ochre",
    motif: "sun",
    sourceId: "positive",
    paragraphs: [
      {
        heading: "说清楚希望发生什么",
        text: "用具体、可做到的动作表达期待。比起不要弄乱，可以说：请把积木放回这个盒子。期待需要符合孩子的年龄和能力。",
      },
      {
        heading: "留意做得好的时刻",
        text: "给孩子专注的一对一时间，并具体肯定他的行动。设定后果时保持平静、一致，也要确保能够合理执行。",
      },
      {
        heading: "大人也可以先暂停",
        text: "感觉自己快失去耐心时，先停顿一下，再回应。本文依据 UNICEF 正向养育资料整理，不能用于判断儿童是否存在发展障碍。",
      },
    ],
  },
  {
    id: "together",
    title: "每天一点，\n重新靠近",
    subtitle: "陪伴不需要完美，只需要在场。",
    category: "亲子沟通",
    minutes: 2,
    color: "blue",
    motif: "waves",
    sourceId: "positive",
    paragraphs: [
      {
        heading: "专属的几分钟",
        text: "安排一小段专注于孩子的时间：一起玩、唱歌，或聊聊他的兴趣。暂时放下手机，把注意力留给彼此。",
      },
      {
        heading: "从小处开始",
        text: "不必每天安排复杂活动。选择一个双方都愿意的小互动，享受一起的时刻。这是依据 UNICEF 资料整理的陪伴练习，待专业复核。",
      },
    ],
  },
  ...research.map(
    ({ source: _source, keywords: _keywords, ...article }) => {
      void _source; void _keywords; return article as Article;
    },
  ),
];
export const professionals = [
  {
    id: "lin",
    name: "林知遥",
    role: "家庭沟通支持",
    focus: "亲子沟通 · 照护压力",
    color: "sage",
    initial: "林",
    description:
      "演示人物，用于体验沟通支持的选择流程。没有真实执业资质或服务安排。",
  },
  {
    id: "chen",
    name: "陈予安",
    role: "儿童发展咨询",
    focus: "发展担忧 · 就诊准备",
    color: "clay",
    initial: "陈",
    description:
      "演示人物，用于体验儿童发展咨询的预约流程。不能提供评估或诊断。",
  },
  {
    id: "zhou",
    name: "周南溪",
    role: "照护者情绪支持",
    focus: "情绪压力 · 家庭关系",
    color: "blue",
    initial: "周",
    description: "演示人物，用于展示照护者支持服务。当前没有真人接待。",
  },
] as const;
export type Professional = {id:string;name:string;role:string;focus:string;color:string;initial:string;description:string;isDemo?:boolean;contactUrl?:string;qualification?:string};
