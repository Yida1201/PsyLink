import { AdminWorkspace } from "@/components/admin/workspace";
import { LocaleProvider } from "@/components/psylink/locale";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Bloomie · 内容工作室",robots:{index:false,follow:false}};
export default function AdminPage(){return <LocaleProvider titles={{"zh-CN":"Bloomie · 内容工作室","en-US":"Bloomie · Content studio"}}><AdminWorkspace/></LocaleProvider>;}
