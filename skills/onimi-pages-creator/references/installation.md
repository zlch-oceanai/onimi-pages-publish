# Install Onimi Pages Creator

Choose one verified source and install the complete `onimi-pages-creator` folder for only the current
agent. Installation runs locally. It does not connect an account, send a prompt to Onimi Pages, or
publish a page.

## npm

Use npm's `latest` release only after the npm channel is marked available in the
[stable manifest](https://downloads.onimi.ai/skills/manifest.json). Node.js 20 or later is required.

```sh
npx --registry=https://registry.npmjs.org onimi-pages-creator@latest install --agent codex
```

Replace `codex` with `claude-code` or `cursor`. For another client, use its documented personal skills
directory with `install --dir /absolute/path/to/skills`. The installer preserves an existing target and
performs no network, account, or publishing action.

## Direct download

Read `skills.creator.archive.url`, `sha256`, and `size` from the
[stable manifest](https://downloads.onimi.ai/skills/manifest.json). Download that immutable archive URL,
verify both values, then extract it. Copy the complete folder without overwriting local changes. This
flow does not depend on the website's latest-redirect route being deployed first.

| Client | Personal skills parent directory |
| --- | --- |
| Codex | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |
| Cursor | `~/.cursor/skills` |

## GitHub

Official repository: https://github.com/zlch-oceanai/onimi-pages-creator

```sh
npx --registry=https://registry.npmjs.org skills@1.5.26 add zlch-oceanai/onimi-pages-creator --skill onimi-pages-creator --global
```

## ClawHub

Use this channel only when the stable manifest marks it available:
The pinned ClawHub CLI requires Node.js 22 or later; use another verified channel on Node.js 20.

```sh
npx --registry=https://registry.npmjs.org clawhub@0.23.3 install @mariohazy/onimi-pages-creator
```

## Verify and use

Restart or reload the current agent if required, then ask it to create one local HTML page. The Skill
includes `scripts/validate-html.mjs`; validation and browser preview do not publish the file.

Creation and publication are separate. If you later ask to publish, install `onimi-pages-publish` from
a verified channel and follow its browser OAuth guide. Never substitute a test service URL in a public
installation.

The bundled manager applies only when a direct-download installation has `.onimi-skill.json` beside
`SKILL.md`; if the receipt is absent, use that channel's native update flow. For a receipt-backed
installation, resolve the installed Skill directory from its `SKILL.md` path and
invoke the manager by absolute path without changing the user's workspace directory. Run
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs status` locally and
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs check` for a non-blocking daily update
check. Update only after reviewing the version and explicitly approving
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs update --confirm onimi-pages-creator@<version>`.
npm, GitHub and ClawHub use
their own update mechanisms.
