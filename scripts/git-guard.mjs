#!/usr/bin/env node
/**
 * GIT GUARD: Zero-Dependency Pre-Commit & Commit-Msg Enforcer
 * Vendored from sports-federation/scripts/git-guard.mjs so this remote does not need a sibling checkout.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';

const mode = process.argv[2];
const files = process.argv.slice(3);

if (mode === 'commit-msg') {
  const msgFile = files[0];
  if (!msgFile || !existsSync(msgFile)) process.exit(0);
  const firstLine = readFileSync(msgFile, 'utf8').trim().split('\n')[0];
  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\-.]+\))?!?: .{1,100}$/;
  if (!conventionalRegex.test(firstLine)) {
    console.error('\n[GIT GUARD] Invalid commit message format!');
    console.error('   Required: <type>(<scope>): <description>');
    process.exit(1);
  }
  process.exit(0);
}

if (mode === 'tokens') {
  const codeLeakRegex = /(?:\[object Object\]|\[SY\u00d6T\u00c4 TULOS\]|\[PVM\]|(?:\b(?:undefined|null|NaN)\b\s*\+)|(?:\+\s*\b(?:undefined|null|NaN)\b)|\$\{\s*(?:undefined|null|NaN)\s*\}|>\s*(?:undefined|null|NaN)\s*<)/;
  const nonCodeLeakRegex = /(?:\b(?:undefined|null|NaN)\b|\[object Object\]|\[SY\u00d6T\u00c4 TULOS\]|\[PVM\])/;
  let hasLeak = false;
  for (const file of files) {
    if (!existsSync(file)) continue;
    try { if (statSync(file).isDirectory()) continue; } catch { continue; }
    if (file.includes('node_modules') || file.includes('.git') || file.includes('dist')) continue;
    const lower = file.toLowerCase();
    if (lower.includes('test') || lower.includes('fixtures') || lower.includes('git-guard')) continue;
    const isCode = /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(file);
    const isMarkdown = /\.md$/i.test(file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let inMarkdownCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.includes('git-guard-ignore') || trimmed.includes('token-ignore')) continue;
      if (isCode && (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))) continue;
      if (isMarkdown) {
        if (trimmed.startsWith('```')) { inMarkdownCodeBlock = !inMarkdownCodeBlock; continue; }
        if (inMarkdownCodeBlock) continue;
      }
      let lineToCheck = isMarkdown ? line.replace(/`[^`]*`/g, '') : line;
      const isDocs = file.startsWith('docs') || file.includes('/docs/');
      const docsLeakRegex = /(?:\[object Object\]|\[SY\u00d6T\u00c4 TULOS\]|\[PVM\])/;
      const regex = isCode ? codeLeakRegex : (isDocs ? docsLeakRegex : nonCodeLeakRegex);
      if (regex.test(lineToCheck)) {
        console.error(`[GIT GUARD] Template token leak in ${file}:${i + 1}`);
        hasLeak = true;
      }
    }
  }
  if (hasLeak) process.exit(1);
  process.exit(0);
}

if (mode === 'secrets') {
  const secretPatterns = [
    { name: 'Private Key Block', regex: /-----BEGIN (?:RSA|EC|OPENSSH|PGP|DSA)? PRIVATE KEY-----/ },
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  ];
  let hasSecret = false;
  for (const file of files) {
    if (!existsSync(file)) continue;
    try { if (statSync(file).isDirectory()) continue; } catch { continue; }
    if (file.includes('node_modules') || file.includes('.git') || file.includes('dist')) continue;
    if (file.includes('git-guard')) continue;
    const isEnv = /(?:^|[\\/])(?:\.env(?:\..+)?|[^\\/]+\.env)$/i.test(file) && !/\.(?:example|sample|template)$/i.test(file);
    const isKey = /\.(?:pem|key|p12|pfx)$/i.test(file);
    if (isEnv || isKey) { console.error(`[GIT GUARD] Forbidden credentials file staged: ${file}`); hasSecret = true; continue; }
    const content = readFileSync(file, 'utf8');
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(content)) {
        console.error(`[GIT GUARD] Potential secret leak (${pattern.name}) in ${file}`);
        hasSecret = true;
      }
    }
  }
  if (hasSecret) process.exit(1);
  process.exit(0);
}

console.log('[GIT GUARD] Usage: node git-guard.mjs <tokens|secrets|commit-msg> [args...]');
process.exit(0);
