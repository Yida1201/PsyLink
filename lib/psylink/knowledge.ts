import { articles, sources, type Article, type Source } from "./content";
import research from "./research.json";
import { translate, type Locale } from "./i18n";

const editorialKeywords: Record<string, string[]> = {
  pause: [
    "累",
    "压力",
    "照顾自己",
    "tired",
    "stress",
    "anxious",
    "cansad",
    "estrés",
    "疲れ",
    "不安",
    "스트레스",
    "지쳐",
  ],
  listen: [
    "沟通",
    "情绪",
    "倾听",
    "communicat",
    "emotion",
    "listen",
    "comunica",
    "emoción",
    "感情",
    "話",
    "감정",
    "대화",
  ],
  boundaries: [
    "发脾气",
    "边界",
    "规则",
    "tantrum",
    "discipline",
    "boundar",
    "rabieta",
    "límites",
    "癇癪",
    "しつけ",
    "짜증",
    "규칙",
  ],
  together: [
    "陪伴",
    "一起",
    "玩",
    "play",
    "together",
    "jugar",
    "遊",
    "함께",
    "놀이",
  ],
};
function matches(text: string, term: string) {
  // Whole words/stems for Latin scripts; substring matching for CJK scripts.
  if (
    /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(
      term,
    )
  )
    return text.includes(term);
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}])${safe}\\p{L}*`, "u").test(text);
}
export function retrieveKnowledge(
  messages: { role: string; content: string }[],
  locale: Locale,
  catalog?: {knowledge:Article[];sources:Source[]},
) {
  const userTexts = messages.filter((m) => m.role === "user").slice(-3);
  const latest = (userTexts.at(-1)?.content || "")
    .normalize("NFKC")
    .toLocaleLowerCase();
  const earlier = userTexts
    .slice(0, -1)
    .map((m) => m.content)
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase();
  const ranked = (catalog?.knowledge || articles)
    .map((article, index) => {
      const keywords =
        article.keywords || research.find((r) => r.id === article.id)?.keywords ||
        editorialKeywords[article.id] ||
        [];
      const score = keywords.reduce(
        (n, k) =>
          n + (matches(latest, k) ? 4 : 0) + (matches(earlier, k) ? 1 : 0),
        0,
      );
      return { article, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const matchesFound = ranked.some((item) => item.score > 0);
  const selected = (
    matchesFound
      ? ranked.filter((item) => item.score > 0)
      : ranked.filter((item) => !item.article.kind)
  ).slice(0, 4);
  return {
    matched: matchesFound,
    evidence: selected.map(({ article }) => ({
      sourceId: article.sourceId,
      articleId: article.id,
      title: translate(locale, article.title),
      source: (catalog?.sources || sources).find((source) => source.id === article.sourceId),
      content: article.paragraphs.map((p) => ({
        heading: translate(locale, p.heading),
        text: translate(locale, p.text),
      })),
      editorialStatus:
        article.reviewed ? "Staff-confirmed professional and safety review; source and rights checked. Not individualized clinical advice." : article.kind === "research"
          ? "Abstract-based paraphrase and translation; not professionally reviewed."
          : "Editorial summary; not professionally reviewed.",
    })),
  };
}
