---
name: onimi-pages-publish
description: Publish one generated HTML page through the Onimi Pages Remote MCP connector. Use when the user asks to upload, share, preview, or publish HTML with Onimi Pages, including from WorkBuddy or a coding agent.
metadata:
  version: "0.1.0"
---

# Onimi Pages Publish

Use the Onimi Pages Remote MCP tools. Never ask the user to paste an API key, access token, authorization code, or refresh token into chat.

## Connect

Read [installation.md](references/installation.md) for complete installation and client-specific connection steps. Skill installation and MCP authorization are separate steps.

- Remote MCP URL: `https://onimi.ai/mcp`.
- On first use, allow the agent host to open the browser. The user signs in to Onimi Pages and approves the requested scopes there.
- Do not request a custom Authorization header. The MCP client performs OAuth discovery, PKCE, token refresh, and secure credential storage.
- If the host has no Remote MCP or OAuth support, explain that limitation. Offer dashboard upload at `https://onimi.ai/dashboard` as the no-CLI fallback. Use the legacy developer CLI only when the user explicitly asks for CI or terminal automation.

## Workflow

1. Locate the exact `.html` artifact. If several files are plausible, ask which one to publish.
2. Call `onimi_list_projects` and select an existing one-page project. Do not silently create a project.
3. If the user explicitly asks to create a project, call `onimi_create_project`. Its slug becomes permanent after the first successful release.
4. Read the HTML and call `onimi_publish_html` with the project ID or slug, complete HTML, filename, and a concise release note.
5. Return the stable URL, the `?version=vN` URL, and version number. Never put a version in the path.

## Safety

- Publication is an external write. State the resolved artifact and project before publishing when either was inferred.
- One project contains one externally accessible HTML page. Do not combine unrelated pages to bypass plan quotas.
- A failed release does not replace the current page.
- If the server reports a plan or visit limit, relay it without deleting or replacing existing projects.
- Treat a browser authorization request as user-owned. Do not approve consent on the user's behalf.
