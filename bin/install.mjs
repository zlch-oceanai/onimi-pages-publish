#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, readdir, readlink, rename, rm, mkdtemp, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageMetadata = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const name = packageMetadata.name;
if (!["onimi-pages-publish", "onimi-pages-creator"].includes(name)) {
  throw new Error("Unsupported Onimi Pages package identity.");
}
const isPublish = name === "onimi-pages-publish";
const suiteNames = ["onimi-pages-creator", "onimi-pages-publish"];
// SHA-256 of the receipt shipped in the public npm 0.2.1 tarball. Its managed
// digests identify the exact historical baseline without trusting a local edit.
const legacyReceiptSha256 = "c3d005ab415e1cb4348530905fdfeaf5587fcfd205431d44d4381374fb3b1a10";
const agents = { codex: ".agents/skills", "claude-code": ".claude/skills", cursor: ".cursor/skills" };
const boundary = isPublish
  ? `No network access, MCP configuration changes, credentials, or authorization
actions are performed by this installer. After installation, ask your agent to
follow the connection guide and start OAuth.`
  : `No network access, credentials, authorization, or publishing actions are
performed by this installer. Follow the bundled guide after installation.`;
const help = `Onimi Pages Skill installer

Usage:
  ${name} install --agent codex|claude-code|cursor [--lang en|zh-CN] [--suite]
  ${name} install --dir /absolute/path/to/skills [--lang en|zh-CN] [--suite]
  ${name} guide [--lang en|zh-CN]
  onimi-pages-publish legacy-plan --dir /absolute/path/to/skills
  onimi-pages-publish legacy-prepare --dir /absolute/path/to/skills
  onimi-pages-publish legacy-upgrade --dir /absolute/path/to/skills --confirm onimi-pages-publish@${packageMetadata.version} [--reviewed-customizations]
  onimi-pages-publish legacy-recover --dir /absolute/path/to/skills

--dir is a skills PARENT directory; the installer adds /${name}.
Choose exactly one target. --suite is available from the Publish package and
explicitly prepares both Creator and Publish. Existing installations and local
changes are preserved; only missing modules are added. ${boundary}
legacy-upgrade accepts only the verified public Publish 0.2.1 receipt. It keeps
the complete original directory in a durable backup store outside the scanned
skills directory. For local edits, run
legacy-prepare to create a separate 0.3.1 candidate while keeping 0.2.1 active.
Review and merge modified files into that candidate, then pass
--reviewed-customizations. Extra personal files are copied unchanged into the
candidate; modified managed files are never automatically merged.
`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function filesUnder(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...(await filesUnder(directory, path)));
    else result.push({ path, type: entry.isFile() ? "file" : "non-file" });
  }
  return result.sort((left, right) => left.path.localeCompare(right.path));
}

