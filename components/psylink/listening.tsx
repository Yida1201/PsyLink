"use client";
import { useState } from "react";
import {
  Bookmark,
  Headphones,
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
  const { t } = useLocale();
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
        <span className="demo-tag">{t(current?.isDemo===false?"已授权音源":"播客概念演示")}</span>
      </div>
      {current ? (
        <div className="listening-layout">
          <div className="turntable-panel">
            <div className="turntable" aria-hidden="true">
              <div className="turntable-brand">BLOOMIE AUDIO</div>
              <div className="record-platter">
                <div
                  className={`vinyl-record ${current.color}`}
                  key={current.id}
                >
                  <div className="record-label">
                    <Headphones size={22} />
                    <span>BLOOMIE</span>
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </div>
                  <i className="record-spindle" />
                </div>
              </div>
              <div className="tonearm-pivot" />
              <div className="tonearm">
                <i />
              </div>
              <div className="turntable-switch" />
              <div className="turntable-speed">33⅓ · STEREO</div>
            </div>
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
              {current.isDemo!==false && <button
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
            {current.isDemo===false && current.audioUrl && <audio key={current.id} controls preload="none" src={current.audioUrl} aria-label={t(current.title)} style={{width:"100%",marginTop:16}} />}
            <p className="record-disclosure">
              {t(current.isDemo===false?"播放已获授权的音源，音频由提供方托管。":"黑胶机为视觉展示；尚无播客音源，不会播放或自动生成音频。")}
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
                        {episode.minutes} {t("分钟 · 示例节目")}
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
