# Bloomie 登录上线检查

## 已验证与待验证

已使用当前 `.env.local` 的真实 Supabase 项目进行只读检查：Auth 设置接口返回 200；邮箱登录已启用，注册允许，邮箱验证已开启。没有输出密钥。

`favorites` 查询返回 `PGRST205`：该表未在 REST schema 中找到。需要应用下述迁移，并确认表可通过 Data API 访问。此结果不表示登录服务失效，但云端收藏尚不能验收。

已通过本地登录表单提交一次授权的邮件测试；用户确认未收到邮件，也尚未配置自定义 SMTP。当前不能标记为“用户可登录”。需要先配置邮件发送服务，再用真实邮箱完成用户点击链接、登录会话刷新和退出的验证。尚未部署，生产回调和生产邮件服务也尚未验收。当前 69 项自动测试、类型检查和生产构建已通过；自动测试使用模拟服务，不能替代实际登录。

## Supabase 控制台配置

1. **SQL Editor**：依次执行 `supabase/migrations/202610090001_initial.sql` 和 `supabase/migrations/202610090002_speech_quota.sql`、`supabase/migrations/202610090003_research_library.sql`。这些迁移创建收藏与额度，不保存聊天内容。
2. **Authentication → Providers / Sign In**：启用 Email，允许注册，保持邮箱确认开启。
3. **Authentication → Email / SMTP Settings**：配置真实发送服务（如 Resend、Postmark 或 SES），验证发件域名。Supabase 默认发送服务限制收件人为项目组织成员，不适合公开用户注册。不要通过关闭邮箱确认来绕过发送限制。
4. **Authentication → URL Configuration**：本地 Site URL 可设为 `http://127.0.0.1:3000`。Redirect URLs 添加 `http://127.0.0.1:3000/auth/callback`；若使用 localhost，单独添加 `http://localhost:3000/auth/callback`。部署后将 Site URL 改为实际的 `https://你的项目.vercel.app`，并添加该地址的 `/auth/callback`。无需购买自定义域名。生产不要使用宽泛通配符。
5. **Authentication → Email Templates**：推荐将 **Magic Link** 与 **Confirm signup** 两种模板的登录链接都改为下方形式。这样从手机或另一浏览器打开邮件也能建立会话。保留模板中的其他说明，但不把验证码、链接或密钥发到聊天中。

```html
<h2>欢迎来到 Bloomie</h2>
<p>点击下方链接，验证邮箱并登录。若不是你本人发起，可以忽略此邮件。</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">登录 Bloomie</a></p>
```

`/auth/confirm` 只接收 email 类型的验证，验证完成后回到首页。旧模板走 `/auth/callback` 的 PKCE 流程，通常要求在发起请求的同一浏览器中打开。模板修改只影响之后发送的邮件；之前的链接不变。关闭邮件服务的点击跟踪，避免改写验证链接。

## Vercel 配置和验收

在对应的 Vercel 环境填入 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；修改后重新部署。这里不需要 service-role 密钥。OpenAI 密钥始终只放服务端。

验收时使用真实邮箱，并至少包含一个不属于 Supabase 项目组织成员的邮箱：

- 首次发送登录链接，收件箱或垃圾邮件中能找到邮件。
- 点击新链接后回到正确的生产网址，页面显示已登录。
- 刷新页面后仍然登录；退出后恢复未登录状态。
- 已使用或过期链接不能重新建立会话，页面提示重新获取。
- 从另一浏览器打开新邮件，使用 token-hash 模板也能登录。
- 当前书架收藏仍主要保存于浏览器；不能用收藏刷新保留证明跨设备同步已实现。数据库收藏权限测试可参考 `supabase/tests/favorites_rls.sql`，按文件说明在测试环境执行。

完成以上实际验收后，才能标记“生产登录已验证”。公开 AI 的内容审核和额度检查是另外的上线条件，不应为测试登录而开启。

官方依据：[邮件发送限制](https://supabase.com/docs/guides/auth/auth-smtp)、[无密码邮箱登录](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[Next.js 服务端会话](https://supabase.com/docs/guides/auth/server-side/nextjs)。
