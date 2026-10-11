"use client";
import { useLocale } from "./locale";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Compass,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  FileText,
} from "lucide-react";
import type { Professional } from "@/lib/psylink/content";
import { useCatalog } from "./catalog";
import { Modal } from "./modal";
import { CommunityEvents } from "./community";
import {FamilyCircle} from "./family-circle";
import type {Category} from "@/lib/together/model";
type Step = "choose" | "confirmed" | "video" | "notes";
export function Care({ onSafety, onLogin, onTogether }: { onSafety: () => void; onLogin: () => void; onTogether:(c:Category)=>void }) {
  const { t } = useLocale();
  const { professionals } = useCatalog();
  const [person, setPerson] = useState<Professional | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [time, setTime] = useState("");
  const [matching, setMatching] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  const [notice, setNotice] = useState("");
  const [notes, setNotes] = useState(
    "今天讨论了什么\n照护者描述了晚间收拾玩具时的沟通困难。\n\n示例中约定的小尝试\n使用一条具体、适龄的提示，并观察孩子的反应。\n\n下次可以继续聊\n哪些情境更容易发生分歧，以及家长需要什么支持。\n\n这是预设对话的示例笔记，不来自真实咨询，不是诊断或治疗建议。",
  );
  const open = (p: Professional) => {
    setPerson(p);
    setStep("choose");
    setTime("");
    setNotice("");
    setMuted(false);
    setCamera(true);
  };
  const items = professionals.filter(
    (p) => filter === "全部" || p.role === filter,
  );
  return (
    <div className="care-page">
      <section className="care-intro">
        <div>
          <span className="eyebrow">WHEN YOU NEED A HUMAN CONNECTION</span>
          <h2>
            {t("多一个人，")}
            <br />
            {t("一起想想办法。")}
          </h2>
          <p>
            {t("不必独自找到所有答案。")}
            <br />
            {t("从一次轻松的沟通，开始了解适合你的支持。")}
          </p>
          <button className="primary-button" onClick={() => setMatching(true)}>
            <Compass size={18} />
            {t("帮我选择支持")}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="connection-art" aria-hidden="true">
          <span className="connection-orbit" />
          <span className="connection-orb orb-one" />
          <span className="connection-orb orb-two" />
          <span className="connection-orb orb-three" />
          <span className="connection-caption">CONNECTED, AT YOUR PACE</span>
        </div>
      </section>
      {professionals.some(p=>p.isDemo!==false) && <div className="demo-banner">
        <span className="demo-tag">{t("服务演示")}</span>
        <p>
          {t(
            "带有示例标记的人员与预约均为虚构，不会产生真实预约或收费。",
          )}
        </p>
      </div>}
      <div className="section-heading">
        <div>
          <span className="eyebrow">FIND YOUR SUPPORT</span>
          <h2>{t("找到适合的支持")}</h2>
        </div>
        <span className="muted">{t("先了解，再选择")}</span>
      </div>
      <div className="category-tabs">
        {["全部", "家庭沟通支持", "儿童发展咨询", "照护者情绪支持"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(f)}
          </button>
        ))}
      </div>
      <div className="pro-grid">
        {items.map((p) => (
          <article className="pro-card paper" key={p.id}>
            <div className={`pro-avatar ${p.color}`} aria-hidden="true">
              <span>{t(p.initial)}</span>
            </div>
            <div className="pro-id">
              <h3>{t(p.name)}</h3>
              <span className="pro-role">{t(p.role)}</span>
              <p className="pro-focus">{t(p.focus)}</p>
            </div>
            <span className="pro-plate">{t(p.isDemo===false?"已审核资料":"示例人员")}</span>
            <dl className="pro-spec">
              <div>
                <dt>{t(p.isDemo===false?"资质":"形式")}</dt>
                <dd><Video size={14} />{p.isDemo===false ? t(p.qualification || "已审核资料") : t("站内视频 · 演示")}</dd>
              </div>
              <div>
                <dt>{t(p.isDemo===false?"安排":"说明")}</dt>
                <dd>{t(p.isDemo===false?"联系与服务安排以本人说明为准":"无需付费 · 不提供真实服务")}</dd>
              </div>
            </dl>
            <button className="secondary-button pro-action" onClick={() => open(p)}>
              {t(p.isDemo===false?"查看联系渠道":"了解并体验预约")}
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
      <FamilyCircle onTogether={onTogether}/>
      <CommunityEvents onLogin={onLogin} />
      <div className="care-bottom paper">
        <div>
          <h3>{t("有些帮助，不应该等待。")}</h3>
          <p>
            {t(
              "如果你或孩子正处于危险中，请联系当地紧急服务。演示预约不能提供救援。",
            )}
          </p>
        </div>
        <button className="text-button" onClick={onSafety}>
          {t("立即求助说明")}
          <ArrowRight size={16} />
        </button>
      </div>
      {matching && (
        <Modal
          title={t("先从你关心的事开始")}
          onClose={() => setMatching(false)}
        >
          <p className="modal-description">
            {t("这是匹配流程演示，不是临床分诊。选择后会展示相关的虚构人员。")}
          </p>
          <div className="choice-list">
            {professionals.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setFilter(p.role);
                  setMatching(false);
                }}
              >
                {t(p.focus)}
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {person && (
        <Modal
          wide={step === "video"}
          title={t(
            person.isDemo===false ? "联系支持" : step === "choose"
              ? "体验第一次预约"
              : step === "confirmed"
                ? "演示预约已完成"
                : step === "video"
                  ? "视频咨询体验"
                  : "会后回顾 · 示例草稿",
          )}
          onClose={() => setPerson(null)}
        >
          <span className="demo-tag">{t(person.isDemo===false?"已审核资料":"全程演示 · 没有真人接入")}</span>
          {person.isDemo===false ? <><div className="booking-person"><h3>{t(person.name)}</h3></div><p className="modal-description">{t(person.description)}</p><p className="fine-print">{t("当前通过经审核的外部渠道联系，尚不提供站内真人预约或视频。")}</p><a className="primary-button full" href={person.contactUrl} target="_blank" rel="noreferrer">{t("打开联系渠道")}<ArrowRight size={17}/></a></> : <>
          {step === "choose" && (
            <>
              <div className="booking-person">
                <div className={`portrait small ${person.color}`}>
                  <span>{t(person.initial)}</span>
                </div>
                <div>
                  <h3>{t(person.name)}</h3>
                  <p>{t(person.role)}</p>
                </div>
              </div>
              <p className="modal-description">{t(person.description)}</p>
              <h4>{t("选择一个示例时段")}</h4>
              <div className="time-grid">
                {[
                  "示例日 A · 10:00",
                  "示例日 A · 15:00",
                  "示例日 B · 09:30",
                  "示例日 B · 14:00",
                ].map((slot) => (
                  <button
                    key={slot}
                    className={time === slot ? "selected" : ""}
                    aria-pressed={time === slot}
                    onClick={() => setTime(slot)}
                  >
                    {t(slot)}
                  </button>
                ))}
              </div>
              <p className="fine-print">
                {t("仅展示流程，不发送通知、不收费，也不会创建真实预约。")}
              </p>
              <button
                className="primary-button full"
                disabled={!time}
                onClick={() => setStep("confirmed")}
              >
                {t("确认演示预约")}
                <ArrowRight size={17} />
              </button>
            </>
          )}
          {step === "confirmed" && (
            <div className="confirmation">
              <span className="confirmation-check">
                <Check size={29} />
              </span>
              <h3>{t("你已走完预约体验")}</h3>
              <p>
                {t(person.name)} · {t(time)}
              </p>
              <p className="modal-description">
                {t(
                  "下一步可以预览视频房间。不会连接真人，也不会调用摄像头、麦克风或录音。",
                )}
              </p>
              <button
                className="primary-button full"
                onClick={() => setStep("video")}
              >
                <Video size={17} />
                {t("进入演示视频房间")}
              </button>
            </div>
          )}
          {step === "video" && (
            <>
              <div className="video-room">
                <div className="video-status">{t("演示画面 · 未连接")}</div>
                <div className={`portrait video-portrait ${person.color}`}>
                  <span>{t(person.initial)}</span>
                </div>
                <h3>{t(person.name)}</h3>
                <p>{t("未来，我们会在这里面对面。")}</p>
                <div className="self-preview">
                  {camera ? <Video size={20} /> : <VideoOff size={20} />}
                  <span>{t("你的画面 · 演示")}</span>
                </div>
              </div>
              <div className="video-controls">
                <button
                  className="icon-button"
                  aria-label={t(muted ? "打开演示麦克风" : "关闭演示麦克风")}
                  aria-pressed={muted}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <MicOff /> : <Mic />}
                </button>
                <button
                  className="icon-button"
                  aria-label={t(camera ? "关闭演示摄像头" : "打开演示摄像头")}
                  aria-pressed={camera}
                  onClick={() => setCamera(!camera)}
                >
                  {camera ? <Video /> : <VideoOff />}
                </button>
                <button className="end-call" onClick={() => setStep("notes")}>
                  <PhoneOff size={18} />
                  {t("结束演示")}
                </button>
              </div>
              <p className="fine-print">
                {t("当前没有音视频传输或 AI 转写。结束后可查看预设会后回顾。")}
              </p>
            </>
          )}
          {step === "notes" && (
            <>
              <p className="modal-description">
                <FileText size={17} />
                {t(
                  "以下内容来自预设示例，不是本次聊天的记录。可编辑后下载，体验未来的会后回顾。",
                )}
              </p>
              <textarea
                className="notes-editor"
                aria-label={t("编辑示例会后笔记")}
                value={t(notes)}
                onChange={(e) => setNotes(e.target.value)}
              />
              <p className="fine-print">
                {t("真实咨询中，AI 注记须先征得双方同意，并由咨询人员复核。")}
              </p>
              <button
                className="primary-button full"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([t("【演示笔记】\n") + notes], {
                      type: "text/plain;charset=utf-8",
                    }),
                  );
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = t("Bloomie-演示会后回顾.txt");
                  link.click();
                  URL.revokeObjectURL(url);
                  setNotice("示例笔记已下载，没有上传或分享。");
                }}
              >
                {t("下载示例笔记")}
              </button>
              {notice && (
                <p role="status" className="success-message">
                  {t(notice)}
                </p>
              )}
            </>
          )}
          </>}
        </Modal>
      )}
    </div>
  );
}
