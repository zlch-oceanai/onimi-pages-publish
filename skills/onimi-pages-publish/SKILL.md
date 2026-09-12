---
name: onimi-pages-publish
description: Publish one generated HTML page through the Onimi Pages Remote MCP connector. Use when the user asks to upload, share, preview, or publish HTML with Onimi Pages, including from WorkBuddy or a coding agent.
metadata:
  version: "0.2.0"
---

# Onimi Pages Publish

Use the Onimi Pages Remote MCP tools. Never ask the user to paste an API key, access token, authorization code, or refresh token into chat.

## Connect

Read [installation.md](references/installation.md) for complete installation and client-specific connection steps. Skill installation and MCP authorization are separate steps.

For a Chinese-language conversation, use [the Chinese installation guide](references/installation.zh-CN.md).

- Remote MCP URL: `https://onimi.ai/mcp`.
- On first use, allow the agent host to open the browser. The user signs in to Onimi Pages and approves the requested scopes there.
- Do not request a custom Authorization header. The MCP client performs OAuth discovery, PKCE, token refresh, and secure credential storage.
- If the host has no Remote MCP or OAuth support, explain that limitation. Offer dashboard upload at `https://onimi.ai/dashboard` as the no-CLI fallback. Use the legacy developer CLI only when the user explicitly asks for CI or terminal automation.

## Workflow

1. Locate the exact `.html` artifact. If several files are plausible, ask which one to publish.
2. Call `onimi_list_projects` and select an existing one-page project. Do not silently create a project.
3. If the user explicitly asks to create a project, call `onimi_create_project`. Pass category and tags only when the user supplied or approved them. Its slug becomes permanent after the first successful release.
4. Read the HTML and call `onimi_publish_html` with the project ID or slug, complete HTML, filename, and a concise release note. Supply one UUID `idempotencyKey` and reuse that exact value only when retrying the same publish request after an uncertain transport failure.
5. Keep the project's existing visibility unless the user explicitly asks to change it. For “public” or “listed” intent, call `onimi_set_visibility` with `public`; for “anyone with the link” or “unlisted” intent, use `unlisted`; for access removal, use `private`. Never infer public visibility merely because the user asked to publish.
6. Return the stable URL, the `?version=vN` URL, version number, and actual visibility. Never put a version in the path. A private URL is not a shareable public result; say that access remains private.

## Safety

- Publication is an external write. State the resolved artifact and project before publishing when either was inferred.
- One project contains one externally accessible HTML page. Do not combine unrelated pages to bypass plan quotas.
- A failed release does not replace the current page.
- If the server reports a plan or visit limit, relay it without deleting or replacing existing projects.
- Treat a browser authorization request as user-owned. Do not approve consent on the user's behalf.

## Check for updates

Do not interrupt a publishing request solely to check for a Skill update. At most once
per day, a host or user may run `node scripts/manage.mjs check`; an offline check is
non-fatal. Use `node scripts/manage.mjs status` to inspect the installed version and
local fingerprint without network access.

Never update automatically. Show the available version and ask the user to approve that
specific update. After approval, run
`node scripts/manage.mjs update --confirm onimi-pages-publish@<version>`. The manager
refuses modified or extra local files, verifies the stable manifest and archive SHA-256,
keeps the old directory as a backup, and rolls back a failed switch. GitHub, npm, ClawHub,
and host-native Skill managers have separate update behavior; use their documented
channel-specific update command rather than claiming this script controls those channels.
