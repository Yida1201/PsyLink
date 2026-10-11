# Bloomie 首次上线指南

检查日期：2026-10-10（America/New_York）。本指南适用于当前 Next.js + Supabase + Vercel 项目。代码上传 GitHub、部署得到网址、真实用户能登录、AI 可公开使用，是四个独立的验收步骤。

## 0. 目前能不能上线？

可以准备代码上传和受控的部署验收；还不能宣布已完成生产上线。

- 本机类型检查、69 项测试（1,258 个断言）、六个迁移的隔离数据库测试和生产构建通过。
- 静态检查无错误，仍有 9 条 React effect 依赖警告；它们尚未全部消除，检查通过不保证不存在运行时问题。
- 生产构建禁用本机管理员和 AI 预览；匿名后台接口返回 401。
- 扫描了 111 个源代码、数据、测试及迁移文件，没有发现可疑硬编码密钥；现有 OpenAI / Tavily 密钥没有出现在已生成的浏览器 JavaScript 中。此检查不是完整安全审计。
- 现有 Supabase Auth 设置可以读取，Email 和注册已开启，邮箱确认开启。多个所需表通过公开 REST 接口返回 PGRST205，后台和活动服务尚未就绪。需项目拥有者在控制台核对表与迁移；不能仅凭网址能打开判断数据库已接通。
- 自定义 SMTP、真实邮件登录、第一位管理员、生产网址回调都未完成本次实测。此前用户反馈未配置 SMTP 且未收到登录邮件。
- CONTENT_REVIEWED 当前为 false。真实专业内容、安全文案和本地求助资源尚不能视为已完成审核。
- 当前没有本地 Git 仓库，没有完成 GitHub 推送或 Vercel 发布。

## 1. 先理解各个平台的工作

| 平台 | 负责什么 | 放什么 |
|---|---|---|
| GitHub | 保存代码和版本历史 | 源码、bun.lock、数据库迁移、配置示例和说明 |
| Vercel | 运行网页和服务端接口，提供 HTTPS 网址 | GitHub 导入的代码；在控制台单独填写环境变量 |
| Supabase | 登录、后台内容、角色、发布快照、活动 RSVP、调用额度 | 六个迁移创建的表及函数；Authentication 邮件设置 |
| OpenAI | 生成回答、朗读和语音转写 | API 密钥仅配置在 Vercel 服务端 |
| Tavily（可选） | 搜索可信域名中的科学资料 | 服务端搜索密钥；不配置可以关闭联网搜索 |

Supabase 不托管这套 Next.js 页面；Vercel 不替代数据库。暂时无需购买网站域名：Vercel 默认的 `你的项目.vercel.app` 可作为网站地址。**SMTP 发件域名是另外一回事**，邮件服务通常要求验证你有权使用的域名；Vercel 分配的网站域名不等于你能为它设置邮件 DNS。

## 2. Supabase：先准备数据库

1. 登录 Supabase，进入当前 Bloomie 项目。已有项目可以继续使用，不要误选其他项目。
2. 找到项目的 Project URL 和 publishable key（控制台 Connect 或项目 API 设置；名称可能随界面更新）。对应 Vercel 变量是 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。这两个用于客户端连接，并依靠 RLS 控制数据权限；不需要 service-role / secret key。
3. 在 SQL Editor 新建查询，先核对已有的应用表：

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and (table_name in ('favorites','chat_quota','speech_quota')
    or table_name like 'bloomie_%'
    or table_name like 'community_%'
    or table_name like 'together_%')
