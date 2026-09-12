# Onimi Pages Publish

**English** | [简体中文](README.zh-CN.md)

Publish an HTML page from your agent through browser-authorized Remote MCP.

**Distribution candidate**: installing this package is not a claim
of production service readiness, client OAuth acceptance or marketplace listing.
Hosting and real-client acceptance are separate release gates.

## Install

```sh
npx skills@1.5.26 add zlch-oceanai/onimi-pages-publish --skill onimi-pages-publish --global
```

Select your current agent and personal installation scope. Then follow
[INSTALL.md](INSTALL.md) to configure the connection and start browser authorization.
No API keys or tokens need to be pasted into chat.

- [Download ZIP](dist/onimi-pages-publish-0.1.0.zip) · [SHA-256](dist/SHA256SUMS)
- [Installation and connection guide](INSTALL.md)
- [How it works](https://onimi.ai/how-to)
- [Help center](https://onimi.ai/help)

Example: “Publish product.html to Onimi Pages, create a new project called
Product intro, and send me the link.”

## Package

The skill describes the workflow; the remote service implements project listing,
project creation and HTML publishing. Each project holds one page. Stable links
follow the active release; version links use `?version=vN`.

This repository contains only the public skill, installation documentation and
download archive. It does not contain the private Onimi Pages application or secrets.
The skill and its documentation are MIT licensed. The hosted service has separate terms.

## Updates

Reinstall from the official repository to update. Review changes before updating.
The ZIP and SHA256SUMS are versioned together. Third-party indexing may lag;
use this repository if an official listing cannot be found.

## 0.1.0

- Browser OAuth / PKCE connection workflow.
- Project discovery, explicit project creation and HTML publication.
- Per-client installation guide and deterministic ZIP with SHA-256.
