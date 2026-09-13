#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, rename, rm, mkdtemp } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageMetadata = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const name = packageMetadata.name;
if (!["onimi-pages-publish", "onimi-pages-creator"].includes(name)) {
  throw new Error("Unsupported Onimi Pages package identity.");
}
const isPublish = name === "onimi-pages-publish";
const agents = { codex: ".agents/skills", "claude-code": ".claude/skills", cursor: ".cursor/skills" };
const boundary = isPublish
  ? `No network access, MCP configuration changes, credentials, or authorization
actions are performed by this installer. After installation, ask your agent to
follow the connection guide and start OAuth.`
  : `No network access, credentials, authorization, or publishing actions are
performed by this installer. Follow the bundled guide after installation.`;
const help = `Onimi Pages Skill installer

Usage:
  ${name} install --agent codex|claude-code|cursor [--lang en|zh-CN]
  ${name} install --dir /absolute/path/to/skills [--lang en|zh-CN]
  ${name} guide [--lang en|zh-CN]

--dir is a skills PARENT directory; the installer adds /${name}.
Choose exactly one target. Existing installations are preserved; remove or move
the old skill yourself before reinstalling. ${boundary}
`;

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && ["--help", "-h"].includes(args[0]))) {
    console.log(help);
    return;
  }
  const command = args.shift();
  if (!["install", "guide"].includes(command)) throw new Error("Unknown command. Use --help.");
  const options = {};
  while (args.length) {
    const key = args.shift();
    if (!["--agent", "--dir", "--lang"].includes(key) || key in options) {
      throw new Error(`Unknown or duplicate option: ${key}`);
    }
    const value = args.shift();
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    options[key] = value;
  }
  const lang = options["--lang"] ?? "en";
  if (!["en", "zh-CN"].includes(lang)) throw new Error("--lang must be en or zh-CN.");
  const guide = lang === "zh-CN" ? "installation.zh-CN.md" : "installation.md";
  const source = join(root, "skills", name);
  if (command === "guide") {
    if (options["--agent"] || options["--dir"]) throw new Error("guide does not accept a target.");
    console.log(await readFile(join(source, "references", guide), "utf8"));
    return;
  }
  const agent = options["--agent"];
  const directory = options["--dir"];
  if (Boolean(agent) === Boolean(directory)) throw new Error("Choose exactly one of --agent or --dir.");
  if (agent && !Object.hasOwn(agents, agent)) throw new Error("Unsupported agent. Use --help or an explicit --dir.");
  if (directory && !isAbsolute(directory)) throw new Error("--dir must be an absolute skills parent directory.");
  const parent = directory ? resolve(directory) : join(homedir(), agents[agent]);
  const target = join(parent, name);
  if (target === source || target.startsWith(`${source}/`)) throw new Error("Cannot install into the package itself.");
  // lstat also detects dangling symlinks. Never follow or replace an existing target.
  try {
    await lstat(target);
    throw new Error(`Target already exists; preserved unchanged: ${target}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(parent, { recursive: true });
  // Reserve the target exclusively, so another installation cannot be overwritten.
  await mkdir(target);
  let staging;
  try {
    staging = await mkdtemp(join(parent, ".onimi-install-"));
    await cp(source, join(staging, name), { recursive: true, dereference: false, force: false, errorOnExist: true });
    // Rename over our empty reservation only after all bundled files are ready.
    await rename(join(staging, name), target);
  } catch (error) {
    if (staging) await rm(staging, { recursive: true, force: true });
    // Only remove our empty reservation. Never recursively delete the target.
    const { rmdir } = await import("node:fs/promises");
    await rmdir(target).catch(() => {});
    throw error;
  }
  await rm(staging, { recursive: true, force: true });
  console.log(lang === "zh-CN" ? `已安装：${target}` : `Installed: ${target}`);
  if (isPublish) {
    console.log(lang === "zh-CN"
      ? `请让当前 Agent 阅读 ${join(target, "references", guide)}，配置连接并发起浏览器授权。安装本身不会完成授权。`
      : `Ask your current agent to read ${join(target, "references", guide)}, configure the connection and start browser OAuth. Installation alone does not authorize access.`);
  } else {
    console.log(lang === "zh-CN"
      ? `请让当前 Agent 阅读 ${join(target, "references", guide)}。安装本身不会发布页面或授权账号。`
      : `Ask your current agent to read ${join(target, "references", guide)}. Installation does not publish a page or authorize an account.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
