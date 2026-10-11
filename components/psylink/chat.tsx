"use client";
import { useLocale } from "./locale";
import {useTogether,useTogetherText} from "./together-state";
import {localized,selectedActivity,type Activity} from "@/lib/together/model";
import {useVoiceInput} from "./use-voice-input";
import {voiceLabels} from "@/lib/psylink/voice-labels";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ArrowUp,
  Mic,
  LoaderCircle,
  X,
  ArrowUpRight,
  BookOpen,
  LockKeyhole,
  Languages,
  HeartHandshake,
  Plus,
  ShieldCheck,
} from "lucide-react";
import type { Article, Source } from "@/lib/psylink/content";
import { useCatalog } from "./catalog";
type Message = {
  role: "user" | "assistant";
  content: string;
  sourceIds?: string[];
  sources?: (Source & {origin?:string})[];
  searchStatus?: string;
  mode?: string;
  articleId?: string;
  today?: Activity[];
  todayDate?: string;
};
export function Chat({
  ai,
  active,
  onRead,
  onCare,
  onTogether,
  onSafety,
  onLogin,
}: {
  ai: boolean;
  active: boolean;
  onRead: (a: Article) => void;
  onCare: () => void;
  onTogether: () => void;
  onSafety: () => void;
  onLogin: () => void;
}) {
  const { t, locale } = useLocale();
  const { articles, sources } = useCatalog();
  const {state:familyState,day:familyDay,activityCatalog,circleCatalog,catalogReady,catalogError,mode:togetherMode}=useTogether();
  const l=useTogetherText();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const [historyScrolling, setHistoryScrolling] = useState(false);
  const voice=useVoiceInput({onLogin,onText:(text,autoSend)=>{setDraft(text);input.current?.focus();if(autoSend)void send(text);}});
  const v=voiceLabels[locale];
  const pointer=useRef<{id:number;x:number;y:number}|null>(null);
  useEffect(()=>{if(!active&&voice.phase!=='idle')voice.cancel();},[active,voice.phase]);
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&voice.phase!=='idle')voice.cancel();};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[voice.phase]);

  useEffect(() => {
    const canvas = history.current;
    const controls = composer.current;
    if (!canvas || !controls || !active || !messages.length) {
      setHistoryScrolling(false);
      return;
    }
    let reading = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reveal = () => {
      reading = false;
      clearTimeout(timer);
      setHistoryScrolling(false);
    };
    const postponeReveal = () => {
      clearTimeout(timer);
      timer = setTimeout(reveal, 650);
    };
    const gesture = () => {
      if (voice.phase !== 'idle' || busy || error || controls.contains(document.activeElement)) return;
      reading = true;
      setHistoryScrolling(true);
      postponeReveal();
    };
    const scroll = () => {
      if (reading) postponeReveal();
    };
    canvas.addEventListener('wheel', gesture, {passive: true});
    canvas.addEventListener('touchmove', gesture, {passive: true});
    // Only user gestures begin hiding; programmatic message scrolling does not.
    canvas.addEventListener('scroll', scroll, {passive: true});
    controls.addEventListener('focusin', reveal);
    return () => {
      clearTimeout(timer);
      canvas.removeEventListener('wheel', gesture);
      canvas.removeEventListener('touchmove', gesture);
      canvas.removeEventListener('scroll', scroll);
      controls.removeEventListener('focusin', reveal);
      setHistoryScrolling(false);
    };
  }, [active, messages.length, voice.phase, busy, error]);
  const hideComposer = historyScrolling && voice.phase === 'idle' && !busy && !error;

  useEffect(() => {
    if (!composer.current) return;
    const element = composer.current;
    const observer = new ResizeObserver(() => {
      element
        .closest<HTMLElement>(".conversation")
        ?.style.setProperty(
          "--composer-clearance",
          `${element.offsetHeight + 12}px`,
        );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = "0px";
    input.current.style.height = `${Math.min(144, Math.max(24, input.current.scrollHeight))}px`;
  }, [draft]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(text = draft, todayTogether=false) {
    if (!text.trim() || busy) return;
    setError("");
    const today=todayTogether?familyState.ages.map(age=>selectedActivity(familyState,familyDay,age,activityCatalog,circleCatalog)).filter((a):a is Activity=>!!a):undefined;
    const next: Message[] = [
      ...messages,
      { role: "user", content: text.trim() },
    ];
    if (next.length > 19) {
      setError("这段对话已达到长度上限。请开启新对话。");
      return;
    }
    setMessages(next);
    setDraft("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          locale,
          ...(todayTogether?{todayTogether:true}:{}),
        }),
        signal: controller.current.signal,
      });
      const data = await r.json();
      if (!r.ok) {
        setMessages(messages);
        setDraft(text);
        setError(data.error || "暂时无法回复，请重试。");
        if (r.status === 401) onLogin();
        return;
      }
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.text,
          sourceIds: data.sourceIds,
          sources: data.sources,
          searchStatus: data.searchStatus,
          mode: data.mode,
          articleId: data.articleId,
          ...(todayTogether&&!["safety","blocked"].includes(data.mode)?{today,todayDate:familyDay}:{}),
        },
      ]);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setMessages(messages);
        setDraft(text);
        setError("连接暂时中断，你的文字已保留，可以重试。");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-layout modern-chat">
      <section className="conversation paper">
        <div className="conversation-top">
          <div className="chat-identity">
            <div>
              <strong>Bloomie</strong>
              <span>{t(ai ? "AI 家庭支持" : "聊天体验 · 演示")}</span>
            </div>
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              voice.cancel();
                setMessages([]);
              setError("");
              setDraft("");
            }}
          >
            <Plus size={15} />
            {t("新对话")}
          </button>
        </div>
        <div
          ref={history}
          className={`conversation-body ${messages.length ? "has-messages" : ""}`}
        >
          {!messages.length ? (
            <div className="welcome">
              <h2>
                {t("把心里的小事，")}
                <br />
                {t("慢慢说出来。")}
              </h2>
              <p>
                {t("育儿的困惑、家人的关系，或一点说不清的担心。")}{" "}
                <br className="desktop-break" />
                {t("在这里，可以从任何一句话开始。")}
              </p>
              <div className="starters">
                {[
                  "最近育儿有点累",
                  "孩子总是发脾气",
                  "和家人育儿意见不同",
                  "我担心孩子的发展",
                  "今天可以和孩子玩点什么？",
                ].map((s) => (
                  <button disabled={busy||(s==='今天可以和孩子玩点什么？'&&(!catalogReady||!!catalogError))} key={s} onClick={() => send(t(s),s==="今天可以和孩子玩点什么？")}>
                    {t(s)}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages" role="log" aria-label={t("本次对话")}>
              {messages.map((m, i) => (
                <div className={`message ${m.role}`} key={i}>
                  <div className="message-content">
                    {m.role === "assistant" && (
                      <span className="message-label">
                        {t(
                          m.mode === "demo"
                            ? "预设演示回答"
                            : m.mode === "safety"
                              ? "安全支持"
                              : m.mode === "blocked"
                                ? "安全检查"
                                : "Bloomie",
                        )}
                      </span>
                    )}
                    <p>
                      {m.mode === "demo" ||
                      m.mode === "safety" ||
                      m.mode === "blocked"
                        ? t(m.content)
                        : m.content}
                    </p>
                    {["unavailable","no_accepted_sources"].includes(m.searchStatus||"")&&<small className="fine-print">{t("本次未取得合适的联网资料；回答仅使用现有知识与一般支持。")}</small>}
                    {m.today && <section className="chat-today-recommendation" aria-label={l('今天一起 · 活动建议','Today Together · Activity suggestion')}>
                      <header className="chat-activity-header">
                        <span className="chat-activity-icon"><HeartHandshake size={19} aria-hidden="true" /></span>
                        <div><strong>{l('今天一起','Today Together')}</strong><time>{m.todayDate}</time></div>
                      </header>
                      {m.today.length ? m.today.map(a => {
                        const c = localized(a.copy, locale);
                        return <article className="chat-activity" key={a.id}>
                          <div className="chat-activity-meta"><span>{a.minutes} {l('分钟','min')}</span><span>{l(a.age==='baby'?'0–12 个月':a.age==='toddler'?'1–3 岁':'3–5 岁',a.age==='baby'?'0–12 months':a.age==='toddler'?'Ages 1–3':'Ages 3–5')}</span></div>
                          <h3>{c.title}</h3>
                          <small className="chat-activity-review">{a.reviewStatus==='reviewed'?(togetherMode==='local'?l('本机审核流程预览','Local review workflow preview'):l('已通过发布审核','Reviewed for publication')):l('编辑初稿 · 待专业复核','Editorial draft · awaiting review')}</small>
                          <div className="chat-activity-materials"><span>{l('准备这些就好','All you need')}</span><p>{c.materials.join(' · ')}</p></div>
                          <ol className="chat-activity-steps">{c.steps.map((step,j)=><li key={j}><span aria-hidden="true">{j+1}</span><p>{step}</p></li>)}</ol>
                          <div className="chat-activity-why"><span>{l('这一刻的意义','Why this helps')}</span><p>{c.why}</p></div>
                        </article>;
                      }) : <p className="chat-activity-empty">{l('先选孩子的年龄段，我们再显示今天适合的小活动。','Choose your children’s age groups to see today’s activities.')}</p>}
                      <footer className="chat-activity-footer"><small>{l('年龄和活动选择仅留在当前浏览器。','Age groups and selections stay in this browser.')}</small><button className="chat-activity-link" onClick={onTogether}>{l('去今天一起看看','Open Today Together')}<ArrowUpRight size={16} aria-hidden="true"/></button></footer>
                    </section>}
                    {m.sourceIds && m.sourceIds.length > 0 && (
                      <details className="source-details">
                        <summary>
                          {t("资料依据 ·")}
                          {m.sourceIds.length}
                          {t("项")}
                        </summary>
                        {(m.sources || sources)
                          .filter((s) => m.sourceIds?.includes(s.id))
                          .map((s) => (
                            <a
                              key={s.id}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {m.sources?.find(v=>v.id===s.id)?.origin === "web" && t("联网来源 · ")}{s.publisher} · {s.title}
                              <ArrowUpRight size={13} />
                            </a>
                          ))}
                        <small>{t("参考资料不代表完成个体评估。")}{m.sources?.some(s=>s.origin==="web")&&<span> {t("联网资料已核验来源域名，摘要未经过平台专业复核。")}</span>}</small>
                      </details>
                    )}
                    {m.articleId && (
                      <button
                        className="inline-recommendation"
                        onClick={() =>
                          (()=>{const article=articles.find(a=>a.id===m.articleId);if(article)onRead(article);})()
                        }
                      >
                        <BookOpen size={17} />
                        {t(
                          articles.find((a) => a.id === m.articleId)?.title ||
                            "",
                        ).replace("\n", locale === "zh-CN" ? "" : " ")}
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                    {m.role === "assistant" &&
                      m.mode !== "safety" &&
                      m.mode !== "blocked" &&
                      i === messages.length - 1 && (
                        <button
                          className="text-button care-link"
                          onClick={onCare}
                        >
                          {t("想了解真人支持？体验咨询流程")}{" "}
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    {m.mode === "safety" && (
                      <button className="secondary-button" onClick={onSafety}>
                        {t("查看立即求助说明")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="typing-status" role="status">
                  <span className="sr-only">{t("正在整理回应…")}</span>
                  <i />
                  <i />
                  <i />
                </div>
              )}
              <div ref={end} />
            </div>
          )}
        </div>
        <div className={`composer-area ${hideComposer ? "is-reading-history" : ""}`} ref={composer} inert={hideComposer} aria-hidden={hideComposer || undefined}>
          {error && (
            <p className="error-message" role="alert">
              {t(error)}
            </p>
          )}
          <div className="voice-guidance" aria-live="polite">
            {voice.phase==='recording'?<><span className="voice-record-dot" aria-hidden="true"/><strong>{v.recording}<span aria-hidden="true"> · {voice.seconds}s</span></strong><span>{voice.intent==='send'?v.send:voice.intent==='cancel'?v.cancel:v.edit}</span><button type="button" aria-label={v.cancelButton} onClick={voice.cancel}><X size={15}/></button></>:voice.phase==='requesting'?v.requesting:voice.phase==='transcribing'?<><LoaderCircle size={14} className="voice-spinner"/>{voice.intent==='send'?v.sending:v.transcribing}</>:voice.notice?<span role={voice.notice==='ready'||voice.notice==='cancelled'?'status':'alert'}>{v[voice.notice as keyof typeof v]||v.provider}</span>:null}
          </div>
          <form
            className={`composer voice-${voice.phase} ${voice.intent==='send'?'voice-send-ready':''} ${voice.notice==='ready'?'voice-text-ready':''}`}
            onSubmit={(e) => {
              e.preventDefault();
              if(voice.phase==='idle')void send();
            }}
          >
            <textarea
              ref={input}
              aria-label={t("输入你想聊的事")}
              placeholder={t("今天，有什么想聊聊的？")}
              maxLength={2000}
              rows={1}
              value={draft}
              readOnly={voice.phase!=='idle'}
              onChange={(e) => {setDraft(e.target.value);voice.clearNotice();}}
              onKeyDown={(e) => {
                if (
                  voice.phase==='idle' &&
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {draft.trim()?<button className="send-button" type="submit" aria-label={t("发送消息")} disabled={busy||voice.phase!=='idle'}><ArrowUp size={20}/></button>:<button
              type="button" className="send-button voice-button" aria-pressed={voice.phase==='recording'} aria-label={v.hold} title={v.hint} aria-describedby="voice-input-privacy"
              disabled={busy||voice.phase==='transcribing'}
              onPointerDown={e=>{if(e.button!==0||voice.phase!=='idle')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointer.current={id:e.pointerId,x:e.clientX,y:e.clientY};void voice.start();}}
              onPointerMove={e=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;voice.aim(e.clientX-p.x < -100?'cancel':p.y-e.clientY>65?'send':'edit');}}
              onPointerUp={e=>{if(pointer.current?.id!==e.pointerId)return;e.preventDefault();pointer.current=null;voice.finish();}}
              onPointerCancel={()=>{pointer.current=null;voice.cancel();}}
              onLostPointerCapture={()=>{if(pointer.current){pointer.current=null;voice.cancel();}}}
              onContextMenu={e=>e.preventDefault()}
              onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();void voice.start();}}}
              onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();voice.finish('edit');}}}
            >{voice.phase==='transcribing'?<LoaderCircle size={20} className="voice-spinner"/>:voice.intent==='send'&&voice.phase==='recording'?<ArrowUp size={20}/>:<Mic size={20}/>}</button>}
          </form>
          <details className="composer-help">
            <summary>
              <LockKeyhole size={12} aria-hidden="true" />
              <span>{t("本次对话不会自动保存")}{!ai ? ` · ${t("当前为预设演示回复；请使用虚构情境体验。")}` : ""}</span>
              <span className="composer-help-label">{v.details}</span>
              <ChevronDown size={12} aria-hidden="true" />
            </summary>
            <div className="composer-help-body">
              <p>{v.hint}</p>
              <p id="voice-input-privacy">{v.privacy}</p>
              <p>{t(ai ? "AI 可能出错，不提供诊断；没有真人实时监看。" : "当前为预设演示回复；请使用虚构情境体验。")}</p>
            </div>
          </details>
        </div>
      </section>
      <aside className="chat-aside">
        <button
          className="daily-card paper"
          onClick={() => articles[0] && onRead(articles[0])}
        >
          <span className="quiet-label">{t("给今天的你")}</span>
          <div className="mini-book sage">
            <BookOpen size={26} />
          </div>
          <h3>
            {t("先照顾自己，")}
            {locale === "en-US" ? " " : <br />}
            {t("再拥抱孩子")}
          </h3>
          <span className="daily-meta">
            {t("3 分钟阅读 · 可自然语音朗读")}
            <ArrowUpRight size={17} />
          </span>
        </button>
        <div className="chat-highlights">
          <div className="trust-note">
            <ShieldCheck size={19} />
            <div>
              <strong>{t("让每一份建议有出处")}</strong>
              <p>
                {t("参考 UNICEF 公开资料")}
                <br />
                {t("编辑整理待专业复核")}
              </p>
            </div>
          </div>
          <div className="trust-note">
            <LockKeyhole size={19} />
            <div>
              <strong>{t("你决定说多少")}</strong>
              <p>{t("对话不会自动保存，请避免提供个人信息。")}</p>
            </div>
          </div>
          <div className="trust-note">
            <Languages size={19} />
            <div>
              <strong>{t("用熟悉的语言表达")}</strong>
              <p>{t("支持中文、美式英语、西班牙语、日语和韩语。")}</p>
            </div>
          </div>
          <div className="trust-note">
            <HeartHandshake size={19} />
            <div>
              <strong>{t("安全，是陪伴的底线")}</strong>
              <p>{t("遇到风险时，优先提供安全支持与求助说明。")}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
