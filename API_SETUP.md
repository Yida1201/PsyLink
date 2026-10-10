# 接入聊天与自然语音

## 先在自己的电脑上试用

项目根目录有 `.env.example` 配置示例；本机 `.env.local` 可能已经填写密钥。打开该文件，把你自己的 OpenAI API Key 填到 `OPENAI_API_KEY=` 后，不要发到聊天框。API 使用单独计费，ChatGPT 订阅不代替 API 额度。

```dotenv
OPENAI_API_KEY=在这里填你自己的密钥
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
AI_ENABLED=true
TTS_ENABLED=true
LOCAL_AI_PREVIEW=true
CONTENT_REVIEWED=false
```

这里的 `CONTENT_REVIEWED=false` 保留真实状态，不需要为了试用伪称已完成专业审核。`LOCAL_AI_PREVIEW=true` 是明确的私人本机测试模式，在 Vercel 和 production 无效。不要把私人测试服务经隧道或代理转为公共服务。

1. 在 [OpenAI API 控制台](https://platform.openai.com/api-keys) 创建密钥，并确认对应项目已开通 API 计费、拥有模型访问权限。
2. 保存 `.env.local` 后，停止原来的预览进程，并在项目目录重新启动：`bun run dev --hostname 127.0.0.1`。如果正在由 Codex 运行，可以直接说“我已经填好环境变量，帮我重启并验证”，不需要提供密钥。
3. 刷新 [本地应用](http://127.0.0.1:3000/)。聊天标题应显示“AI 家庭支持”，直接用虚构情境试聊。新回答应标为“AI 回答”，不会再显示预设聊天的提示。
4. 打开书架中的文章，勾选语音生成同意，点击“自然语音朗读”。首次生成可能需要等待。原来的设备合成声音已移除。
5. 切换语言，再试听一篇。`marin` 是默认声音；如果喜欢另一种声音，把 `OPENAI_TTS_VOICE` 改为 `cedar` 并重启、刷新页面。默认温和语气、0.9 倍速，可继续调整。

状态标签表示服务已配置启用，实际成功需要完成一次回复／播放验证。没有 Key 时仍显示演示；Key 无效、额度不足或供应商不可用时显示错误，不返回假回答或假音频。当前代码检查已完成，尚未使用你的真实账户调用或试听。

## 之后接入 Supabase 与 Vercel

- Supabase SQL 编辑器依次执行六个迁移：`supabase/migrations/202610090001_initial.sql`、`supabase/migrations/202610090002_speech_quota.sql`、`supabase/migrations/202610090003_research_library.sql`、`supabase/migrations/202610100004_admin.sql`、`supabase/migrations/202610100005_community_events.sql`、`supabase/migrations/202610100006_together.sql`。已有迁移不要重复执行；后台账号初始化见 `ADMIN_SETUP.md`。
- 填写 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，配置邮箱登录和 `/auth/callback` 允许地址。无需 service-role 密钥。
- 完成内容、五种语言安全文案及本地资源的专业复核后，才能把 `CONTENT_REVIEWED` 设为 `true` 并面向真实家庭开放。
- Vercel 环境变量分别填写，不上传 `.env.local`。设置 `AI_ENABLED=true`、`TTS_ENABLED=true`、`LOCAL_AI_PREVIEW=false` 及已完成复核的状态。保存后重新部署。正式服务要求用户登录并限制每日调用量。

真实 AI 启用后，聊天中的演示提示自动移除。预约、视频、示例会后笔记仍是演示；“AI 生成语音”也仍需保留，它准确说明声音来源。

官方依据：[自然语音指南](https://developers.openai.com/api/docs/guides/text-to-speech)、[Speech API](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create)、[GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)。支持上述语言，但官方提醒声音主要为英语优化，因此各语言的自然度仍需实际试听。

## 科学来源搜索（可选 Tavily）

聊天提示词已改为根据问题复杂度展开、回应具体处境、解释证据并给出可尝试的方法；不再统一限制为两条建议。搜索采用 Tavily Search API。官方接口：[Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)。提示词参考：[OpenAI Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)。

1. 在 Tavily 账号创建 API Key。在本机 `.env.local` 填写（不要发到聊天里）：

```dotenv
SCIENTIFIC_SEARCH_ENABLED=true
TAVILY_API_KEY=你的Tavily密钥
```

现有 `OPENAI_API_KEY` 与 `OPENAI_MODEL` 继续使用，不需要额外搜索模型。搜索主题判断会额外调用一次 OpenAI；需要搜索时调用 Tavily，二者按各自账户计费。没有配置时聊天仍使用现有知识库。

2. 重启开发服务，刷新页面。可用虚构问题试验，例如“孩子八岁，经常很难集中注意力，科学资料怎么看？”成功引用的搜索资料会在回答下方标记“联网来源”，提供原始机构/论文链接。结果只说明已校验 HTTPS 域名，不代表完成全文审查、科学结论逐项核验或专业审核。
3. Vercel 中分别添加以上两个服务端变量，重新部署。不得使用 `NEXT_PUBLIC_TAVILY_API_KEY`，也不要上传 `.env.local`。现有登录、额度、内容审核上线门槛继续保留。

检索先由 OpenAI 在固定主题和年龄组中判断是否需要补充资料；Tavily 只收到程序生成的概括主题，不收到聊天原文、名字、地址或学校信息。主题表覆盖常见家庭/育儿问题，但不能表达每个罕见病或极具体研究问题；这类问题需要扩充经过审查的主题表，不能声称搜索是穷尽的。原始聊天仍会发送给现有 OpenAI 服务用于对话与安全检查。

来源列表由服务端控制：PubMed、PMC、WHO、UNICEF、CDC、NIMH、NICHD、NICE、NHS、HealthyChildren、Cochrane Library。搜索服务限制域名后，服务端再次检查返回网址，拒绝伪装子域名、非 HTTPS 与带账号密码的链接。最多四份摘要供模型参考；只返回本次实际引用的链接。不会自动抓取全文，也不会把搜索结果写入已审核知识库。

搜索失败/超时/没有合格资料时继续使用知识库与一般支持，并显示未取得合适联网资料；不会谎称检索成功。危险情境优先走安全流程，不调用搜索。源内容作为不可信数据处理，不能覆盖系统安全要求。Web 来源保存在当前消息内，后续更新知识库不会让旧回答的链接失效。聊天仍不默认持久化。

目前已通过模拟接口的联动、安全与失败回退测试；真实 Tavily 调用需填入有效密钥后验证。正式来源清单、适用边界和搜索回答还需纳入人工质量评估。

## 聊天语音输入

使用同一个服务端 `OPENAI_API_KEY`，不需要额外的搜索 API 或浏览器语音插件：

```dotenv
STT_ENABLED=true
OPENAI_STT_MODEL=gpt-transcribe
```

本机 `.env.local` 已启用以上配置，使用现有密钥验证了真实转写。部署 Vercel 时添加这两个变量并重新部署；公开语音输入仍遵守 `CONTENT_REVIEWED`、Supabase 登录及 `consume_speech_quota` 的额度检查（与听书共享每日 20 次语音额度，迁移 002）。不会启用本机预览权限绕过生产登录。

麦克风录制要求 HTTPS，localhost 开发例外。第一次会请求麦克风权限；允许后再次按住。无文字时按住录音，松开转写为可编辑文本，向上滑动至少 65px 再松开则转写后直接发送；向左滑动 100px 松开或按 Escape 可取消。键盘按住空格／Enter 录音，松开编辑。最长 60 秒，超过时停止并转为编辑；最大音频 3 MiB，文字 2,000 字符。切换页面或窗口失去焦点会取消。

服务端调用 `/v1/audio/transcriptions`，不传界面语言提示，保留说话的原语言而不翻译。默认模型见 [OpenAI 官方语音转写指南](https://developers.openai.com/api/docs/guides/speech-to-text)；可配置 `gpt-4o-mini-transcribe`、`gpt-4o-transcribe` 或 `whisper-1`。浏览器和服务端只临时处理音频，不写数据库或本地文件，不记录转写正文；OpenAI 的数据处理适用其服务设置及政策。界面明确提示音频将送至 OpenAI。
