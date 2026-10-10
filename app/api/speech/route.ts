import { publicCatalog } from "@/lib/admin/public-store";
import {
  translate,
  validLocale,
  languageNames,
  type Locale,
} from "@/lib/psylink/i18n";
import { sameOrigin, serviceStatus, localPreview } from "@/lib/psylink/service";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const fail = (error: string, status: number) =>
    Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (!sameOrigin(request)) return fail("请求来源不被允许。", 403);
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return fail("请求过长。", 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return fail("请求过长。", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("消息格式不正确。", 400);
  }
  if (!body || !validLocale(body.locale))
    return fail("请选择支持的语言。", 400);
  const locale: Locale = body.locale;
  const error = (text: string, status: number) =>
    fail(translate(locale, text), status);
  const article = (await publicCatalog(request,locale)).articles.find((a) => a.id === body.articleId);
  // Only editorial library content can be voiced. Never accept arbitrary client text.
  if (!article || body.text !== undefined)
    return error("请选择书架中的文章。", 400);
  if (!serviceStatus(request).tts)
    return error("自然语音尚未接入，文字内容仍可阅读。", 503);
  if (body.consent !== true)
    return error("请先同意使用 OpenAI 生成语音。", 403);
  if (!localPreview(request)) {
    try {
      const client = await createClient();
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser();
      if (authError || !user) return error("真实聊天需要先登录。", 401);
      const { data: permitted, error: quotaError } = await client.rpc(
        "consume_speech_quota",
      );
      if (quotaError) return error("语音服务暂时不可用，请稍后再试。", 503);
      if (!permitted) return error("今天的语音额度已用完。", 429);
    } catch {
      return error("语音服务暂时不可用，请稍后再试。", 503);
    }
  }
  const text = [
    translate(locale, article.title),
    ...article.paragraphs.flatMap((p) => [
      translate(locale, p.heading),
      translate(locale, p.text),
    ]),
  ].join("\n\n");
  if (text.length > 4096) return error("文章过长，暂时无法朗读。", 413);
  const voice = process.env.OPENAI_TTS_VOICE || "marin";
  if (!["marin", "cedar", "coral", "sage", "nova", "shimmer"].includes(voice))
    return error("语音配置需要检查。", 503);
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice,
        input: text,
        response_format: "mp3",
        speed: 0.9,
        instructions: `Speak in ${languageNames[locale]}. Use a warm, calm, natural conversational voice. Gentle pacing, short pauses between paragraphs. Avoid dramatic or whispered delivery.`,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
    });
    if (!response.ok || !response.body) throw new Error("Speech unavailable");
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return error("自然语音暂时无法生成，请重试或继续阅读。", 503);
  }
}
