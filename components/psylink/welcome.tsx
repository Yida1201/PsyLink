"use client";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, MessageCircle, Sun, Check, Mail } from "lucide-react";
import icon from "@/ICON2.png";
import { LanguagePicker, useLocale } from "./locale";
import { ThemeSwitch } from "./material";
import { Planter } from "./art";
import { useTogether } from "./together-state";
import "./welcome.css";

type Props = { configured: boolean; email: string; onEmail: (email: string) => void; onLogin: (event: FormEvent) => Promise<void>; busy: boolean; message: string; sent: boolean; onExplore: () => void };
export function Welcome({ configured, email, onEmail, onLogin, busy, message, sent, onExplore }: Props) {
  const { t, locale } = useLocale();
  const { state, ready, update, error } = useTogether();
  const [loginOpen, setLoginOpen] = useState(false);
  const [introPhase, setIntroPhase] = useState<"plant" | "brand" | "done">("plant");
  const introDone = introPhase === "done";
  const brandRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (introPhase !== "plant") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setIntroPhase("done"); return; }
    const timer = setTimeout(() => setIntroPhase("brand"), 1800);
    return () => clearTimeout(timer);
  }, [introPhase]);
  useLayoutEffect(() => {
    if (introPhase !== "brand" || !brandRef.current) return;
    const brand = brandRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches || !brand.animate) { setIntroPhase("done"); return; }
    // Animate the actual header into its measured final position, so no duplicate
    // logo or swap is visible at the handoff on either desktop or mobile.
    const bounds = brand.getBoundingClientRect();
    const scale = window.innerWidth < 800 ? 1.35 : 1.65;
    const x = (window.innerWidth - bounds.width * scale) / 2 - bounds.left;
    const y = window.innerHeight * .43 - bounds.height * scale / 2 - bounds.top;
    const centered = `translate(${x}px, ${y}px) scale(${scale})`;
    const animation = brand.animate([
      { transform: centered, opacity: 0, offset: 0 },
      { transform: centered, opacity: 1, offset: .22 },
      { transform: centered, opacity: 1, offset: .42, easing: "cubic-bezier(.22, 1, .36, 1)" },
      { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 1 },
    ], { duration: 1300, easing: "linear", fill: "both" });
    const finish = () => setIntroPhase("done");
    animation.onfinish = finish;
    window.addEventListener("resize", finish);
    reduceMotion.addEventListener("change", finish);
    return () => { animation.onfinish = null; animation.cancel(); window.removeEventListener("resize", finish); reduceMotion.removeEventListener("change", finish); };
  }, [introPhase]);
  const features = [{icon:MessageCircle,title:"心事，有处安放",description:"带着问题来，看看有出处的建议"},{icon:BookOpen,title:"一点知识，一点陪伴",description:"读一读、听一听，按自己的节奏"},{icon:Sun,title:"每天十分钟，靠近一点",description:"用家里现成的东西，一起做件小事"}];
  return <div className="welcome-page" lang={locale} data-intro={introDone ? "done" : "playing"} data-phase={introPhase}>
    <div className="welcome-language"><ThemeSwitch /><span>Language / 语言</span><LanguagePicker /></div>
    <header ref={brandRef} className="welcome-brand"><Image src={icon} alt="" width={42} height={42}/><span>Bloomie</span></header>
    {!introDone && <button className="welcome-skip" onClick={()=>setIntroPhase("done")}>{t("跳过动画")}<ArrowRight size={14}/></button>}
    <main className="welcome-main" id="main">
      <section className="welcome-story" aria-labelledby={introDone ? "welcome-title" : undefined}>
        <div className="welcome-garden" aria-hidden="true"><div className="welcome-halo"/><span className="welcome-spark spark-one">✦</span><span className="welcome-spark spark-two">✧</span>
          <Planter face className="welcome-sprout" />{introDone && <span className="welcome-garden-note">{t("一点一点，一起长大")}</span>}
        </div>
        {introDone && <div className="welcome-copy"><p className="welcome-eyebrow">{t("给家庭一处安心的空间")}</p><h1 id="welcome-title">{t("陪孩子长大，")}<br/><span>{t("也给自己一点温柔。")}</span></h1><p className="welcome-description">{t("不用成为完美的家长。在这里，聊聊心事、读一点好内容，找回日常里小小的连接。")}</p><div className="welcome-features">{features.map(({icon:Icon,title,description})=><div className="welcome-feature" key={title}><span><Icon size={19}/></span><div><h2>{t(title)}</h2><p>{t(description)}</p></div></div>)}</div></div>}
      </section>
      {introDone && <section className="welcome-entry" aria-labelledby="welcome-entry-title">
        <div className="welcome-entry-dot"><span/>{t("从一个小时刻开始")}</div><h2 id="welcome-entry-title">{t(sent ? "去邮箱看看吧。" : "很高兴，在这里遇见你。")}</h2><p>{t(sent ? "点击邮件里的链接就能回来。也可以先逛逛，不用等待。" : "一个邮箱就能开始，无需设置密码。也可以先看看，慢慢来。")}</p>
        {configured && !sent && (loginOpen ? <form className="welcome-login" onSubmit={onLogin}><label htmlFor="welcome-email">{t("邮箱地址")}</label><input id="welcome-email" type="email" autoComplete="email" autoFocus required value={email} onChange={event=>onEmail(event.target.value)} placeholder="you@example.com" disabled={busy}/><button className="primary-button full" disabled={busy}>{t(busy ? "正在发送…" : "发送登录链接")}<Mail size={17}/></button></form> : <button className="primary-button full" onClick={()=>setLoginOpen(true)}>{t("登录 / 注册，开始体验")}<ArrowRight size={18}/></button>)}
        {sent && <div className="welcome-sent"><Check size={22}/>{t("登录链接已发送")}</div>}{message && <p className="welcome-auth-message" role="status">{t(message)}</p>}{!configured && <p className="welcome-auth-message">{t("云端登录尚未开放")}</p>}
        <button className="welcome-explore" onClick={onExplore}>{t("先随便看看")}<ArrowRight size={16}/></button>{!sent && <details className="welcome-optional"><summary>{t("为你推荐更合适的小活动")} <span>{t("选填")}</span></summary><p>{t("孩子在哪个年龄段？可以多选，之后随时修改。")}</p><div className="welcome-ages">{(["baby","toddler","preschool"] as const).map((age,index)=><label key={age}><input type="checkbox" disabled={!ready} checked={state.ages.includes(age)} onChange={event=>{update(s=>({...s,ages:event.target.checked?[...s.ages,age]:s.ages.filter(a=>a!==age)}));}}/>{t(["0–12 个月","1–3 岁","3–5 岁"][index])}</label>)}</div><small>{t("不需要姓名或生日，仅保存在当前浏览器。")}</small>{error && <p role="alert">{error}</p>}</details>}<div className="welcome-footnote"><span>{t("按你的节奏来，没有打卡压力。")}</span><small>{t("面向成年照护者；不替代专业诊断或治疗。")}</small></div>
      </section>}
    </main>{introDone && <footer className="welcome-footer">Bloomie <span>·</span> {t("给家庭一处安心的空间")}</footer>}
  </div>;
}
