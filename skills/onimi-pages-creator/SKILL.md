---
name: onimi-pages-creator
description: Create polished standalone HTML / 创建高质量自包含 HTML。Use for websites, interactive artifacts, reports, posters, dashboards, or demos.
metadata:
  version: "0.1.1"
---

# Onimi Pages Creator

Create the page in the user's own Agent workspace. Onimi Pages supplies publishing and stable links;
it does not supply a hosted model or generate the page on the user's behalf.

Follow the user's conversation language for progress, questions, and the final response: answer in
Chinese for a Chinese conversation and in English for an English conversation unless the user asks
otherwise. Follow the user's requested language, locale, tone, facts, and audience for the created page.
When the artifact language is not specified, infer it from the request and conversation; do not change
the response language merely because the artifact itself is bilingual or uses a different language.

## Shape the artifact

Infer the page language from the request and conversation. Ask only for decisions that materially
change the result. Choose an intentional visual direction and interaction model for the actual job;
do not turn every request into a dashboard, card grid, or generic landing page. Read
[scenario-playbook.md](references/scenario-playbook.md) for a matching composition and interaction
pattern. Read [page-quality.md](references/page-quality.md) when checking a complex interactive page.

Before writing markup, state a compact art direction for yourself: the intended audience, the dominant
visual gesture, the information density, the type hierarchy, and the source of any imagery or data.
The direction must come from the content. Do not reuse a house-style utility header, hero, card shell,
or language switch arrangement merely because it worked for a previous artifact. When creating a
series, prototype a few meaningfully different representatives and review them in the browser before
expanding the set.

Produce one self-contained `.html` file unless the user asks for a maintainable application project.
For the standalone format:

- Embed CSS and JavaScript. Do not depend on a CDN, external font, analytics script, remote image, or
  network request unless the user explicitly asks and understands that the page will no longer be
  self-contained.
- Use semantic landmarks, one clear `h1`, visible keyboard focus, responsive layout, print treatment
  when the content is printable, and `prefers-reduced-motion` for animation.
- Make every visible control work with keyboard and pointer input. Remove placeholder actions. Label
  simulations, fictional people, and invented metrics as sample content.
- Preserve the user's facts and tone. Do not invent endorsements, production availability, completed
  transactions, or live data.
- Treat Chinese and English as separate typographic compositions. Preserve intentional line breaks,
  inspect both languages at the target viewport, and correct collisions, overflow, or a lone character
  stranded on its own display line.

## Create and verify

Write to a new artifact path or the path the user selected. Resolve this installed Skill's directory
from the loaded `SKILL.md` path, then run its validator by absolute path without changing the user's
workspace directory:

```sh
node /absolute/path/to/onimi-pages-creator/scripts/validate-html.mjs /absolute/path/to/page.html
```

Resolve reported structural or self-containment failures. Preview the exact file in a real browser when
one is available. Check the primary interactions, keyboard order, narrow viewport, reduced motion, and
print layout where relevant. Treat a screenshot as visual evidence only; it does not replace interaction
checks. Review the rendered hierarchy, text wrapping, imagery, content density, and interaction state in
every supported language. Iterate until the page is useful and visually resolved rather than stopping
after the first render.

## Continue to publishing

Creation never implies permission to publish or make a page public. If the user asks to publish and the
`onimi-pages-publish` skill is installed, use it after validation and follow its project selection and
OAuth rules. If it is unavailable, give the user the Onimi Pages installation route or the manual
dashboard upload path. Keep the finished local HTML usable either way.

When the user has explicitly authorized publication, continue through the installed publish workflow
without asking again for the same authorization. Never choose public visibility when the user's intent
is private or unclear.

## Check for updates

Do not interrupt creation solely to check for updates. The bundled manager applies only to a direct-download
installation that has `.onimi-skill.json` beside this `SKILL.md`; if that receipt is absent, do not run the
manager. Use npm, GitHub, ClawHub, or the agent host's native check and update flow for those installations.
For a receipt-backed direct installation, resolve the installed Skill directory from this file's path and
invoke its manager by absolute path, without changing the user's workspace directory. At most once per day,
the Agent may run
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs check`; a timeout, offline response, or
invalid channel response is non-fatal and must not block the user's work. Use
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs status` for an offline integrity check.

Never update automatically. Show the available version and release notes, then update only after the
user explicitly asks to do so by running
`node /absolute/path/to/onimi-pages-creator/scripts/manage.mjs update --confirm onimi-pages-creator@<exact-version>`.
The direct-download
manager protects modified, missing, and additional local files, verifies the archive and fingerprints,
and keeps a backup for rollback. Installations from npm, ClawHub, or another host follow that channel's
own update behavior; do not promise one uniform self-update mechanism.
