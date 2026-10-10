import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Bloomie · 给家庭一处安心的空间",
  description: "聊一聊、读一点、找到支持。面向学龄前儿童照护者的家庭支持工具。",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
