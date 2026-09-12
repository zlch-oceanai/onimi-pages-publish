# Install Onimi Pages / 安装与连接

This is a distribution candidate. Installing files does not prove that the hosted
service or a client integration has passed production acceptance. Official agent
marketplace listings are separate from this public repository.

这是分发候选包。安装成功不代表生产服务或当前客户端已完成授权发布验收。
官方 Agent 市场上架与此公开仓库是不同的分发渠道。

## Install the skill / 安装 Skill

Official repository: https://github.com/zlch-oceanai/onimi-pages-publish

Use the npm-distributed Skills CLI (the skill itself comes from GitHub):

```sh
npx skills@1.5.26 add zlch-oceanai/onimi-pages-publish --skill onimi-pages-publish --global
```

Select only the current agent and personal/global scope. Do not install to every
detected client automatically. If the client cannot execute commands, use its
documented skill-import UI or copy the complete `skills/onimi-pages-publish` folder.

只选择当前 Agent 和个人安装范围。不能运行命令的客户端，请使用其技能导入入口，
或复制完整的 `skills/onimi-pages-publish` 文件夹，不要只复制 SKILL.md。

| Client | Personal skill directory |
| --- | --- |
| Codex | `~/.agents/skills/onimi-pages-publish` |
| Claude Code | `~/.claude/skills/onimi-pages-publish` |
| Cursor | `~/.cursor/skills/onimi-pages-publish` |

Other clients: follow their current custom-skill documentation. A familiar brand
name is not proof that every desktop, web or mobile version supports this workflow.

## Direct download / 直接下载

Download `dist/onimi-pages-publish-0.1.0.zip` and `dist/SHA256SUMS` from the official
repository. Verify the ZIP using `shasum -a 256` (macOS), `sha256sum` (Linux), or
PowerShell `Get-FileHash -Algorithm SHA256`. Compare with SHA256SUMS before extracting.
The archive contains a single `onimi-pages-publish/` directory. Install it intact.

## Configure the connection / 配置连接

Remote MCP: `https://onimi.ai/mcp` (Streamable HTTP, browser OAuth with PKCE).
No static Authorization header or developer token is needed. Skill installation
alone does not necessarily register the MCP server. `agents/openai.yaml` declares
a dependency for hosts that support it; other hosts need their native MCP setup.

### Codex

Check `codex --version` and `codex mcp add --help` before using these options:

```sh
codex mcp add onimi-pages --url https://onimi.ai/mcp --oauth-client-registration dcr --oauth-resource https://onimi.ai/mcp
codex mcp login onimi-pages --oauth-client-registration dcr --scopes project:read,project:write,release:read,release:publish
```

The add operation may start authorization itself. Skip login if already connected.
If the installed version does not expose these flags, use its documented remote
MCP configuration or update the client; do not invent unsupported options.

### Claude Code

```sh
claude mcp add --transport http --scope user onimi-pages https://onimi.ai/mcp
```

Inside Claude Code run `/mcp`, select Onimi Pages and Authenticate.

### Cursor

Merge this server into the personal `~/.cursor/mcp.json` configuration using the
client's MCP settings. Preserve other servers and existing settings:

```json
{ "mcpServers": { "onimi-pages": { "url": "https://onimi.ai/mcp" } } }
```

Use the connection/authorization action shown by Cursor. Reload if needed.

### Kimi Code

Use the installed client's `/mcp-config` setup to add the HTTP service, then
`/mcp-config login onimi-pages` to start browser authorization. Check the client's
help for version-specific setup syntax.

### Other clients / 其他客户端

Use the client's documented custom remote MCP connection screen. Add the URL
above and start its OAuth flow. Do not substitute an API key when OAuth is missing.
WorkBuddy、千问办公、豆包桌面端、百度搭子等产品需分别核对当前版本是否支持自定义
Skill、远程 MCP 和浏览器 OAuth；不能仅凭内置技能功能宣称兼容。

## Browser approval and verification / 浏览器授权与验证

The user signs in to Onimi Pages if needed, reviews requested scopes, and approves
the connection. The agent must not click consent for the user or request tokens in
chat. The client owns credential storage and refresh.

After approval, call `onimi_list_projects` to check the connection. An empty project
list is a valid result. Do not create a project or publish a page as an installation
test. Tell the user to ask explicitly for a new project when publishing their first
HTML file. Revoke access in `https://onimi.ai/dashboard/connections` when no longer
needed. This does not take already published pages offline.

If discovery returns 404, a protection page or a login HTML document, installation
cannot repair the hosted service. Explain the unavailable connection; do not report
success or switch endpoints to a test environment. Dashboard upload is the fallback.

## Third-party directories / 第三方市场

Search skills.sh for `onimi-pages-publish` by `zlch-oceanai`. Confirm the official
repository before installing. If not indexed, use the GitHub installation above.
Directory indexing does not imply endorsement or an official agent-marketplace listing.

## Sources

- https://github.com/vercel-labs/skills
- https://learn.chatgpt.com/docs/extend/mcp?surface=cli
- https://code.claude.com/docs/en/mcp
- https://cursor.com/docs/context/mcp
- https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html
