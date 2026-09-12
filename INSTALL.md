# Install Onimi Pages

Choose one installation source, then connect your current agent using the guide below.
Installation does not authorize access or establish production service readiness.

## npm

The npm package bundles the complete skill and a dependency-free local installer.
It does not fetch skill files from GitHub. Requires Node.js 20 or later and npm.

```sh
npx --registry=https://registry.npmjs.org onimi-pages-publish@0.1.1 install --agent codex
```

Replace `codex` with `claude-code` or `cursor`. For another client, inspect its documented
personal skills directory and use `install --dir /absolute/path/to/skills` instead.
The installer creates `onimi-pages-publish` inside that parent directory. It preserves
existing installations: move the old folder aside before installing an update.
Run `npx --registry=https://registry.npmjs.org onimi-pages-publish@0.1.1 --help` for options.
Only install for the current agent. Restart or reload that agent if needed.

## Direct download

Download the archive and checksum from Cloudflare:

- https://downloads.onimi.ai/skills/onimi-pages-publish/0.1.1/onimi-pages-publish-0.1.1.zip
- https://downloads.onimi.ai/skills/onimi-pages-publish/0.1.1/SHA256SUMS

Verify with `shasum -a 256` (macOS), `sha256sum` (Linux), or PowerShell
`Get-FileHash -Algorithm SHA256`, and compare against SHA256SUMS before extracting.
The ZIP contains one complete `onimi-pages-publish/` directory; copy it intact into
only your current agent's personal skills directory. Do not overwrite local changes.

| Client | Personal skills parent directory |
| --- | --- |
| Codex | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |
| Cursor | `~/.cursor/skills` |

## ClawHub

Listing: https://clawhub.ai/mariohazy/onimi-pages-publish
Publisher: `mariohazy`; skill: `@mariohazy/onimi-pages-publish`.

```sh
npx --registry=https://registry.npmjs.org clawhub@0.23.3 install @mariohazy/onimi-pages-publish --version 0.1.1
```

ClawHub installs into its configured workspace skill directory by default. Use its
`--workdir` and `--dir` options to select only the current agent's documented skill
parent directory, or move the complete downloaded folder there. Run `clawhub --help`
to check these options. Do not bypass registry security review if a release is pending.

## GitHub

Official repository: https://github.com/zlch-oceanai/onimi-pages-publish

```sh
npx --registry=https://registry.npmjs.org skills@1.5.26 add zlch-oceanai/onimi-pages-publish --skill onimi-pages-publish --global
```

Select only the current agent. If it cannot run commands, use its documented skill
import UI or copy the complete `skills/onimi-pages-publish` folder from the repository.
Other clients require their own custom-skill and remote MCP support; a brand name
alone does not establish compatibility in every desktop, web or mobile version.

## Configure the connection

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

### Other clients

Use the client's documented custom remote MCP connection screen. Add the URL
above and start its OAuth flow. Do not substitute an API key when OAuth is missing.

## Browser approval and verification

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
