# Bloomie 上线前检查记录

日期：2026-10-10，America/New_York。状态：**DONE_WITH_CONCERNS — 代码可继续准备发布；生产服务尚不可宣称验收通过。**

## 通过的检查

- 类型检查通过。
- 69 项自动测试通过，1,258 个断言。
- 六个迁移在隔离 PGlite 数据库执行成功；覆盖角色分离、匿名隔离、发布快照、版本冲突、个人 RSVP 隔离、管理员邮箱权限、取消、删除保留历史等。
- 生产构建通过，21 个页面/接口路由完成构建。
- 静态检查 0 错误、9 警告；剩余警告为 React effect 依赖/ref 清理提示，未全部修复，不等同于运行时漏洞证明。
- `bun install --frozen-lockfile --ignore-scripts` 验证现有锁文件无需改动即可安装。
- 111 个源码、结构化数据、测试及 SQL 文件的常见密钥模式检查未发现可疑硬编码；已生成浏览器 JS 中未找到现有 OpenAI 和 Tavily 密钥。未扫描二进制附件、历史 Git 提交或供应商账户，本项目尚无 Git 历史。
- 真正的 `next start` 生产构建（127.0.0.1:3001）中，即使本机环境文件启用预览，`/api/status` 仍返回 localPreview=false、authRequired=true，且 CONTENT_REVIEWED=false 时 AI/TTS/STT 都未开启。
- 生产构建匿名请求 `/api/admin/content`、`/api/admin/events`、`/api/admin/together` 均返回 401。
- 官方文档确认 `gpt-transcribe` 当前有效；本次没有更换模型，也没有用真实录音发起收费转写测试。

## 已处理

1. `.gitignore` 改为忽略所有实际 `.env*` 配置，仅保留 `.env.example`，降低首次上传漏掉非 local 环境文件的风险；`.data`、构建和依赖已排除。
2. 静态检查排除生成目录；修复未使用变量、显式类型、局部表达式和内部导航问题，未放宽业务校验及权限。
3. 增加 `bun run check`，串联类型、静态检查、单元测试、隔离数据库检查和生产构建；记录 Bun 1.3.11。
4. 新增 `DEPLOYMENT_GUIDE.md`；同步旧文档的六个迁移与本地收藏边界。

## 不能标记通过的云端检查

- 使用现有公开 Supabase 配置做只读检查：Auth settings 200，Email/注册开启、邮箱确认开启。
- `favorites`、`bloomie_publications`、`together_publications`、`bloomie_staff`、`chat_quota`、`speech_quota`、`together_registrations` 返回 PGRST205。公开 REST schema 没有暴露这些预期表；需在项目控制台核对数据库迁移及 schema，不应关闭 RLS。
- 生产构建 `/api/catalog?locale=en-US` 返回 builtin，而不是 supabase；`/api/community`、`/api/together` 返回 503。控制台中必须先完成数据库安装，才能进行后台与 RSVP 验收。
- 上述请求导致的浏览器 401/503 控制台错误分别对应故意测试匿名后台及真实数据库未就绪；不能报告为“控制台完全无错误”。
- 自定义 SMTP、本次真实邮件收件/登录/退出/跨浏览器验证、生产 Site URL/回调、管理员初始化未实测完成。
- 实际专业内容、安全文案、译文、本地求助资源仍需人工核验；CONTENT_REVIEWED=false 保持真实状态。本次没有把公开 AI 开关打开。
- 没有推送 GitHub、创建 Vercel 项目、执行远端迁移或发布网站；仓库目标与账户操作仍待确定。

## 下一步

按 DEPLOYMENT_GUIDE.md 操作：核对/执行缺失迁移 → 配置 SMTP → 私有 GitHub 仓库 → 关闭 AI 的首个 Vercel 验收部署 → 更新正式登录回调 → 注册并授权管理员 → 发布审核内容 → 双账号真实验收 → 实际专业安全复核后启用 AI 并重新部署。

公网验收必须在实际部署后完成；本机生产构建、模拟 API 和隔离 SQL 不替代真实用户、真实 SMTP 和云端权限测试。
