import { NextResponse } from "next/server";
import { retrieveKnowledge } from "@/lib/psylink/knowledge";
import { chatPrompt } from "@/lib/psylink/chat-prompt";
import {searchConfigured, scientificSearch, validSearchPlan, searchTopics, searchAges, searchPlannerInstructions, type WebEvidence} from "@/lib/psylink/scientific-search";
import { publicCatalog } from "@/lib/admin/public-store";
import {
  containsUnverifiedContact,
  demoReply,
  needsSafetySupport,
  safetyReply,
  validateMessages,
} from "@/lib/psylink/safety";
import { createClient } from "@/lib/supabase/server";
import { serviceStatus, localPreview } from "@/lib/psylink/service";
import {
  translate,
  validLocale,
  type Locale,
} from "@/lib/psylink/i18n";
export const runtime = "nodejs";
export const maxDuration = 60;
async function openAI(path: string, body: unknown, timeout=20000) {
  const r = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) throw new Error("Provider unavailable");
  return r.json();
}
async function moderate(text: string) {
  const data = await openAI("moderations", {
    model: "omni-moderation-latest",
    input: text,
  },7000);
  if (
    !Array.isArray(data.results) ||
    !data.results[0] ||
    typeof data.results[0].flagged !== "boolean"
  )
    throw new Error("Moderation unavailable");
  return data.results[0];
}
export async function POST(request: Request) {
  let locale: Locale = "zh-CN";
  const json = (data: Record<string, unknown>, status = 200) =>
    NextResponse.json(
      {
        ...data,
        ...(typeof data.text === "string"
          ? { text: translate(locale, data.text) }
          : {}),
        ...(typeof data.error === "string"
          ? { error: translate(locale, data.error) }
          : {}),
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (
        new URL(origin).host !==
        (request.headers.get("host") || new URL(request.url).host)
      )
        return json({ error: "请求来源不被允许。" }, 403);
    } catch {
      return json({ error: "请求来源不被允许。" }, 403);
    }
  }
  if (Number(request.headers.get("content-length") || 0) > 100000)
    return json({ error: "消息过长。" }, 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 50000) return json({ error: "消息过长。" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "消息格式不正确。" }, 400);
  }
  if (body?.locale !== undefined && !validLocale(body.locale))
    return json({ error: "请选择支持的语言。" }, 400);
  locale = validLocale(body?.locale) ? body.locale : "zh-CN";

  if (!body || !validateMessages(body.messages))
    return json(
      { error: "请发送有效消息，每条不超过 2000 字。较长会话请开启新对话。" },
      400,
    );
  const messages: { role: "user" | "assistant"; content: string }[] =
    body.messages;
  const text = messages[messages.length - 1].content;
  if (
    needsSafetySupport(
      messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n"),
    )
  )
    return json({ text: safetyReply, mode: "safety", sourceIds: [] });
  if (!serviceStatus(request).ai) {
    if(body.todayTogether===true)return json({text:locale==='zh-CN'?'今天不需要准备很多。下面是你们今天的小活动，可以跟着孩子的兴趣慢慢试。':'You do not need much preparation today. Your little activities are below; follow your child’s interest and take your time.',mode:'activity',sourceIds:[]});
    return json({ ...demoReply(text), mode: "demo" });
  }
  if (!localPreview(request)) {
    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      )
        return json({ error: "真实聊天需要配置登录服务。" }, 503);
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user)
        return json({ error: "真实聊天需要先登录。" }, 401);
      const { data: permitted, error: quotaError } =
        await supabase.rpc("consume_chat_quota");
      if (quotaError)
        return json({ error: "聊天服务暂时不可用，请稍后再试。" }, 503);
      if (!permitted)
        return json({ error: "今天的聊天额度已用完，请稍后再试。" }, 429);
    } catch {
      return json({ error: "聊天服务暂时不可用，请稍后再试。" }, 503);
    }
  }
  try {
    const inputReview = await moderate(
      messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n"),
    );
    if (inputReview.flagged)
      return json({ text: safetyReply, mode: "safety", sourceIds: [] });
    const catalog = await publicCatalog(request,locale);
    const knowledge = retrieveKnowledge(messages, locale,catalog);
    let searchState="disabled";
    let webEvidence:WebEvidence[]=[];
    if(searchConfigured()&&body.todayTogether!==true){
      try{
        const planned=await openAI("responses",{
          model:process.env.OPENAI_MODEL,store:false,max_output_tokens:250,
          instructions:searchPlannerInstructions,
          input:JSON.stringify({question:text,recentUserContext:messages.filter(m=>m.role==="user").slice(-3),knowledgeMatched:knowledge.matched,knowledgeTitles:knowledge.evidence.map(e=>e.title)}),
          text:{format:{type:"json_schema",name:"scientific_search_plan",strict:true,schema:{type:"object",properties:{needed:{type:"boolean"},topics:{type:"array",items:{type:"string",enum:Object.keys(searchTopics)},minItems:1,maxItems:2},age:{type:"string",enum:Object.keys(searchAges)}},required:["needed","topics","age"],additionalProperties:false}}}
        },6000);
        const plan=JSON.parse(planned.output?.flatMap((o:{content?:{type:string;text?:string}[]})=>o.content||[]).filter((c:{type:string})=>c.type==="output_text").map((c:{text:string})=>c.text).join("")||"null");
        if(!validSearchPlan(plan))throw new Error("Invalid search plan");
        if(plan.needed){webEvidence=await scientificSearch(plan);searchState=webEvidence.length?"successful":"no_accepted_sources";}else searchState="not_needed";
      }catch{searchState="unavailable";}
    }
    const evidence = [...knowledge.evidence,...webEvidence];
    const allowedSourceIds = [
      ...new Set(evidence.map((item) => item.sourceId)),
    ];
    const result = await openAI("responses", {
      model: process.env.OPENAI_MODEL,
      store: false,
      max_output_tokens: body.todayTogether===true?400:2200,
      instructions: chatPrompt(locale,evidence,searchState)+(body.todayTogether===true?'\nThe user selected the Today Together starter. The UI will attach exact daily activity cards locally after your reply. Give only a short warm introduction to those cards, in the selected language: 2 or 3 sentences, at most 90 English words or 120 Chinese characters. Do not make scientific claims or add sections. Do not invent another activity, a title, materials or steps, or assume a child age. Explain that stopping or adapting is welcome. Age groups, notes and activity choices remain in the browser and are not supplied to you. These are editorial drafts awaiting review, not proven treatments.':''),
      input: messages,
      text: {
        format: {
          type: "json_schema",
          name: "caregiver_reply",
          strict: true,
          schema: {
            type: "object",
            properties: {
              text: { type: "string", description: "The complete answer in the selected language. For a substantive caregiver concern, write multiple short paragraphs separated by two newline characters, answer each part of the question, and include a concrete example the caregiver can try now. No canned empathy or offers to provide the actual advice later." },
              sourceIds: {
                type: "array",
                items: allowedSourceIds.length ? { type: "string", enum: allowedSourceIds } : {type:"string"},
                ...(allowedSourceIds.length ? {} : {maxItems:0}),
              },
              safety: { type: "boolean" },
            },
            required: ["text", "sourceIds", "safety"],
            additionalProperties: false,
          },
        },
      },
    });
    const output = result.output
      ?.flatMap(
        (o: { content?: { type: string; text?: string }[] }) => o.content || [],
      )
      .filter((c: { type: string }) => c.type === "output_text")
      .map((c: { text: string }) => c.text)
      .join("");
    if (!output) throw new Error("Empty response");
    const reply = JSON.parse(output);
    if (
      typeof reply.text !== "string" ||
      !reply.text.trim() ||
      !Array.isArray(reply.sourceIds) ||
      reply.sourceIds.some((s: string) => !allowedSourceIds.includes(s)) ||
      typeof reply.safety !== "boolean"
    )
      throw new Error("Invalid reply");
    if (reply.safety)
      return json({ text: safetyReply, mode: "safety", sourceIds: [] });
    if (containsUnverifiedContact(reply.text))
      throw new Error("Unverified contact in reply");
    const outputReview = await moderate(reply.text);
    if (outputReview.flagged)
      return json({
        text: "这次回答未通过安全检查，我暂时无法提供它。你可以换一种方式描述，或寻求当地专业人员帮助。",
        mode: "blocked",
        sourceIds: [],
      });
    return json({
      text: reply.text,
      sourceIds: reply.sourceIds,
      articleId: evidence.find((item) => catalog.articles.some(a=>a.id===item.articleId) &&
        reply.sourceIds.includes(item.sourceId),
      )?.articleId,
      sources: evidence.filter(item=>reply.sourceIds.includes(item.sourceId)).map(item=>({...item.source,origin:item.sourceId.startsWith("web-")?"web":"knowledge"})),
      searchStatus:searchState,
      mode: "live",
    });
  } catch {
    return json(
      {
        error:
          "服务暂时未能完成安全检查或生成回答。请稍后再试；紧急情况请联系当地紧急服务。",
      },
      503,
    );
  }
}
