"use client";
import Image from "next/image";
import bloomieIcon from "@/ICON2.png";
import { LanguagePicker, useLocale } from "./locale";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BookOpen,
  Check,
  CircleHelp,
  Headphones,
  HeartHandshake,
  Leaf,
  LogOut,
  MessageCircle,
  Pause,
  Settings2,
  ShieldCheck,
  Sun,
  Volume2,
} from "lucide-react";
import { validSupabaseConfig } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/psylink/content";
import { useCatalog } from "./catalog";
import { safetyReply } from "@/lib/psylink/safety";
import { Chat } from "./chat";
import { Library } from "./library";
import { Care } from "./care";
import { Modal } from "./modal";
import { BookArt } from "./art";
import {TodayTogether} from "./today-together";
import {TogetherSettings,TogetherBanners} from "./together-controls";
import type {Category} from "@/lib/together/model";
type Tab = "chat" | "library" | "today" | "care";
type Dialog = "settings" | "safety" | "about" | "reminder" | "login" | null;
const configured = validSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
type Reminder = {
  enabled: boolean;
  morning: string;
  evening: string;
  twice: boolean;
};
function localRead<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function Bloomie() {
  const { t, locale } = useLocale();
  const { sources } = useCatalog();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [todayFilter,setTodayFilter]=useState<Category|'all'>('all');
  function openTogether(category?:Category){setTodayFilter(category||'all');setTab('today');}
  useEffect(()=>{const open=(e:Event)=>{const target=(e as CustomEvent).detail?.tab;if(target==='care')setTab('care');else{setTodayFilter('all');setTab('today');}};const login=()=>setDialog('login');window.addEventListener('bloomie-login-open',login);window.addEventListener('bloomie-together-open',open);return()=>{window.removeEventListener('bloomie-login-open',login);window.removeEventListener('bloomie-together-open',open);};},[]);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [savingReady, setSavingReady] = useState(!configured);
  const [ai, setAi] = useState(false);
  const [status, setStatus] = useState("");
  const [tts, setTts] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioConsent, setAudioConsent] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  const audioRequest = useRef<AbortController | null>(null);
  const audioCache = useRef(new Map<string, Blob>());
  const audioUrl = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [email, setEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [reminder, setReminder] = useState<Reminder>({
    enabled: false,
    morning: "08:30",
    evening: "20:30",
    twice: false,
  });
  const [reminderDraft, setReminderDraft] = useState<Reminder>({
    enabled: false,
    morning: "08:30",
    evening: "20:30",
    twice: false,
  });
  function openReminder() {
    setReminderDraft(reminder);
    setDialog("reminder");
  }
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const localFavorites = useRef<string[]>([]);
  const activeUser = useRef<string | null>(null);
  const initialAuth = useRef(true);
  useEffect(() => {
    setReady(true);
    const value = localRead<unknown>("psylink-favorites", []);
    const ids = Array.isArray(value)
      ? value.filter(
          (id): id is string =>
            typeof id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(id),
        )
      : [];
    localFavorites.current = ids;
    setSaved(ids);
    const prefs = localRead<Partial<Reminder>>("psylink-reminder", {});
    const validTime = (s: unknown) =>
      typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
    setReminder({
      enabled: prefs.enabled === true,
      twice: prefs.twice === true,
      morning: validTime(prefs.morning) ? prefs.morning! : "08:30",
      evening: validTime(prefs.evening) ? prefs.evening! : "20:30",
    });

    if (new URLSearchParams(location.search).get("auth") === "error") {
      setStatus("登录链接已失效或未能验证，请重新获取登录链接。");
      history.replaceState({}, "", "/");
    }
    if (!configured) return;
    const supabase = createClient();
    let alive = true;
    async function updateUser(nextUser: User | null) {
      if (!alive) return;
      if (!initialAuth.current && activeUser.current === (nextUser?.id || null))
        return;
      initialAuth.current = false;
      activeUser.current = nextUser?.id || null;
      setUser(nextUser);
      window.dispatchEvent(new Event("bloomie-auth-changed"));
      setSavingReady(false);
      setSaved(nextUser ? [] : localFavorites.current);
      if (nextUser) {
        const { data, error } = await supabase
          .from("favorites")
          .select("article_id")
          .eq("user_id", nextUser.id);
        if (!alive || activeUser.current !== nextUser.id) return;
        if (error) {
          setStatus(
            "云端书架暂时无法读取，收藏操作已暂停。请检查连接或重新登录。",
          );
          return;
        }
        setSaved(
          (data || [])
            .map((row) => row.article_id)
            .filter((id) => typeof id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(id)),
        );
      }
      setSavingReady(true);
    }
    supabase.auth.getUser().then(({ data }) => updateUser(data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => {
          void updateUser(session?.user || null);
        }, 0);
      },
    );
    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      fetch("/api/status")
        .then((r) => r.json())
        .then((s) => {
          if (alive) {
            setAi(s.ai === true);
            setTts(s.tts === true);
          }
        })
        .catch(() => {});
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      alive = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 6500);
    return () => clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (!reminder.enabled) return;
    const check = () => {
      const date = new Date();
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${time}`;
      if (
        document.visibilityState === "visible" &&
        (time === reminder.morning ||
          (reminder.twice && time === reminder.evening)) &&
        sessionStorage.getItem("psylink-last-reminder") !== dateKey
      ) {
        sessionStorage.setItem("psylink-last-reminder", dateKey);
        setStatus("给自己留几分钟：今天的阅读在书架等你。你也可以晚一点再看。");
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [reminder]);
  useEffect(() => () => stopAudio(), []);
  useEffect(() => {
    stopAudio();
    setAudioError("");
  }, [locale]);
  function toggleSave(id: string) {
    if (!savingReady) {
      setStatus("书架正在连接，暂时不能保存。");
      return;
    }
    const wasSaved = saved.includes(id);
    const next = wasSaved ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    if (!user) {
      try {
        localStorage.setItem("psylink-favorites", JSON.stringify(next));
        localFavorites.current = next;
        setStatus(
          wasSaved ? "已从书架移除" : "已放入你的书架 · 保存在当前浏览器",
        );
      } catch {
        setSaved(saved);
        setStatus("浏览器不允许保存。请检查存储设置。");
      }
      return;
    }
    const idAtSave = user.id;
    saveQueue.current = saveQueue.current
      .then(async () => {
        const client = createClient();
        const { error } = wasSaved
          ? await client
              .from("favorites")
              .delete()
              .eq("user_id", idAtSave)
              .eq("article_id", id)
          : await client
              .from("favorites")
              .upsert(
                { user_id: idAtSave, article_id: id },
                { onConflict: "user_id,article_id" },
              );
        if (activeUser.current !== idAtSave) return;
        if (error) {
          setSaved((current) =>
            wasSaved
              ? [...new Set([...current, id])]
              : current.filter((x) => x !== id),
          );
          setStatus("云端保存失败，这次操作已撤回。");
        } else setStatus(wasSaved ? "已从云端书架移除" : "已放入你的云端书架");
      })
      .catch(() => setStatus("云端连接中断，请重新登录后检查收藏。"));
  }
  function read(a: Article) {
    stopAudio();
    setAudioError("");
    setArticle(a);
  }
  function stopAudio() {
    audioRequest.current?.abort();
    audioRequest.current = null;
    player.current?.pause();
    player.current = null;
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
    setSpeaking(false);
    setAudioLoading(false);
  }
  function closeReader() {
    stopAudio();
    setArticle(null);
  }
  async function speak() {
    if (speaking || audioLoading) {
      stopAudio();
      return;
    }
    if (!article) return;
    if (!tts) {
      setAudioError("自然语音尚未接入，文字内容仍可阅读。");
      return;
    }
    if (!audioConsent) {
      setAudioError("请先同意使用 OpenAI 生成语音。");
      return;
    }
    stopAudio();
    setAudioError("");
    setAudioLoading(true);
    const controller = new AbortController();
    audioRequest.current = controller;
    try {
      const cacheKey = `${article.id}:${locale}`;
      let blob = audioCache.current.get(cacheKey);
      if (!blob) {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: article.id,
            locale,
            consent: true,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || "自然语音暂时无法生成，请重试或继续阅读。",
          );
        }
        blob = await response.blob();
        if (audioCache.current.size >= 8)
          audioCache.current.delete(audioCache.current.keys().next().value!);
        audioCache.current.set(cacheKey, blob);
      }
      if (controller.signal.aborted) return;
      audioUrl.current = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl.current);
      player.current = audio;
      audio.onended = () => {
        setSpeaking(false);
      };
      audio.onerror = () => {
        setSpeaking(false);
        setAudioError("播放暂时不可用，文字内容仍可阅读。");
      };
      setAudioLoading(false);
      try {
        await audio.play();
      } catch {
        throw new Error("播放暂时不可用，文字内容仍可阅读。");
      }
      if (!controller.signal.aborted) setSpeaking(true);
      else audio.pause();
    } catch (e) {
      if (!controller.signal.aborted) {
        setAudioLoading(false);
        setAudioError(
          e instanceof Error
            ? e.message
            : "自然语音暂时无法生成，请重试或继续阅读。",
        );
      }
    }
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || authBusy) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const { error } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setAuthMessage(
        error
          ? "暂时无法发送登录邮件，请稍后再试。"
          : "登录链接已发送，请检查邮箱。链接仅用于登录。",
      );
    } catch {
      setAuthMessage("连接失败，请稍后再试。");
    } finally {
      setAuthBusy(false);
    }
  }
  const nav = [
    {
      id: "chat" as const,
      title: "聊一聊",
      subtitle: "让心事有处安放",
      icon: MessageCircle,
    },
    {
      id: "library" as const,
      title: "小小书架",
      subtitle: "一点知识，一点陪伴",
      icon: BookOpen,
    },
    {
      id: "today" as const,
      title: "今天一起",
      subtitle: "每天十分钟，靠近一点",
      icon: Sun,
    },
    {
      id: "care" as const,
      title: "找到支持",
      subtitle: "多一个人，一起想办法",
      icon: HeartHandshake,
    },
  ];
  const heading = nav.find((n) => n.id === tab)!;
  return (
    <div className="app-shell" data-ready={ready}>
      <a href="#main" className="skip-link">
        {t("跳到主要内容")}
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setTab("chat")}
          aria-label={t("Bloomie首页")}
        >
          <span className="brand-mark">
            <Image
              src={bloomieIcon}
              alt=""
              width={48}
              height={48}
              sizes="48px"
            />
          </span>
          <span>{t("Bloomie")}</span>
        </button>
        <span className="sidebar-caption">{t("给家庭一处安心的空间")}</span>
        <nav className="main-nav" aria-label={t("主导航")}>
          {nav.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={21} />
              <span>
                {t(n.title)}
                <small>{t(n.subtitle)}</small>
              </span>
              {tab === n.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sun size={21} />
            <p>
              {t("慢慢来，")}
              <br />
              {t("你已经在用心了。")}
            </p>
          </div>
          <button onClick={() => setDialog("safety")}>
            <ShieldCheck size={17} />
            {t("安全与求助")}
          </button>
          <button onClick={() => setDialog("settings")}>
            <Settings2 size={17} />
            {t("偏好设置")}
          </button>
          <button onClick={() => setDialog("about")}>
            <CircleHelp size={17} />
            {t("关于Bloomie")}
            <span className="version">v0.1</span>
          </button>
        </div>
      </aside>
      <main id="main" className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">YOUR FAMILY, A LITTLE LIGHTER</span>
            <h1>
              {t(heading.title)}
              <span>{t(heading.subtitle)}</span>
            </h1>
          </div>
          <div className="header-actions">
            <LanguagePicker />
            <button className="mobile-settings-button" aria-label={t("偏好设置")} onClick={()=>setDialog("settings")}><Settings2 size={17}/></button>
            <button
              className="environment-pill"
              onClick={() => setDialog("about")}
            >
              <span className="status-dot" />
              {t(ai ? "试用版" : "体验版")}
            </button>
            <button
              className="user-avatar"
              aria-label={t(user ? "打开账户设置" : "登录或了解本地模式")}
              onClick={() => setDialog(user ? "settings" : "login")}
            >
              {user ? user.email?.slice(0, 1).toUpperCase() || "U" : t("你")}
            </button>
          </div>
        </header>
        <TogetherBanners onToday={()=>openTogether()} onCare={()=>setTab("care")}/>
        <div hidden={tab !== "chat"}>
          <Chat
            active={tab === "chat"}
            ai={ai}
            onRead={read}
            onTogether={()=>openTogether()}
            onCare={() => setTab("care")}
            onSafety={() => setDialog("safety")}
            onLogin={() => setDialog("login")}
          />
        </div>
        <div hidden={tab !== "library"}>
          <Library
            saved={saved}
            toggleSave={toggleSave}
            onRead={read}
            onReminder={openReminder}
          />
        </div>
        <div hidden={tab !== "today"}><TodayTogether active={tab==="today"} filter={todayFilter} onFilter={setTodayFilter} onRead={read}/></div>
        <div hidden={tab !== "care"}>
          <Care onTogether={openTogether} onSafety={() => setDialog("safety")} onLogin={() => setDialog("login")} />
        </div>
        <footer className="app-footer">
          <Leaf size={12} />
          <span>{t("陪伴家庭的每一个小小日常")}</span>
          <button onClick={() => setDialog("about")}>
            {t("使用边界与演示说明")}
          </button>
        </footer>
      </main>
      <nav className="mobile-nav" aria-label={t("移动端主导航")}>
        {nav.map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? "active" : ""}
            aria-current={tab === n.id ? "page" : undefined}
            onClick={() => setTab(n.id)}
          >
            <n.icon size={22} />
            <span>{t(n.title)}</span>
          </button>
        ))}
      </nav>
      {status && (
        <div className="toast" role="status">
          <Check size={17} />
          {t(status)}
        </div>
      )}
      {article && (
        <Modal wide title={t("小小书架 · 阅读")} onClose={closeReader}>
          <div className="reader-top">
            <div className={`reader-book ${article.color}`}>
              <BookArt motif={article.motif} />
            </div>
            <div>
              <span className="eyebrow">
                {article.kind === "research" && <>{t("论文导读")} · </>}
                {t(article.category)} · {article.minutes}
                {t("分钟")}
              </span>
              <h2>
                {t(article.title).replace("\n", locale === "zh-CN" ? "" : " ")}
              </h2>
              <p>{t(article.subtitle)}</p>
            </div>
          </div>
          <div className="reader-actions">
            <button className="secondary-button" onClick={speak}>
              {speaking ? <Pause size={17} /> : <Headphones size={17} />}{" "}
              {t(
                audioLoading
                  ? "取消生成"
                  : speaking
                    ? "停止朗读"
                    : "自然语音朗读",
              )}
            </button>
            <button
              className={`secondary-button ${saved.includes(article.id) ? "saved" : ""}`}
              onClick={() => toggleSave(article.id)}
            >
              <Bookmark
                size={16}
                fill={saved.includes(article.id) ? "currentColor" : "none"}
              />
              {t(saved.includes(article.id) ? "已收藏" : "放入书架")}
            </button>
          </div>
          {tts && (
            <label className="consent-check audio-consent">
              <input
                type="checkbox"
                checked={audioConsent}
                onChange={(e) => setAudioConsent(e.target.checked)}
              />
              {t("同意使用 OpenAI 生成本文语音，不发送聊天内容。")}
            </label>
          )}
          {audioLoading && (
            <p role="status" className="fine-print">
              {t("正在生成温和的声音…")}
            </p>
          )}
          {audioError && (
            <p className="error-message" role="alert">
              {t(audioError)}
            </p>
          )}
          <p className="fine-print">
            <Volume2 size={13} />
            {t(article.reviewed ? "AI 生成语音，非真人录音。一般教育资料，已完成平台专业复核。" : "AI 生成语音，非真人录音。一般教育资料，编辑整理待专业复核。")}
          </p>
          <div className="reader-body">
            {article.kind === "research" && (
              <p className="fine-print">
                {t(article.reviewed ? "研究摘要整理与翻译，非论文逐字摘录；已完成平台专业复核。" : "研究摘要整理与翻译，非论文逐字摘录；待专业复核。")}
              </p>
            )}
            {article.paragraphs.map((p) => (
              <section key={p.heading}>
                <h3>{t(p.heading)}</h3>
                <p>{t(p.text)}</p>
              </section>
            ))}
          </div>
          <div className="reader-source">
            <ShieldCheck size={19} />
            <div>
              <strong>{t("资料出处")}</strong>
              {sources
                .filter((s) => s.id === article.sourceId)
                .map((s) => (
                  <div key={s.id}>
                    {s.authors && (
                      <p>
                        {s.authors} · {s.year}
                      </p>
                    )}
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.publisher} · {s.title}
                      <ArrowUpRight size={14} />
                    </a>
                    <small>
                      {t(article.kind === "research" ? "书目信息核验：" : "链接核验：")}
                      {s.checked}
                      {t(
                        article.kind === "research"
                          ? "· 摘要依据，编辑整理，非作者官方译文。"
                          : article.sourceId.startsWith("cms-") ? "· 编辑整理，非来源机构官方译文。" : "· 编辑整理，非 UNICEF 官方译文。",
                      )}
                    </small>
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}
      {dialog && (
        <Modal
          title={t(
            {
              settings: "按你的节奏来",
              safety: "立即获得帮助",
              about: "关于Bloomie",
              reminder: "给阅读留一点时间",
              login: "把陪伴留在身边",
            }[dialog],
          )}
          onClose={() => {
            setDialog(null);
            setAuthMessage("");
          }}
        >
          {dialog === "safety" && (
            <>
              <div className="safety-heading">
                <ShieldCheck size={30} />
                <h3>{t("先确保你和孩子的安全")}</h3>
              </div>
              <p className="modal-description">{t(safetyReply)}</p>
              <div className="safety-box">
                <strong>{t("当前尚未上线经本地核验的热线目录")}</strong>
                <p>
                  {t(
                    "不能用测试联系人代替求助。请使用你所在地的官方急救、警方或医疗机构渠道。平台不能呼叫救援，没有真人值守。",
                  )}
                </p>
              </div>
              <p className="fine-print">
                {t(
                  "聊天中的风险识别可能漏判或误判。无需等待系统识别，你随时可以主动寻求紧急帮助。",
                )}
              </p>
            </>
          )}
          {dialog === "about" && (
            <>
              <div className="about-brand">
                <Image
                  src={bloomieIcon}
                  alt="Bloomie"
                  width={80}
                  height={80}
                  sizes="80px"
                />
                <h3>{t("Bloomie")}</h3>
                <p>{t("给家庭一处安心的空间")}</p>
              </div>
              <div className="feature-status">
                <p>
                  <span className="demo-tag">
                    {t(tts ? "已启用" : "待接入")}
                  </span>
                  {t(tts ? "自然语音已启用 · AI 生成" : "自然语音尚未接入")}
                </p>
                <p>
                  <Check size={16} />
                  {t("可用：阅读、本地收藏、应用内提醒")}
                </p>
                <p>
                  <span className="demo-tag">{t("演示")}</span>
                  {t("预约、视频房间、示例会后回顾")}
                </p>
                <p>
                  <span className="demo-tag">{t(ai ? "已启用" : "演示")}</span>
                  {t(
                    ai
                      ? "AI 聊天已启用，仍可能出错"
                      : "聊天为预设回复，尚未启用真实 AI",
                  )}
                </p>
              </div>
              <p className="modal-description">
                {t(
                  "面向成年照护者。不是诊断或治疗工具，不替代专业评估。资料出处与审核状态见各篇内容。带示例标记的咨询与视频功能为演示，真实人员通过经审核的外部渠道联系。聊天使用知识库检索；启用科学来源搜索后可补充联网资料，联网摘要未经过平台专业复核。",
                )}
              </p>
              <p className="fine-print">
                {t(
                  "聊天不自动保存；收藏和偏好默认保存在当前浏览器。清理浏览器存储会移除这些记录。接入并登录 Supabase 后，收藏可保存在云端。",
                )}
              </p>
            </>
          )}
          {dialog === "settings" && (
            <>
              <TogetherSettings/>
              <div className="settings-row">
                <h3>{t("语言")}</h3>
                <LanguagePicker />
              </div>
              <div className="settings-row">
                <div>
                  <h3>{t("阅读提醒")}</h3>
                  <p>
                    {t(
                      reminder.enabled
                        ? "已开启 · 仅应用打开时提醒"
                        : "默认关闭，按你的节奏来",
                    )}
                  </p>
                </div>
                <button className="text-button" onClick={openReminder}>
                  {t("设置")}
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <h3>{t(user ? "云端书架" : "本地书架")}</h3>
                  <p>{t(user?.email || "收藏只保存在当前浏览器")}</p>
                </div>
                {user ? (
                  <button
                    className="text-button"
                    onClick={async () => {
                      await createClient().auth.signOut();
                      setDialog(null);
                      setStatus("已退出账户，返回本地书架。");
                    }}
                  >
                    <LogOut size={16} />
                    {t("退出")}
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setDialog("login")}
                  >
                    {t("登录")}
                  </button>
                )}
              </div>
              <div className="settings-row">
                <div>
                  <h3>{t("清空本地收藏与提醒")}</h3>
                  <p>{t("不删除云端收藏；当前聊天仅在内存中。")}</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        t("清空本地收藏与提醒？这不会删除云端数据。"),
                      )
                    )
                      return;
                    try {
                      localStorage.removeItem("psylink-favorites");
                      localStorage.removeItem("psylink-podcasts");
                      window.dispatchEvent(new Event("psylink-local-cleared"));
                      localStorage.removeItem("psylink-reminder");
                      localFavorites.current = [];
                      if (!user) setSaved([]);
                      setReminder({
                        enabled: false,
                        morning: "08:30",
                        evening: "20:30",
                        twice: false,
                      });
                      setStatus("本地收藏与提醒已清空。");
                    } catch {
                      setStatus("无法清理浏览器存储。");
                    }
                  }}
                >
                  {t("清空")}
                </button>
              </div>
            </>
          )}
          {dialog === "reminder" && (
            <>
              <p className="modal-description">
                {t(
                  "留几分钟给自己，也可以随时暂停。第一版仅在应用打开且可见时提醒，不发送系统通知。",
                )}
              </p>
              <label className="toggle-row">
                <span>
                  <strong>{t("开启应用内提醒")}</strong>
                  <small>{t("时间以当前设备时区为准")}</small>
                </span>
                <input
                  type="checkbox"
                  checked={reminderDraft.enabled}
                  onChange={(e) =>
                    setReminderDraft({
                      ...reminderDraft,
                      enabled: e.target.checked,
                    })
                  }
                />
              </label>
              <label className="time-setting">
                {t("第一次提醒")}
                <input
                  type="time"
                  value={reminderDraft.morning}
                  onChange={(e) =>
                    setReminderDraft({
                      ...reminderDraft,
                      morning: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="toggle-row">
                <span>{t("增加晚间提醒")}</span>
                <input
                  type="checkbox"
                  checked={reminderDraft.twice}
                  onChange={(e) =>
                    setReminderDraft({
                      ...reminderDraft,
                      twice: e.target.checked,
                    })
                  }
                />
              </label>
              {reminderDraft.twice && (
                <label className="time-setting">
                  {t("第二次提醒")}
                  <input
                    type="time"
                    value={reminderDraft.evening}
                    onChange={(e) =>
                      setReminderDraft({
                        ...reminderDraft,
                        evening: e.target.value,
                      })
                    }
                    required
                  />
                </label>
              )}
              <button
                className="primary-button full"
                disabled={
                  !reminderDraft.morning ||
                  (reminderDraft.twice && !reminderDraft.evening)
                }
                onClick={() => {
                  try {
                    localStorage.setItem(
                      "psylink-reminder",
                      JSON.stringify(reminderDraft),
                    );
                    setReminder(reminderDraft);
                    setDialog(null);
                    setStatus("阅读偏好已保存 · 仅在应用打开时提醒");
                  } catch {
                    setStatus("偏好未能保存，请检查浏览器存储设置。");
                  }
                }}
              >
                <Bell size={17} />
                {t("保存偏好")}
              </button>
            </>
          )}
          {dialog === "login" && (
            <>
              <div className="about-brand">
                <Image
                  src={bloomieIcon}
                  alt="Bloomie"
                  width={80}
                  height={80}
                  sizes="80px"
                />
                <h3>{t("你的书架，可以随身带着。")}</h3>
              </div>
              {configured ? (
                <form onSubmit={login}>
                  <p className="modal-description">
                    {t(
                      "用邮箱接收登录链接，无需设置密码。登录后使用云端书架；本地收藏不会自动上传。",
                    )}
                  </p>
                  <label className="field-label">
                    {t("邮箱地址")}
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <button className="primary-button full" disabled={authBusy}>
                    {t(authBusy ? "正在发送…" : "发送登录链接")}
                    <ArrowRight size={16} />
                  </button>
                  {authMessage && (
                    <p role="status" className="modal-description">
                      {t(authMessage)}
                    </p>
                  )}
                </form>
              ) : (
                <>
                  <span className="demo-tag">{t("云端登录尚未开放")}</span>
                  <p className="modal-description">
                    {t(
                      "当前可以直接阅读和收藏。收藏保存在此浏览器；接入 Supabase 后再开放邮箱登录与云端同步。",
                    )}
                  </p>
                  <button
                    className="primary-button full"
                    onClick={() => setDialog(null)}
                  >
                    {t("先使用本地书架")}
                  </button>
                </>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
