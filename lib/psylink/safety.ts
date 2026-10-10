// Conservative backup rules; not a validated risk assessment.
const urgent =
  /自杀|自残|不想活|活不下去|结束生命|伤害自己|伤害孩子|打死|杀死|杀了|跳楼|割腕|吞药|服毒|家暴|虐待|性侵|suicid|kill myself|self.harm|hurt my child|domestic violence|quiero morir|matarme|autolesi|hacerme daño|lastimar a mi hijo|violencia doméstica|死にたい|自殺|自傷|虐待|子供を傷つけ|子どもを傷つけ|죽고\s*싶|자살|자해|아동\s*학대|가정\s*폭력|아이를\s*(때리|해치)/i;
export function needsSafetySupport(text: string) {
  return urgent.test(text.normalize("NFKC"));
}
export const safetyReply =
  "如果你或孩子可能正处于危险中，请先联系当地急救或警方，或前往最近的急诊，不要等待平台预约。如果能安全地做到，联系一位信任的人陪伴你，远离可能造成伤害的物品或场所。这里没有真人实时监看，也无法提供紧急救援。你现在和孩子是否安全？";
// Contact details must come from a separately verified directory, never model text.
export function containsUnverifiedContact(text: string) {
  return /https?:\/\/|www\.|(?<!\d)(?:1[3-9]\d{9}|0\d{2,3}[- ]?\d{7,8}|12356|110|120|119|911|988|112|999|116[- ]?123|1[- ]?800[- ]?\d{3}[- ]?\d{4})(?!\d)/i.test(
    text,
  );
}
export function validateMessages(
  value: unknown,
): value is { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20)
    return false;
  if (
    !value.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= 2000,
    )
  )
    return false;
  return (
    value[value.length - 1].role === "user" &&
    value.reduce((n, m) => n + m.content.length, 0) <= 16000
  );
}
export function demoReply(text: string) {
  if (/自闭|多动|发育|不正常|诊断|ADHD|autism|desarrollo|発達|발달/i.test(text))
    return {
      text: "仅凭聊天无法判断孩子是否存在发展障碍。正式版会帮助你整理具体表现、持续时间和出现的情境，再提供经核验的专业评估路径。当前是演示回答，不作个体评估；如有持续担忧，请联系当地儿童保健或儿科服务。",
      sourceIds: [],
      articleId: undefined,
    };
  if (
    /累|压力|焦虑|疲|崩溃|情绪|tired|stress|anxious|cansad|estrés|疲れ|不安|지쳐|스트레스/i.test(
      text,
    )
  )
    return {
      text: "【演示回答】照顾孩子的同时，也可以给自己留一点空间。先挑一件今天能分担出去的小事，或联系一位你信任的人。下面这篇资料介绍家长自我照顾的做法。正式版会进一步了解你的情境；当前回复是预设示例。",
      sourceIds: ["selfcare"],
      articleId: "pause",
    };
  if (/哭|发脾气|不听|规矩|边界|tantrum|rabieta|癇癪|짜증/i.test(text))
    return {
      text: "【演示回答】可以先把期待变成孩子能理解的具体动作，例如：请把积木放回盒子。留意孩子做得好的时刻，并给出具体肯定。下面这篇资料提供一般养育思路，不能用来判断孩子是否存在发展问题。",
      sourceIds: ["positive"],
      articleId: "boundaries",
    };
  return {
    text: "【演示回答】我们可以从一件具体的小事开始：当时发生了什么，你最担心的是什么？在真实聊天启用前，这里用预设回复展示体验。你也可以先看看下面的亲子沟通资料，或体验如何找到真人支持。",
    sourceIds: ["communication"],
    articleId: "listen",
  };
}