async function inspectSkill(directory, expectedVersion, pinnedReceipt) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Skill target must be a real directory: ${directory}`);
  }
  const receiptBytes = await readFile(join(directory, ".onimi-skill.json"));
  if (pinnedReceipt && sha256(receiptBytes) !== pinnedReceipt) {
    throw new Error("Existing Publish receipt does not match the public 0.2.1 baseline; directory preserved.");
  }
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  if (
    receipt.schemaVersion !== 1 || receipt.name !== "onimi-pages-publish" ||
    receipt.version !== expectedVersion ||
    !receipt.managedFiles || typeof receipt.managedFiles !== "object" ||
    Array.isArray(receipt.managedFiles)
  ) {
    throw new Error("Skill receipt identity is invalid; directory preserved.");
  }
  const expected = new Set([".onimi-skill.json", ...Object.keys(receipt.managedFiles)]);
  const actual = await filesUnder(directory);
  const paths = new Set(actual.map((item) => item.path));
  const changes = [];
  for (const item of actual) {
    if (item.type !== "file") changes.push(`non-file:${item.path}`);
    else if (!expected.has(item.path)) changes.push(`extra:${item.path}`);
    else if (item.path !== ".onimi-skill.json" &&
      sha256(await readFile(join(directory, ...item.path.split("/")))) !== receipt.managedFiles[item.path]) {
      changes.push(`modified:${item.path}`);
    }
  }
  for (const path of expected) if (!paths.has(path)) changes.push(`missing:${path}`);
  return { version: receipt.version, changes: changes.sort() };
}

async function legacyPlan(parent) {
  if (packageMetadata.version !== "0.3.1") throw new Error("This legacy migration requires the Publish 0.3.1 package.");
  const target = join(parent, "onimi-pages-publish");
  const source = join(root, "skills", "onimi-pages-publish");
  const old = await inspectSkill(target, "0.2.1", legacyReceiptSha256);
  const next = await inspectSkill(source, packageMetadata.version);
  if (next.changes.length) throw new Error("Bundled Publish files failed their receipt check.");
  return { target, source, from: old.version, to: packageMetadata.version,
    originalDigest: await treeDigest(target), localChanges: old.changes, backupRequired: true };
}

function candidatePath(parent) {
  return join(legacyMigrationRoot(parent), "onimi-pages-publish.legacy-candidate-0.3.1");
}

function legacyMigrationRoot(parent) {
  return join(dirname(parent), ".onimi-pages-migrations", basename(parent));
}

async function ensureRealDirectory(directory, description) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${description} must be a real directory: ${directory}`);
  }
}

function legacyBackupRoot(parent) {
  // Agent runtimes can discover every directory under their skills parent as a
  // Skill. Keep migration backups beside that parent, grouped by its portable
  // basename, so an old SKILL.md can never become a second active Skill.
  return join(dirname(parent), ".onimi-pages-backups", basename(parent));
}

function isLegacyBackupPath(parent, backup) {
  const target = join(parent, "onimi-pages-publish");
  const backupName = "onimi-pages-publish.backup-legacy-0.2.1-";
  return typeof backup === "string" && isAbsolute(backup) && (
    (dirname(backup) === legacyBackupRoot(parent) && basename(backup).startsWith(backupName)) ||
    // Accept a record left by the previous installer only for recovery. Its
    // successful-upgrade backup remains user-owned and is never overwritten.
    (dirname(backup) === parent && backup.startsWith(`${target}.backup-legacy-0.2.1-`))
  );
}

function requireReviewableChanges(plan) {
  const unsupported = plan.localChanges.filter((item) =>
    !item.startsWith("extra:") && !item.startsWith("modified:"));
  if (unsupported.length) {
    throw new Error(`Legacy changes require manual migration (${unsupported.join(", ")}); original directory preserved.`);
  }
}

async function treeDigest(directory) {
  const entries = [];
  for (const item of await filesUnder(directory)) {
    const path = join(directory, ...item.path.split("/"));
    entries.push([item.path, item.type, item.type === "file" ? sha256(await readFile(path)) : await readlink(path)]);
  }
  return sha256(Buffer.from(JSON.stringify(entries)));
}