order by table_name;
```

4. **若是尚未安装任何 Bloomie 表的新库**，按下面顺序打开项目中的文件，完整复制 SQL 到编辑器，一次执行一个文件。每次确认成功再执行下一个：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | supabase/migrations/202610090001_initial.sql | 收藏表、聊天额度、基础 RLS |
| 2 | supabase/migrations/202610090002_speech_quota.sql | 每日语音额度 |
| 3 | supabase/migrations/202610090003_research_library.sql | 阅读资料相关约束更新 |
| 4 | supabase/migrations/202610100004_admin.sql | 后台角色、内容、发布、变更记录 |
| 5 | supabase/migrations/202610100005_community_events.sql | 社区活动及 RSVP |
| 6 | supabase/migrations/202610100006_together.sql | 每日活动、家庭聚会及 RSVP |

**已存在的迁移不要重复执行，也不要为了消除错误而删表。** 若只有一部分表存在，先对照文件核实执行记录；复制报错文本来排查，去掉令牌、密码及私人数据。通过 SQL Editor 运行不会自动等同于 Supabase CLI 的迁移历史记录，所以建议将文件编号、执行日期及成功结果记在项目记录里。后续新增迁移只执行新增文件。

5. 在 Table Editor 确认表存在。RLS 必须保持启用，不要为解决读取失败而关闭它；发布表可以被访客读取，草稿和报名个人记录有更严格权限，额度表禁止客户端直接访问。
6. Supabase 控制台的 Data API 需要能访问应用使用的 public schema。出现 PGRST205 要核对项目 URL、表名、迁移和 schema cache；不是把权限改成任何人都能读写。

## 3. Supabase：把真实邮件登录接起来

1. Authentication 中开启 Email 登录、允许新用户注册、保持邮箱确认开启。本应用使用邮箱链接登录，不要求家长设置密码。
2. 选择邮件发送服务。已有 SMTP 可继续用；否则选择你能配置的服务，例如 Resend、Postmark 或 SES。这一步是独立账户配置，不是 OpenAI API。
3. 在邮件服务中添加发件域名，按它给的 DNS 记录完成验证。可以使用你已有域名的邮件子域名。不要把 SMTP 密码填成 OpenAI 或 Supabase API Key。
4. 在 Supabase 的 Authentication → Email / SMTP Settings 中启用自定义 SMTP，逐项填写邮件服务提供的 Host、Port、Username、Password、Sender email、Sender name。发件人名称可用 Bloomie；邮箱需属于已验证的发件域名。端口和 TLS 方式按服务商说明，不套用其他供应商的值。
5. 关闭邮件服务对登录链接的点击跟踪，避免登录链接被改写。设置合理的 Auth 邮件频率限制；默认邮件服务仅供项目团队的非生产测试，不适用于普通用户注册。
6. Authentication → Email Templates 中，Magic Link 与 Confirm signup 都可使用项目现有 token-hash 登录方式：

```html
<h2>欢迎来到 Bloomie</h2>
<p>点击下方链接验证邮箱并登录。若不是你本人发起，可以忽略此邮件。</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">登录 Bloomie</a></p>
```

这与现有 `/auth/confirm` 代码匹配，也支持在另一浏览器打开新邮件。不要直接把 Supabase 模板占位符换成真实令牌。邮件模板改动只影响之后发送的邮件。

7. 暂时验证本机登录时，可将 Site URL 设为 `http://127.0.0.1:3000`，Redirect URLs 添加 `http://127.0.0.1:3000/auth/callback`。本机管理员预览不能证明登录成功；可在隔离的生产构建或关闭本机预览后验收。获得 Vercel 正式网址后必须按第 6 步切换 Site URL。
8. 用一个不属于 Supabase 项目团队的邮箱请求登录邮件，检查收件箱和垃圾邮件；点击**新发的**链接，确认登录、刷新后仍登录、退出后恢复未登录。不要把邮件链接或验证码发给我。

## 4. GitHub：建立私有代码仓库

建议首次使用 **Private** 仓库。它不妨碍 Vercel 导入；网站是否公开由部署配置决定。

1. 在 GitHub 点击 New repository，名字可用 `bloomie`，选择 Private。
2. 为了推送现有项目，**不要勾选自动创建 README、.gitignore 或 license**：本机已经有相应文件，空仓库更容易连接。
3. 创建后复制仓库 HTTPS URL，例如 `https://github.com/你的用户名/bloomie.git`。这只是示例，请用你的实际地址。提供该 URL 后可以让我处理本机初始化和推送。
4. 若自行在项目终端操作：

```sh
cd /Users/luyida/AI_Coding/PsyLink
bun run check
# 仅在这里尚未初始化 Git 时执行初始化：
git init -b main
git status --short
# 检查环境文件和本机数据确实被排除：
git check-ignore .env.local .data/admin-preview.json
# 审阅清单后再暂存：
git add .
git diff --cached --stat
git diff --cached --name-only
git commit -m "Prepare Bloomie for deployment"
git remote add origin https://github.com/你的用户名/bloomie.git
git push -u origin main
```

若 Git 要求姓名、邮箱，用你自己的 GitHub 提交身份或 GitHub 提供的 noreply 邮箱配置；不需要交出密码。首次认证可以使用 GitHub Desktop、浏览器授权或 `gh auth login`，不要把密码或 token 写进仓库 URL。

5. 打开 GitHub 文件列表，确认代码、`bun.lock`、六个迁移和 `.env.example` 存在；确认 `.env.local`、任何其他 `.env` 实际配置、`.data`、`node_modules`、`.next` 都没有上传。本项目已加强 `.gitignore`，但仍需要核对实际上传清单。

`bun run check` 包含类型检查、静态检查、测试、隔离数据库测试和构建，不会执行远端数据库迁移。

## 5. Vercel：导入并部署第一版验收环境

