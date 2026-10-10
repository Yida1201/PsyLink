"use client";
import { useLocale } from "./locale";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Bell,
  Headphones,
  BookOpen,
  Search,
} from "lucide-react";
import type { Article } from "@/lib/psylink/content";
import { useCatalog } from "./catalog";

import { Listening } from "./listening";
import { BookArt, Sprout } from "./art";
export function Library({
  saved,
  toggleSave,
  onRead,
  onReminder,
}: {
  saved: string[];
  toggleSave: (id: string) => void;
  onRead: (a: Article) => void;
  onReminder: () => void;
}) {
  const { t, locale } = useLocale();
  const { articles, podcasts } = useCatalog();
  const [tab, setTab] = useState("发现");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [medium, setMedium] = useState("all");
  const [podcastSaved, setPodcastSaved] = useState<string[]>([]);
  const [podcastNotice, setPodcastNotice] = useState("");
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("psylink-podcasts") || "[]",
      );
      if (Array.isArray(value))
        setPodcastSaved(
          value.filter((id) => podcasts.some((p) => p.id === id)),
        );
    } catch {}
    const clear = () => {
      setPodcastSaved([]);
      setPodcastNotice("");
    };
    window.addEventListener("psylink-local-cleared", clear);
    return () => window.removeEventListener("psylink-local-cleared", clear);
  }, []);
  useEffect(() => {
    if (!podcastNotice) return;
    const timer = setTimeout(() => setPodcastNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [podcastNotice]);
  function savePodcast(id: string) {
    const next = podcastSaved.includes(id)
      ? podcastSaved.filter((x) => x !== id)
      : [...podcastSaved, id];
    try {
      localStorage.setItem("psylink-podcasts", JSON.stringify(next));
      setPodcastSaved(next);
      setPodcastNotice("播客收藏已更新 · 保存在当前浏览器");
    } catch {
      setPodcastNotice("浏览器不允许保存。请检查存储设置。");
    }
  }
  const episodes = podcasts.filter(
    (p) =>
      (tab !== "我的书架" || podcastSaved.includes(p.id)) &&
      (t(p.title) + t(p.series) + t(p.description))
        .toLocaleLowerCase(locale)
        .includes(query.toLocaleLowerCase(locale)),
  );

  const items = articles.filter(
    (a) =>
      (tab !== "我的书架" || saved.includes(a.id)) &&
      (category === "全部" ||
        (category === "论文导读"
          ? a.kind === "research"
          : a.category === category)) &&
      (t(a.title) + t(a.subtitle))
        .toLocaleLowerCase(locale)
        .includes(query.toLocaleLowerCase(locale)),
  );
  return (
    <div className="library">
      <div className="library-toolbar">
        <div className="segmented" aria-label={t("内容视图")}>
          {["发现", "我的书架"].map((tabName) => (
            <button
              key={tabName}
              aria-pressed={tab === tabName}
              className={tab === tabName ? "selected" : ""}
              onClick={() => setTab(tabName)}
            >
              {t(tabName)}
              {tabName === "我的书架" && (
                <span>{saved.length + podcastSaved.length}</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="secondary-button reminder-button"
          onClick={onReminder}
        >
          <Bell size={16} />
          {t("阅读提醒")}
        </button>
      </div>
      {tab === "发现" && (
        <section className="library-feature">
          <div>
            <span className="eyebrow">A SMALL PAUSE, A FRESH START</span>
            <h2>
              {t("给自己留一页，")}
              <br />
              {t("让日子慢一点。")}
            </h2>
            <p>{t("不急着学会所有答案。今天，读一点就好。")}</p>
            <button
              className="primary-button"
              onClick={() => articles[0] && onRead(articles[0])}
            >
              <Headphones size={17} />
              {t("开始今天的阅读")}
              <ArrowUpRight size={16} />
            </button>
            <small>{t("来源可查 · 编辑整理 · 待专业复核")}</small>
          </div>
          <div className="feature-object">
            <div className="feature-disc" />
            <Sprout />
            <div className="stacked-book">{t("给自己一点温柔")}</div>
            <div className="stacked-book lower">THE EVERYDAY LIBRARY</div>
          </div>
        </section>
      )}
      <div className="library-media-bar">
        <div className="category-tabs media-tabs" aria-label={t("内容形式")}>
          {[
            { id: "all", label: "全部内容" },
            { id: "reading", label: "阅读" },
            { id: "listening", label: "播客" },
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={medium === item.id}
              className={medium === item.id ? "active" : ""}
              onClick={() => setMedium(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <label className="library-search">
          <Search size={16} />
          <input
            aria-label={t("搜索内容")}
            placeholder={t("搜索阅读与播客")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {medium !== "reading" && (
        <Listening
          emptySavedShelf={tab === "我的书架" && !query}
          items={episodes}
          saved={podcastSaved}
          onSave={savePodcast}
          onRead={onRead}
        />
      )}
      {medium !== "listening" && (
        <>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {t(
                  tab === "发现"
                    ? "THE EVERYDAY LIBRARY"
                    : "YOUR LITTLE COLLECTION",
                )}
              </span>
              <h2>
                {t(
                  tab === "发现" ? "一点知识，一点陪伴" : "把喜欢的，留在这里",
                )}
              </h2>
            </div>
          </div>
          <div className="category-tabs" aria-label={t("内容分类")}>
            {["全部", "照顾自己", "亲子沟通", "日常养育", "论文导读"].map(
              (c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {t(c)}
                </button>
              ),
            )}
          </div>
          {items.length ? (
            <div className="book-grid">
              {items.map((a) => (
                <article className="book-item" key={a.id}>
                  <div className="book-stage">
                    <button
                      className={`book-cover ${a.color}`}
                      onClick={() => onRead(a)}
                      aria-label={`${t("阅读")} ${t(a.title).replace("\n", locale === "zh-CN" ? "" : " ")}`}
                    >
                      <span className="book-publisher">
                        {t("Bloomie · 日 常 文 库")}
                      </span>
                      <h3>{t(a.title)}</h3>
                      <BookArt motif={a.motif} />
                      <span className="book-foot">
                        {t(a.category)}
                        <span>BLOOMIE</span>
                      </span>
                    </button>
                    <span className="shelf" />
                  </div>
                  <div className="book-info">
                    <div>
                      <button className="book-title" onClick={() => onRead(a)}>
                        {t(a.title).replace(
                          "\n",
                          locale === "zh-CN" ? "" : " ",
                        )}
                      </button>
                      <p>
                        <BookOpen size={12} />
                        {a.minutes}
                        {t("分钟 · 可朗读")}
                      </p>
                    </div>
                    <button
                      className={`icon-button save-button ${saved.includes(a.id) ? "saved" : ""}`}
                      aria-label={t(
                        saved.includes(a.id)
                          ? `${t("取消收藏")} ${t(a.title).replace("\n", locale === "zh-CN" ? "" : " ")}`
                          : `${t("收藏")} ${t(a.title).replace("\n", locale === "zh-CN" ? "" : " ")}`,
                      )}
                      aria-pressed={saved.includes(a.id)}
                      onClick={() => toggleSave(a.id)}
                    >
                      <Bookmark
                        size={19}
                        fill={saved.includes(a.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state paper">
              <BookOpen size={35} />
              <h3>
                {t(
                  tab === "我的书架" && !saved.length
                    ? podcastSaved.length
                      ? "还没有收藏的阅读内容"
                      : "你的书架，等着第一本书"
                    : "暂时没有找到相关内容",
                )}
              </h3>
              <p>
                {t(
                  tab === "我的书架" && !saved.length
                    ? "在发现页点一下收藏，喜欢的内容就会留在这里。"
                    : "试试其他分类，或换一个关键词。",
                )}
              </p>
              <button
                className="secondary-button"
                onClick={() => {
                  setTab("发现");
                  setCategory("全部");
                  setQuery("");
                }}
              >
                {t("浏览全部内容")}
              </button>
            </div>
          )}
        </>
      )}
      {podcastNotice && (
        <p className="podcast-save-notice" role="status">
          {t(podcastNotice)}
        </p>
      )}
      <div className="library-footer">
        <span>{t("小小的阅读，也是一种照顾。")}</span>
        <small>
          {t(
            "AI 语音不是专家录音；播客为概念演示，视频和班级消息将在后续版本推出。",
          )}
        </small>
      </div>
    </div>
  );
}
