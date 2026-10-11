import type { Metadata } from "next";
import { Doto, Space_Grotesk, Space_Mono } from "next/font/google";
import "./tokens.css";
import "./globals.css";
import "./material.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });
const doto = Doto({ subsets: ["latin"], axes: ["ROND"], variable: "--font-doto", display: "swap" });

// Runs before paint so a saved or system dark preference never flashes light.
const themeScript = `try{var t=localStorage.getItem("bloomie-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: "Bloomie · 给家庭一处安心的空间",
  description: "聊一聊、读一点、找到支持。面向学龄前儿童照护者的家庭支持工具。",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${grotesk.variable} ${mono.variable} ${doto.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
