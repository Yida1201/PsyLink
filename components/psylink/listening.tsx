"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Bookmark,
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import type { Article } from "@/lib/psylink/content";
import { useCatalog } from "./catalog";
import type { Podcast } from "@/lib/psylink/podcasts";
import { useLocale } from "./locale";
import { Modal } from "./modal";
export function Listening({
  items,
  saved,
  onSave,
  onRead,
  emptySavedShelf = false,
}: {
  items: readonly Podcast[];
  saved: string[];
  onSave: (id: string) => void;
  onRead: (article: Article) => void;
  emptySavedShelf?: boolean;
}) {
  const { t, locale } = useLocale();
  const { articles, podcasts } = useCatalog();
  const [selected, setSelected] = useState<string>(podcasts[0]?.id || "");
  const [preview, setPreview] = useState<Podcast | null>(null);
  const current = items.find((p) => p.id === selected) || items[0];
  const index = items.findIndex((p) => p.id === current?.id);
  function move(direction: number) {
    setSelected(items[(index + direction + items.length) % items.length].id);
  }
  return (
    <section className="listening-room" aria-label={t("播客聆听区")}>
      <div className="listening-heading">
        <div>
          <span className="eyebrow">THE LISTENING CORNER</span>
          <h2>{t("换一种方式，慢慢听。")}</h2>
        </div>
        <span className="demo-tag">{t(current?.isDemo===false?"已授权音源":current?.demoAudioUrl?"AI 合成演示音频":"播客概念演示")}</span>
      </div>
      {current ? (
        <div className="listening-layout">
          <div className="turntable-panel">
            <Turntable
              key={current.id}
              episode={current}
              index={index}
            />
            <div className="record-caption">
              <span>{t(current.series)}</span>
              <h3>{t(current.title)}</h3>
              <p>{t(current.description)}</p>
            </div>
            <div className="record-controls">
              <button
                className="icon-button"
                disabled={items.length < 2}
                aria-label={t("选择上一期")}
                onClick={() => move(-1)}
              >
                <SkipBack size={18} />
              </button>
              {!audioSrc(current) && <button
                className="record-play"
                onClick={() => setPreview(current)}
              >
                <Play size={16} fill="currentColor" />
                {t("试听说明")}
              </button>}
              <button
                className="icon-button"
                disabled={items.length < 2}
                aria-label={t("选择下一期")}
                onClick={() => move(1)}
              >
                <SkipForward size={18} />
              </button>
              <span className="record-position">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </span>
            </div>
            <p className="record-disclosure">
              {t(current.isDemo===false?"播放已获授权的音源，音频由提供方托管。":current.demoAudioUrl?"演示音频由 AI 合成：两位主持人都不是真人，也不是专家录音。内容整理自 UNICEF 家长自我照顾资料，待专业复核。":"这一期还没有音频。把唱臂放到唱片上可以试试，也可以先读相关资料。")}
              {current.demoAudioUrl && current.demoAudioLang === "en-US" && locale !== "en-US" && <> {t("演示音频为英文。")}</>}
            </p>
          </div>
          <div className="podcast-collection">
            <div className="podcast-list-heading">
              <Headphones size={17} />
              <h3>{t("选一段想听的")}</h3>
            </div>
            <div className="podcast-list">
              {items.map((episode, i) => (
                <article
                  key={episode.id}
                  className={`podcast-item ${current.id === episode.id ? "selected" : ""}`}
                >
                  <button
                    className="podcast-select"
                    aria-pressed={current.id === episode.id}
                    onClick={() => setSelected(episode.id)}
                  >
                    <span
                      className={`podcast-sleeve ${episode.color}`}
                      aria-hidden="true"
                    >
                      <span className="mini-vinyl">
                        <i />
                      </span>
                      <small>{String(i + 1).padStart(2, "0")}</small>
                    </span>
                    <span className="podcast-copy">
                      <small>{t(episode.series)}</small>
                      <strong>{t(episode.title)}</strong>
                      <span>
                        {episode.minutes} {t(episode.demoAudioUrl ? "分钟 · AI 演示音频" : "分钟 · 示例节目")}
                      </span>
                    </span>
                  </button>
                  <button
                    className={`icon-button podcast-save ${saved.includes(episode.id) ? "saved" : ""}`}
                    aria-label={`${t(saved.includes(episode.id) ? "取消收藏" : "收藏")} ${t(episode.title)}`}
                    aria-pressed={saved.includes(episode.id)}
                    onClick={() => onSave(episode.id)}
                  >
                    <Bookmark
                      size={18}
                      fill={
                        saved.includes(episode.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </article>
              ))}
            </div>
            <div className="podcast-editorial-note">
              <span className="note-rule" />
              <p>
                {t(
                  current.isDemo===false?"已获授权的节目可直接播放，也可以阅读相关资料。":"未来，这里会放入经审核、获得授权的真实节目。今天也可以先读相关资料。",
                )}
              </p>
              <button
                className="text-button"
                disabled={!articles.some(a=>a.id===current.articleId)}
                onClick={() =>
                  onRead(articles.find((a) => a.id === current.articleId)!)
                }
              >
                <BookOpen size={15} />
                {t("阅读相关资料")}
                <ArrowUpRight size={14} />
              </button>
            </div>
            <small className="podcast-local-note">
              {t("播客收藏仅保存在当前浏览器。")}
            </small>
          </div>
        </div>
      ) : (
        <div className="podcast-empty">
          <Headphones size={30} />
          <h3>
            {t(
              emptySavedShelf ? "这里等着你喜欢的声音" : "暂时没有找到相关内容",
            )}
          </h3>
          <p>
            {t(
              emptySavedShelf
                ? "在发现页收藏示例播客，就会出现在这里。"
                : "试试其他分类，或换一个关键词。",
            )}
          </p>
        </div>
      )}
      {preview && (
        <Modal title={t("播客试听 · 演示")} onClose={() => setPreview(null)}>
          <span className="demo-tag">{t("尚无真实音源")}</span>
          <h3 className="podcast-preview-title">{t(preview.title)}</h3>
          <p className="modal-description">
            {t(
              "这些节目是用于展示选择与收藏体验的虚构内容，并非专家录音。真实播客将在内容审核与授权后接入，当前不会播放声音。",
            )}
          </p>
          <button
            className="primary-button full"
            onClick={() => {
              const article = articles.find((a) => a.id === preview.articleId);
              setPreview(null);
              if(article)onRead(article);
            }}
          >
            <BookOpen size={17} />
            {t("先读相关资料")}
            <ArrowUpRight size={15} />
          </button>
          <p className="fine-print">
            {t("相关资料可阅读；已接入自然语音时，可在阅读页选择 AI 朗读。")}
          </p>
        </Modal>
      )}
    </section>
  );
}

const audioSrc = (episode: Podcast) =>
  episode.isDemo === false ? episode.audioUrl : episode.demoAudioUrl;

// Geometry, in container-width units (cqw). Pivot is the tonearm bearing.
const REST = 0; // arm on its rest post
const LEAD_IN = 50; // stylus on the outer groove
const RUN_OUT = 66; // stylus near the label
const DROP_AT = 38; // released past this angle = play

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * A playable turntable: lower the tonearm onto the record to play, lift it to
 * pause. The arm tracks progress inwards like a real stylus.
 */
function Turntable({ episode, index }: { episode: Podcast; index: number }) {
  const { t } = useLocale();
  const src = audioSrc(episode);
  const audio = useRef<HTMLAudioElement | null>(null);
  const deck = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ moved: boolean; startX: number; startY: number } | null>(null);
  const [down, setDown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const [dragAngle, setDragAngle] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => () => audio.current?.pause(), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  async function lower() {
    setDown(true);
    if (!src || !audio.current) {
      setNotice(t("这一期还没有音频，可以先读相关资料。"));
      setTimeout(() => setDown(false), 900);
      return;
    }
    try {
      await audio.current.play();
    } catch {
      setDown(false);
      setNotice(t("暂时无法播放，请稍后再试。"));
    }
  }
  function lift() {
    audio.current?.pause();
    setDown(false);
  }
  const toggle = () => (down ? lift() : void lower());

  const progress = duration > 0 ? Math.min(1, time / duration) : 0;
  const playAngle = LEAD_IN + (RUN_OUT - LEAD_IN) * progress;
  const angle = dragAngle ?? (down ? playAngle : REST);

  function angleFrom(e: ReactPointerEvent) {
    const box = deck.current!.getBoundingClientRect();
    const unit = box.width / 100;
    const px = box.left + 80.5 * unit;
    const py = box.top + 14.5 * unit;
    const deg = (Math.atan2(-(e.clientX - px), e.clientY - py) * 180) / Math.PI;
    return Math.max(REST, Math.min(RUN_OUT + 2, deg));
  }
  function onArmDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { moved: false, startX: e.clientX, startY: e.clientY };
  }
  function onArmMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
    d.moved = true;
    if (playing) audio.current?.pause();
    setDragAngle(angleFrom(e));
  }
  function onArmUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return toggle();
    const released = angleFrom(e);
    setDragAngle(null);
    if (released < DROP_AT) return lift();
    // Dropping the needle somewhere on the record seeks there.
    if (src && audio.current && Number.isFinite(duration)) {
      const at = Math.max(0, Math.min(1, (released - LEAD_IN) / (RUN_OUT - LEAD_IN)));
      audio.current.currentTime = at * duration;
    }
    void lower();
  }

  return (
    <div
      className="deck"
      ref={deck}
      data-playing={playing || undefined}
      data-down={down || undefined}
      data-dragging={dragAngle !== null || undefined}
    >
      {src && (
        <audio
          ref={audio}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={(e) => {
            setPlaying(false);
            setDown(false);
            e.currentTarget.currentTime = 0;
            setTime(0);
          }}
        />
      )}
      <div className="deck-plate" aria-hidden="true">
        <i className="deck-screw" /><i className="deck-screw" /><i className="deck-screw" /><i className="deck-screw" />
        <span className="deck-badge">Bloomie Audio</span>
        <div className="deck-platter">
          <div className={`deck-record ${episode.color}`}>
            <div className="deck-label">
              <Headphones size={18} />
              <span>BLOOMIE</span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </div>
          </div>
          <i className="deck-sheen" />
          <i className="deck-spindle" />
        </div>
        <div className="deck-rest" />
        <div className="deck-bearing" />
      </div>
      <button
        type="button"
        className="deck-arm"
        style={{ ["--arm" as string]: `${angle}deg` }}
        role="switch"
        aria-checked={down}
        aria-label={t(down ? "抬起唱臂，暂停" : "放下唱臂，开始播放")}
        onPointerDown={onArmDown}
        onPointerMove={onArmMove}
        onPointerUp={onArmUp}
        onPointerCancel={() => { drag.current = null; setDragAngle(null); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
        }}
      >
        <i className="deck-arm-weight" />
        <i className="deck-arm-tube" />
        <i className="deck-arm-head" />
      </button>
      <div className="deck-console">
        <span className="deck-lcd" aria-live="off">
          <span className="deck-led" />
          {/* elapsed while a side is on, total length when idle */}
          <span className="deck-digits">{src ? clock(down || time > 0 ? time : duration) : "--:--"}</span>
        </span>
        <button
          type="button"
          className="deck-start"
          aria-pressed={down}
          aria-label={t(down ? "暂停" : "播放")}
          onClick={toggle}
        >
          {down ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
      </div>
      <span className="deck-speed" aria-hidden="true">33⅓ · STEREO</span>
      <p className="deck-notice" role="status">{notice}</p>
    </div>
  );
}