async function legacyPrepare(parent) {
  const lock = join(parent, ".onimi-pages-publish.legacy-upgrade.lock");
  await mkdir(lock);
  let staging;
  let pendingPlan;
  try {
    const plan = await legacyPlan(parent);
    if (!plan.localChanges.length) throw new Error("No customizations found; use legacy-upgrade directly.");
    requireReviewableChanges(plan);
    const migrationRoot = legacyMigrationRoot(parent);
    await ensureRealDirectory(migrationRoot, "Legacy migration store");
    const candidate = candidatePath(parent);
    if (await pathExists(candidate) || await pathExists(`${candidate}.plan.json`)) {
      throw new Error(`Migration candidate already exists; review it before retrying: ${candidate}`);
    }
    staging = await mkdtemp(join(parent, ".onimi-legacy-stage-"));
    const stagedSkill = join(staging, "onimi-pages-publish");
    await cp(plan.source, stagedSkill, { recursive: true, dereference: false, force: false, errorOnExist: true });
    for (const change of plan.localChanges) {
      if (!change.startsWith("extra:")) continue;
      const relative = change.slice(6);
      const oldFile = join(plan.target, ...relative.split("/"));
      const stat = await lstat(oldFile);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Personal non-file requires manual handling: ${relative}`);
      const output = join(stagedSkill, ...relative.split("/"));
      if (await pathExists(output)) throw new Error(`Personal file collides with new version: ${relative}`);
      await mkdir(dirname(output), { recursive: true });
      await cp(oldFile, output, { force: false, errorOnExist: true });
    }
    if (await treeDigest(plan.target) !== plan.originalDigest) {
      throw new Error("Original Publish changed during candidate preparation; retry from a fresh plan.");
    }
    const metadata = { schemaVersion: 1, from: "0.2.1", to: packageMetadata.version,
      originalDigest: plan.originalDigest, localChanges: plan.localChanges };
    const planPath = `${candidate}.plan.json`;
    await writeFile(planPath, `${JSON.stringify(metadata, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    pendingPlan = planPath;
    await rename(stagedSkill, candidate);
    pendingPlan = undefined;
    console.log(`Candidate ready at ${candidate}. Original 0.2.1 remains active at ${plan.target}.`);
    console.log(`Review and merge modified files: ${plan.localChanges.filter((item) => item.startsWith("modified:")).join(", ") || "none"}`);
    console.log(`After review: legacy-upgrade --dir ${parent} --confirm onimi-pages-publish@${packageMetadata.version} --reviewed-customizations`);
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true });
    if (pendingPlan) await rm(pendingPlan, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}

async function reviewedCandidate(plan, parent, selectedPath = candidatePath(parent)) {
  const candidate = selectedPath;
  const metadata = JSON.parse(await readFile(`${candidatePath(parent)}.plan.json`, "utf8"));
  if (metadata.schemaVersion !== 1 || metadata.from !== "0.2.1" || metadata.to !== packageMetadata.version ||
    metadata.originalDigest !== plan.originalDigest ||
    JSON.stringify(metadata.localChanges) !== JSON.stringify(plan.localChanges)) {
    throw new Error("Original 0.2.1 files changed after candidate preparation; keep both directories and prepare a fresh review.");
  }
  const receipt = await readFile(join(candidate, ".onimi-skill.json"));
  const sourceReceipt = await readFile(join(plan.source, ".onimi-skill.json"));
  if (!receipt.equals(sourceReceipt)) throw new Error("Candidate receipt changed; review rejected.");
  const files = await filesUnder(candidate);
  if (files.some((item) => item.type !== "file")) throw new Error("Candidate contains a non-file entry.");
  const candidateChanges = (await inspectSkill(candidate, packageMetadata.version)).changes;
  const allowedChanges = new Set(plan.localChanges.filter((item) => item.startsWith("extra:") || item.startsWith("modified:")));
  if (candidateChanges.some((item) => !allowedChanges.has(item))) {
    throw new Error(`Candidate has an unreviewed or missing file: ${candidateChanges.find((item) => !allowedChanges.has(item))}`);
  }
  const paths = new Set(files.map((item) => item.path));
  for (const change of plan.localChanges) {
    const relative = change.slice(change.indexOf(":") + 1);
    const selected = join(candidate, ...relative.split("/"));
    if (change.startsWith("extra:")) {
      if (!paths.has(relative) || sha256(await readFile(selected)) !== sha256(await readFile(join(plan.target, ...relative.split("/"))))) {
        throw new Error(`Personal file was not preserved in candidate: ${relative}`);
      }
    } else if (change.startsWith("modified:")) {
      if (!paths.has(relative) || (await readFile(selected)).equals(await readFile(join(plan.source, ...relative.split("/"))))) {
        throw new Error(`Review and merge modified file in candidate before activation: ${relative}`);
      }
    }
  }
  const skill = await readFile(join(candidate, "SKILL.md"), "utf8");
  if (!skill.startsWith("---\n") || !skill.includes(`\n  version: "${packageMetadata.version}"\n`)) {
    throw new Error("Candidate SKILL.md does not declare the new version.");
  }
  return candidate;
}

async function legacyUpgrade(parent, confirmation, reviewedCustomizations) {
  if (confirmation !== `onimi-pages-publish@${packageMetadata.version}`) {
    throw new Error(`Explicit confirmation required: --confirm onimi-pages-publish@${packageMetadata.version}`);
  }
  const lock = join(parent, ".onimi-pages-publish.legacy-upgrade.lock");
  await mkdir(lock).catch((error) => {
    if (error.code === "EEXIST") throw new Error(`Legacy upgrade lock exists; inspect before retrying: ${lock}`);
    throw error;
  });
  let staging;
  let backup;
  let movedOld = false;
  try {
    const plan = await legacyPlan(parent);
    requireReviewableChanges(plan);
    if (plan.localChanges.length && !reviewedCustomizations) {
      throw new Error(`Local customizations found (${plan.localChanges.join(", ")}); original remains active. Run legacy-prepare, review the candidate, then use --reviewed-customizations.`);
    }
    if (!plan.localChanges.length && reviewedCustomizations) throw new Error("No customizations found; omit --reviewed-customizations.");
    const selectedSource = plan.localChanges.length ? await reviewedCandidate(plan, parent) : plan.source;
    staging = await mkdtemp(join(parent, ".onimi-legacy-stage-"));
    const stagedSkill = join(staging, "onimi-pages-publish");
    await cp(selectedSource, stagedSkill, { recursive: true, dereference: false, force: false, errorOnExist: true });
    const staged = await inspectSkill(stagedSkill, packageMetadata.version);
    if (!plan.localChanges.length && staged.changes.length) throw new Error("Staged Publish files failed their receipt check.");
    if (plan.localChanges.length) await reviewedCandidate(plan, parent, stagedSkill);
    if (await treeDigest(plan.target) !== plan.originalDigest) {
      throw new Error("Original Publish changed during migration; active directory preserved.");
    }
    const backupRoot = legacyBackupRoot(parent);
    await ensureRealDirectory(backupRoot, "Legacy backup store");
    const suffix = new Date().toISOString().replace(/[:.]/g, "-");
    backup = join(backupRoot, `onimi-pages-publish.backup-legacy-0.2.1-${suffix}-${process.pid}`);
    await lstat(backup).then(
      () => { throw new Error("Legacy backup destination already exists."); },
      (error) => { if (error.code !== "ENOENT") throw error; },
    );
    await writeFile(join(lock, "operation.json"), `${JSON.stringify({ target: plan.target, backup, pid: process.pid })}\n`, { mode: 0o600 });
    await rename(plan.target, backup);
    movedOld = true;
    if (process.env.ONIMI_SKILL_TESTING === "1" && process.env.ONIMI_LEGACY_CRASH_AFTER_OLD_MOVE === "1") {
      process.exit(91);
    }
    // Test-only fault point checks that a failed final switch restores the old bytes.
    if (process.env.ONIMI_SKILL_TESTING === "1" && process.env.ONIMI_LEGACY_FAIL_SWITCH === "1") {
      throw new Error("Simulated legacy switch failure.");
    }
    await rename(stagedSkill, plan.target);
    movedOld = false;
    console.log(`Upgraded Publish 0.2.1 to ${packageMetadata.version}. Complete original kept outside the skills directory at ${backup}`);
    if (plan.localChanges.length) console.log(`Reviewed customization is active; original bytes remain in backup. Candidate retained at ${selectedSource}`);
  } catch (error) {
    if (movedOld && backup) {
      try { await rename(backup, join(parent, "onimi-pages-publish")); movedOld = false; }
      catch (restoreError) {
        throw new Error(`${error.message} Automatic restore failed: ${restoreError.message}. Original remains at ${backup}; lock kept at ${lock}.`);
      }
    }
    throw error;
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true });
    if (!movedOld) await rm(lock, { recursive: true, force: true });
  }
}

async function legacyRecover(parent) {
  const lock = join(parent, ".onimi-pages-publish.legacy-upgrade.lock");
  const operation = JSON.parse(await readFile(join(lock, "operation.json"), "utf8"));
  const target = join(parent, "onimi-pages-publish");
  if (operation.target !== target || !isLegacyBackupPath(parent, operation.backup)) {
    throw new Error("Legacy recovery record is invalid; do not alter either directory.");
  }
  if (Number.isInteger(operation.pid)) {
    try { process.kill(operation.pid, 0); throw new Error("Upgrade process is still running; recovery refused."); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  }
  if (await pathExists(target)) throw new Error("Active Publish target exists; recovery refused to overwrite it.");
  await inspectSkill(operation.backup, "0.2.1", legacyReceiptSha256);
  await rename(operation.backup, target);
  await rm(lock, { recursive: true, force: true });
  console.log(`Restored original Publish 0.2.1 at ${target}. Review before retrying.`);
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function installSkill(parent, skillName) {
  const source = join(root, "skills", skillName);
  const target = join(parent, skillName);
  if (target === source || target.startsWith(`${source}/`)) {
    throw new Error("Cannot install into the package itself.");
  }
  try {
    const existing = await lstat(target);
    if (!existing.isDirectory() || existing.isSymbolicLink()) {
      throw new Error(`Existing target is not a safe directory; preserved unchanged: ${target}`);
    }
    return { skillName, status: "preserved", target };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!(await pathExists(source))) {
    throw new Error(`This package does not contain the requested module: ${skillName}`);
  }
  // Reserve the target exclusively, so another installation cannot be overwritten.
  await mkdir(target);
  let staging;
  try {
    staging = await mkdtemp(join(parent, ".onimi-install-"));
    await cp(source, join(staging, skillName), {
      recursive: true,
      dereference: false,
      force: false,
      errorOnExist: true,
    });
    // Rename over our empty reservation only after all bundled files are ready.
    await rename(join(staging, skillName), target);
  } catch (error) {
    if (staging) await rm(staging, { recursive: true, force: true });
    // Only remove our empty reservation. Never recursively delete the target.
    const { rmdir } = await import("node:fs/promises");
    await rmdir(target).catch(() => {});
    throw error;
  }
  await rm(staging, { recursive: true, force: true });
  return { skillName, status: "installed", target };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && ["--help", "-h"].includes(args[0]))) {
    console.log(help);
    return;
  }
  const command = args.shift();
  if (!["install", "guide", "legacy-plan", "legacy-prepare", "legacy-upgrade", "legacy-recover"].includes(command)) throw new Error("Unknown command. Use --help.");
  const options = {};
  while (args.length) {
    const key = args.shift();
    if (!["--agent", "--dir", "--lang", "--suite", "--confirm", "--reviewed-customizations"].includes(key) || key in options) {
      throw new Error(`Unknown or duplicate option: ${key}`);
    }
    if (["--suite", "--reviewed-customizations"].includes(key)) {
      options[key] = true;
      continue;
    }
    const value = args.shift();
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    options[key] = value;
  }
  const lang = options["--lang"] ?? "en";
  if (!["en", "zh-CN"].includes(lang)) throw new Error("--lang must be en or zh-CN.");
  const guide = lang === "zh-CN" ? "installation.zh-CN.md" : "installation.md";
  const source = join(root, "skills", name);
  if (command.startsWith("legacy-")) {
    if (!isPublish) throw new Error("Legacy Publish upgrade is available only from the Publish package.");
    if (!options["--dir"] || !isAbsolute(options["--dir"]) || options["--agent"] ||
      options["--suite"] || options["--lang"] ||
      (command !== "legacy-upgrade" && (options["--confirm"] || options["--reviewed-customizations"]))) {
      throw new Error("Legacy commands require only --dir /absolute/path/to/skills; legacy-upgrade also accepts --confirm and --reviewed-customizations.");
    }
    const parent = resolve(options["--dir"]);
    if (command === "legacy-plan") console.log(JSON.stringify(await legacyPlan(parent), null, 2));
    else if (command === "legacy-prepare") await legacyPrepare(parent);
    else if (command === "legacy-recover") await legacyRecover(parent);
    else await legacyUpgrade(parent, options["--confirm"], options["--reviewed-customizations"] === true);
    return;
  }
  if (options["--confirm"] || options["--reviewed-customizations"]) {
    throw new Error("--confirm and --reviewed-customizations are only valid with legacy-upgrade.");
  }
  if (command === "guide") {
    if (options["--agent"] || options["--dir"] || options["--suite"]) {
      throw new Error("guide does not accept a target or --suite.");
    }
    console.log(await readFile(join(source, "references", guide), "utf8"));
    return;
  }
  const agent = options["--agent"];
  const directory = options["--dir"];
  const suite = options["--suite"] === true;
  if (suite && !isPublish) {
    throw new Error("--suite is available from the onimi-pages-publish package.");
  }
  if (Boolean(agent) === Boolean(directory)) throw new Error("Choose exactly one of --agent or --dir.");
  if (agent && !Object.hasOwn(agents, agent)) throw new Error("Unsupported agent. Use --help or an explicit --dir.");
  if (directory && !isAbsolute(directory)) throw new Error("--dir must be an absolute skills parent directory.");
  const parent = directory ? resolve(directory) : join(homedir(), agents[agent]);
  await mkdir(parent, { recursive: true });
  const requested = suite ? suiteNames : [name];
  const results = [];
  for (const skillName of requested) results.push(await installSkill(parent, skillName));
  for (const result of results) {
    if (result.status === "installed") {
      console.log(lang === "zh-CN" ? `已安装：${result.target}` : `Installed: ${result.target}`);
    } else {
      console.log(
        lang === "zh-CN"
          ? `已存在并保留不变：${result.target}`
          : `Already present; preserved unchanged: ${result.target}`,
      );
    }
  }
  const publishTarget = join(parent, "onimi-pages-publish");
  if (suite) {
    const preserved = results.filter((result) => result.status === "preserved");
    if (preserved.length) {
      console.log(lang === "zh-CN"
        ? `Creator 与 Publish 目录均已存在，但已有模块被原样保留，版本及完整性尚未验证。请先核对两个模块与本次已验证版本是否一致；旧版须按原安装渠道安全更新并保留个人修改，不能把“已存在”当成套件已就绪。需要云能力时，请让当前 Agent 阅读 ${join(publishTarget, "references", guide)}，并复用同账号且权限足够的有效连接。安装本身不会完成授权。`
        : `Creator and Publish directories are present, but existing modules were preserved without version or integrity verification. Check both modules against this verified release; update an older module through its original channel while preserving personal changes. Presence alone does not mean the suite is ready. For cloud capabilities, ask the current agent to read ${join(publishTarget, "references", guide)} and reuse a valid same-account connection with sufficient scopes. Installation alone does not authorize access.`);
    } else {
      console.log(lang === "zh-CN"
        ? `已从本安装包安装 Creator 与 Publish。需要云草稿、受控模板或发布时，请让当前 Agent 阅读 ${join(publishTarget, "references", guide)}；先复用同账号且权限范围足够的有效连接，否则再发起浏览器授权。安装本身不会完成授权。`
        : `Creator and Publish were installed from this package. When cloud drafts, governed templates, or publishing are needed, ask the current agent to read ${join(publishTarget, "references", guide)}. Reuse a valid connection for the same account and sufficient scopes before starting browser OAuth. Installation alone does not authorize access.`);
    }
  } else if (isPublish) {
    console.log(lang === "zh-CN"
      ? `已准备 Publish；未安装 Creator。请让当前 Agent 阅读 ${join(publishTarget, "references", guide)}，先复用适用连接，否则再发起浏览器授权。安装本身不会完成授权。`
      : `Publish is prepared; Creator was not installed. Ask the current agent to read ${join(publishTarget, "references", guide)} and reuse a suitable connection before starting browser OAuth. Installation alone does not authorize access.`);
  } else {
    const target = join(parent, name);
    console.log(lang === "zh-CN"
      ? `请让当前 Agent 阅读 ${join(target, "references", guide)}。安装本身不会发布页面或授权账号。`
      : `Ask your current agent to read ${join(target, "references", guide)}. Installation does not publish a page or authorize an account.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
