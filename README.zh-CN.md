# Onimi Pages Publish

[English](README.md) | **简体中文**

在 Agent 对话中，通过浏览器授权发布 HTML 页面。

**分发候选包**：安装本包不代表生产服务已就绪、客户端已通过 OAuth 验收，
或已在官方 Agent 市场上架。服务部署与真实客户端验收是独立的发布步骤。

## 安装

```sh
npx skills@1.5.26 add zlch-oceanai/onimi-pages-publish --skill onimi-pages-publish --global
```

选择当前 Agent 的个人安装范围，再按 [安装说明](INSTALL.md) 配置连接并发起浏览器授权。
无需将 API 密钥或 Token 粘贴到聊天中。

- [下载 ZIP](dist/onimi-pages-publish-0.1.0.zip) · [SHA-256 校验值](dist/SHA256SUMS)
- [安装与连接说明](INSTALL.md)
- [如何使用](https://onimi.ai/how-to)
- [帮助中心](https://onimi.ai/help)

示例：「把 product.html 发布到 Onimi Pages，创建一个名为『产品介绍』的新项目，并把访问链接发给我。」

## 包含的能力

Skill 描述发布工作流；远程服务负责查询项目、创建项目和发布 HTML。
一个项目对应一个页面。稳定链接跟随当前生效版本，版本链接使用 `?version=vN`。

本仓库仅包含公开 Skill、安装文档和下载包，不包含 Onimi Pages 的私有应用代码或秘密。
Skill 和文档使用 MIT 许可证；托管服务适用独立的服务条款。

## 更新

从官方仓库重新安装即可更新，更新前请阅读变更。ZIP 与 SHA256SUMS 一同维护。
第三方市场收录可能延迟；找不到官方条目时，请直接使用本仓库。

## 0.1.0

- 浏览器 OAuth / PKCE 连接流程。
- 项目查询、按明确请求创建项目、发布 HTML。
- 各客户端安装说明，以及附 SHA-256 的可重复构建 ZIP。