1. 登录 Vercel，选择 Add New → Project → Import Git Repository，连接 GitHub，仅授权需要的仓库，选择 Bloomie。
2. Framework Preset 选择 Next.js；Root Directory 为仓库根目录。无需额外建立“前端”“服务端”两个项目。
3. Install Command 可设为 `bun install --frozen-lockfile`；Build Command 设为 `bun run build`；Output Directory 使用 Next.js 默认值。保留仓库里的 `bun.lock`，避免每次安装不同依赖版本。项目记录使用 Bun 1.3.11，本机检查使用 Node 24.19.0；控制台的 Node 主版本应与支持的项目版本兼容。
4. 在 Environment Variables 中逐项填写下表。初次验收建议先只选择 Production，Preview 以后接测试项目，避免每条预览部署都读写生产数据。不要把整个 `.env.local` 文件直接公开上传。

| 变量 | 第一次验收部署的值 |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | 当前 Bloomie 项目的 Project URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 同一项目的 publishable key |
| OPENAI_API_KEY | 你的 OpenAI 项目密钥；仅服务端 |
| OPENAI_MODEL | gpt-4.1-mini（当前应用配置；需账户可用） |
| OPENAI_TTS_MODEL | gpt-4o-mini-tts |
| OPENAI_TTS_VOICE | marin |
| OPENAI_STT_MODEL | gpt-transcribe（官方当前支持；需账户可用） |
| AI_ENABLED | false |
| TTS_ENABLED | false |
| STT_ENABLED | false |
| CONTENT_REVIEWED | false |
| LOCAL_AI_PREVIEW | false |
| LOCAL_ADMIN_PREVIEW | false |
| SCIENTIFIC_SEARCH_ENABLED | false；验收搜索后再打开 |
| TAVILY_API_KEY | 可选；仅服务端，不用搜索可不填 |

**只有 Supabase URL 和 publishable key 使用 NEXT_PUBLIC_ 前缀。** OpenAI、Tavily 密钥不得加此前缀；不需要 Supabase service-role / 数据库管理员密码。

AI 相关开关先关闭，用于验收登录、数据库和后台；这不是最终 AI 可用状态。不要为了让界面显示启用而谎称专业审核已完成。

5. 点击 Deploy。构建失败先打开 Build Logs 查看第一处错误，不要反复修改随机环境变量。
6. 部署成功后记下稳定的项目地址，例如 `https://bloomie-某个实际名称.vercel.app`，使用控制台实际给你的地址，不照抄示例。
7. 验收阶段可在 Vercel 的 Deployment Protection 中使用账户方案支持的访问限制；如果没有适用的限制，暂时不要把网址发给真实家庭，保留明确的演示标记。不要把“已有 HTTPS 地址”当成完成公开验收。
8. Vercel 部署后**修改环境变量不会自动改变已部署版本**，需要重新 Deploy / Redeploy，确保新部署读取新值。

## 6. 将登录回调切到正式网址

在 Supabase Authentication → URL Configuration 中：

- Site URL：设置为 Vercel 的稳定 HTTPS 项目地址，不含 `/admin`。
- Redirect URLs：添加 `https://实际项目地址/auth/callback`；后台请求还会使用 `https://实际项目地址/auth/callback?next=/admin`，也把这个确切地址列入允许列表。
- 采用上述 token-hash 邮件模板时，浏览器最终进入 `https://实际项目地址/auth/confirm?...`，由 Site URL 决定，不要让它仍指向 localhost。
- 本机地址可作为独立开发允许地址保留。生产不要使用允许所有域名的通配符；需要预览登录时添加受控的具体预览地址，优先用独立测试 Supabase 项目。
- 重新发送一封新邮件。旧邮件可能仍指向旧域名，不能用来判断新配置。

成功验证邮件后，后台登录的 `next=/admin` 会返回后台。使用不包含回跳参数的 token-hash 邮件模板时，系统读取 `public.bloomie_staff` 的角色，后台成员自动进入 `/admin`，其他用户进入首页。该表的 `user_id` 必须与 Authentication → Users 中的账号 UUID 相同，`role` 应为 `admin`、`editor` 或 `reviewer`。Supabase 项目成员身份或用户 metadata 中的管理员标记不能代替这条记录；回跳参数也不会赋予权限。

## 7. 创建第一位管理员并发布内容

1. 先在正式网址使用你的工作邮箱完成注册和登录。
2. 在 Supabase Authentication → Users 找到账号，复制 **User ID / UUID**，不要复制 access token。
3. 由项目拥有者在 SQL Editor 执行，将示例 UUID 替换为实际账号 UUID：

```sql
insert into public.bloomie_staff (user_id, role)
values ('你的实际用户UUID'::uuid, 'admin')
on conflict (user_id) do update set role = excluded.role;
```

