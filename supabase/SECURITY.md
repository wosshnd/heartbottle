SECURITY.md

数据库安全加固说明（Supabase / Postgres）

我在仓库中新增了以下内容：

1) supabase/policies.sql
   - 为 bottles、replies、users、notices 等表启用 Row Level Security (RLS)
   - 限制客户端直接写入：只有认证用户可以插入（并限制 content 长度、禁止显式 <script> 标签）
   - 只允许资源所有者更新/删除自己的记录
   - 将 notices 的客户端 INSERT 禁止，提示通过后端（service role）来发送通知
   - 提供了 normalize_text() SQL 函数与触发器，用于在写入前做基础清洗

2) supabase/functions/insert_bottle.js
   - 示例 Supabase Edge Function（Deno 风格）演示如何使用服务角色密钥在服务器端验证、清洗、插入数据
   - 做了基本的输入长度检查、禁止明显的脚本注入、并示范如何从客户端 Bearer token 获取用户 ID
   - 注意：生产中请替换或增强审核逻辑（自然语言审核、内容分类、第三方防滥用服务）

部署与后续步骤（建议）

- 在 Supabase 控制台的 SQL 编辑器中运行 supabase/policies.sql。
  - 在运行前请对照你的真实表结构（列名、约束）调整脚本中的字段名。

- 部署 Edge Function：把 supabase/functions/insert_bottle.js 作为一个 Edge Function（Supabase Functions / Deno）部署。
  - 在函数运行环境中设置环境变量 SUPABASE_URL 与 SUPABASE_SERVICE_KEY（服务角色密钥），不要在前端暴露服务角色密钥。

- 前端改动：替换直接从客户端写入数据库（使用 anon key）为调用受保护的 Edge Function。
  - 优点：你可以在函数内执行更复杂的审核（调用 aiReview、checkRisk），并对恶意/高风险内容做专门处理（封禁、发送人工审阅队列、紧急热线提示）。

- 日志与监控：
  - 在函数中记录失败的插入与可疑事件（不要记录原始敏感文本），并推送到专用的审计表或监控系统。
  - 将 service_role 操作集中在受限环境中（CI / Functions），限制谁可以修改服务密钥。

- 防滥用与速率限制：
  - 上面的 Edge Function 示例仅演示了本地策略。生产请使用共享速率限制存储（Redis、Upstash 等）或 Cloudflare Rate Limits。

如需我把前端调用替换为调用 Edge Function（修改 index.html 的客户端插入逻辑），我可以继续提交一个补丁，或把现有前端的插入函数改为调用 /functions/v1/insert_bottle。