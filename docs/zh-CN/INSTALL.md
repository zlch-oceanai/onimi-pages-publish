# 安装 Onimi Pages

选择一种安装来源，然后按下方说明连接当前 Agent。安装 Skill 不会自动完成授权，
也不代表生产服务已完成验收。

## npm 安装

npm 包内置完整 Skill 和无第三方依赖的本地安装器，不从 GitHub 下载 Skill 文件。
需要 Node.js 20 或以上版本，以及 npm。

```sh
npx --registry=https://registry.npmjs.org onimi-pages-publish@latest install --agent codex --lang zh-CN
```

将 `codex` 替换为 `claude-code` 或 `cursor`，只安装到当前 Agent。
其他客户端请先查明个人技能目录，再使用 `install --dir /技能父目录的绝对路径 --lang zh-CN`。
安装器会在父目录内创建 `onimi-pages-publish` 文件夹；已有目录会保留并停止安装。
安装后按需重新加载 Agent。使用市场渠道前，请查看
https://downloads.onimi.ai/skills/manifest.json 中的已验证渠道状态。npm 渠道标记为可用时
再运行上面的 `@latest` 命令；尚不可用时，请选择清单中另一个已标记为可用的渠道。

查看完整参数：

```sh
npx --registry=https://registry.npmjs.org onimi-pages-publish@latest --help
```

## 直接下载

使用稳定 latest 入口。它会跳转到不可变、带版本号的 ZIP：

- https://onimi.ai/skills/publish/latest
- https://downloads.onimi.ai/skills/manifest.json

macOS 使用 `shasum -a 256`，Linux 使用 `sha256sum`，PowerShell 使用
`Get-FileHash -Algorithm SHA256`，与稳定清单中的 `publish.archive.sha256` 比较后再解压。
将完整的 `onimi-pages-publish/` 文件夹放进当前 Agent 的个人技能父目录，不要只复制
SKILL.md，也不要覆盖已有的个人修改。

| 客户端 | 个人技能父目录 |
| --- | --- |
| Codex | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |
| Cursor | `~/.cursor/skills` |

## ClawHub 市场

条目：https://clawhub.ai/mariohazy/onimi-pages-publish

核对发布者为 `mariohazy`，技能为 `@mariohazy/onimi-pages-publish`：

```sh
npx --registry=https://registry.npmjs.org clawhub@0.23.3 install @mariohazy/onimi-pages-publish
```

默认安装到 ClawHub 配置的工作区技能目录。通过 `--workdir` 和 `--dir` 指定当前 Agent
的技能父目录，或将下载的完整文件夹移入该目录。先用 `clawhub --help` 核对参数。
如果版本正在安全审核中，等待审核完成，不要绕过检查。

## GitHub 安装

官方仓库：https://github.com/zlch-oceanai/onimi-pages-publish

```sh
npx --registry=https://registry.npmjs.org skills@1.5.26 add zlch-oceanai/onimi-pages-publish --skill onimi-pages-publish --global
```

只选择当前 Agent 和个人安装范围。不能运行命令的客户端，使用其技能导入入口，
或复制仓库中完整的 `skills/onimi-pages-publish` 文件夹。

直接下载的安装可运行 `node scripts/manage.mjs status` 离线检查本地状态，
运行 `node scripts/manage.mjs check` 做每天最多一次、失败不阻塞的更新检查。
用户明确同意所显示的版本后，才运行
`node scripts/manage.mjs update --confirm onimi-pages-publish@<版本>`。
管理器会保护所有修改与新增文件、校验不可变归档、保留备份，并在切换失败时回滚。
npm、ClawHub、GitHub 和 Agent 宿主的更新命令由各渠道分别管理。

## 配置连接与授权

远程 MCP 地址：`https://onimi.ai/mcp`，使用 Streamable HTTP 和浏览器 OAuth / PKCE。
不需要静态 Authorization header、API Key 或开发者 Token。
Skill 安装与 MCP 配置是独立步骤。支持依赖声明的宿主可读取 `agents/openai.yaml`；
其他客户端需要使用自身的 MCP 设置入口。

### Codex

先用 `codex --version` 和 `codex mcp add --help` 核对当前版本支持下列参数：

```sh
codex mcp add onimi-pages --url https://onimi.ai/mcp --oauth-client-registration dcr --oauth-resource https://onimi.ai/mcp
codex mcp login onimi-pages --oauth-client-registration dcr --scopes project:read,project:write,release:read,release:publish
```

添加连接时可能已经触发授权，若已连接成功，无需重复登录。
旧版本不支持相关参数时，使用对应版本的配置方式或更新客户端，不要编造参数。

### Claude Code

```sh
claude mcp add --transport http --scope user onimi-pages https://onimi.ai/mcp
```

在 Claude Code 中运行 `/mcp`，选择 Onimi Pages 并点击 Authenticate。

### Cursor

通过 MCP 设置把以下服务器合并到个人 `~/.cursor/mcp.json`，保留其他服务器和已有设置：

```json
{ "mcpServers": { "onimi-pages": { "url": "https://onimi.ai/mcp" } } }
```

使用客户端显示的连接或授权操作，按需重新加载。

### Kimi Code 与其他客户端

Kimi Code 可通过 `/mcp-config` 添加 HTTP 服务，再运行
`/mcp-config login onimi-pages` 发起浏览器授权；具体配置语法以已安装版本的帮助为准。
WorkBuddy、千问办公、豆包桌面端、百度搭子等客户端需分别确认当前版本是否支持
自定义 Skill、远程 MCP 和浏览器 OAuth。使用各自的连接设置，不要用 API Key 代替 OAuth。

## 浏览器授权与验证

如果尚未登录 Onimi Pages，用户先登录，再查看并确认访问权限。
Agent 不应代替用户点击授权，也不应索要聊天中的 Token。凭证保存与刷新由客户端负责。

授权后调用 `onimi_list_projects` 验证连接，空项目列表也是有效结果。
安装验证不创建项目或发布页面；首次发布时，请明确要求创建新项目。

在 `https://onimi.ai/dashboard/connections` 可撤销授权。撤销连接不会自动下线已发布页面。

如果服务发现返回 404、防护页面或登录 HTML，说明连接服务尚不可用。
不要报告连接成功，也不要擅自切换测试地址；可以先在工作台上传 HTML。