4. 打开正式网站 `/admin`，确认显示 `Supabase connected`，不再显示 Local workflow preview。如果仍无法进入，核对账号 UUID、当前网站和项目 URL。
5. 听读材料、知识条目和社区活动可从后台导入内置材料为草稿。今天一起与家庭聚会有内置初稿/示例，需要保存、实际核验，再发布。**本机 .data 的修改不会自动进入云端。** 有本机修改需要迁移时，先审阅内容，再通过后台编辑/导入，不能上传整个本机数据目录。
6. 中文、英文和其他语言内容是独立发布版本。切换后台界面语言不会自动翻译材料。真实咨询师应填写核验凭据、授权及联系渠道；没有真实人员就继续保留示例标记。
7. 创建编辑、审核人员时，先让账号注册，再由管理员在团队权限里授予相应角色。仅管理员能读取 RSVP 邮箱；普通家长不能访问后台。
8. 发布后在家长端验证文章、知识检索、活动与聚会主题同步。读取 `/api/catalog?locale=en-US` 应显示 mode 为 supabase；社区活动和每日活动接口也应成功并显示 supabase，不应是 local/builtin 或 503。

## 8. 完成审核后再开启真实 AI

需要实际专业人员核验当前知识内容、译文、每日活动适龄与安全、危险情境的引导及部署地区的求助资源。平台现在不含经当地核验的热线目录；有危机风险的家庭支持应用不能把自动代码测试当成专业安全复核。

实际完成这些工作后：

1. 在 Vercel 将 CONTENT_REVIEWED=true。
2. 按需将 AI_ENABLED、TTS_ENABLED、STT_ENABLED=true。
3. 需要联网搜索时配置 TAVILY_API_KEY，再将 SCIENTIFIC_SEARCH_ENABLED=true。域名白名单能限制来源，但不等于自动验证每个研究结论，仍要检查回答所附引用。
4. 重新部署，用登录的测试账号完成真实聊天、朗读及五语转写测试。API Key 存在和模型名称有效不保证账户有余额、权限或调用成功。
5. 聊天必须检查回答、科学来源、知识库之外问题、危险情境与失败提示；朗读应有 AI 语音标识；录音在 HTTPS 下检查浏览器权限、松开编辑、上滑发送和取消。
6. 当前每天每账号聊天额度为 30 次；朗读与转写共用语音额度 20 次。失败也可能已消耗请求额度。它不是总费用硬上限：同时在供应商控制台设置可用的预算告警、用量限制，并在初期关注多账号总消耗。

## 9. 最终验收：用两个真实测试账号

以下都通过后，才向真实用户开放：

- 新家长（不属于 Supabase 项目团队）收到邮件，点击登录，刷新保持登录，退出有效；另一浏览器打开新邮件也可用。
- 一名普通家长访问 `/admin` 无法看到内容/人员/报名邮箱；未登录后台接口 401，普通已登录账号无权限。
- 管理员编辑草稿不影响前台；审核发布后更新；下架后消失；编辑无发布权限，审核员不能改正文。
- 家庭聚会与社区活动可提交/取消意向；后台人数与账号记录正确，两名家长看不到彼此的状态或私人信息。意向仍不代表官方报名或预留名额。
- “今天一起”按年龄推荐、一天保持一致、全局最多换两次，完成与小记录刷新保留；它们仅在浏览器，换设备/清除数据不会自动找回。
- 书架、播客和偏好当前仍以浏览器保存为主；数据库中存在 favorites 表不等于界面已经实现跨设备收藏同步。
- 中英桌面、手机均检查；麦克风实机检查。提醒不是关闭网页也能收到的后台推送，聚会日历需用户实际导入。
- 真实 AI / TTS / STT 实际成功，失败不会冒充成功；示例人员、聚会、视频、播客仍如实标注。
- Vercel Logs / Supabase 日志没有持续服务错误；不要为排错加入聊天正文、音频或令牌日志。

初版没有站内真实真人预约、视频、支付或自动群发通知。部署不会把演示自动变成真实服务。

## 10. 上线后怎么更新与回退

修改代码 → `bun run check` → 提交并推送 GitHub → Vercel 自动构建对应分支。生产分支的推送一般触发生产部署；上线后建议先通过其他分支做预览验收，再合入生产分支。内容更新可以使用后台，无需每次改代码。

Vercel 代码回滚不回滚 Supabase 数据库；迁移需另行管理。后续数据库改动先在测试库执行，不删除生产表来重新安装。紧急停止 AI 时把 AI_ENABLED/TTS_ENABLED/STT_ENABLED 改为 false 并重新部署。备份/恢复能力和保留期依 Supabase 当前方案，在控制台确认。

## 官方参考

- [Supabase 自定义 SMTP 与默认发送限制](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase 登录回调地址](https://supabase.com/docs/guides/auth/redirect-urls)
- [GitHub 创建仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [Next.js 部署到 Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel 环境与生产分支](https://vercel.com/docs/deployments/environments)
- [OpenAI 原语言转写与模型](https://developers.openai.com/api/docs/guides/speech-to-text)
