#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

if (!BASE_SHA || !HEAD_SHA) {
  console.error('Missing required env vars: BASE_SHA and HEAD_SHA.');
  process.exit(1);
}

const SENSITIVE_PATHS = new Set([
  'data/games.json',
  'scripts/validate-site.mjs',
  'src/player.js',
  'src/sanitize.js',
  'src/app-version.js',
  'index.html',
  'archive.html',
  'game.html',
  'play.html'
]);

function normalizePath(value) {
  return value.replaceAll('\\', '/').trim();
}

function isSensitivePath(filePath) {
  return filePath.startsWith('.github/workflows/') || SENSITIVE_PATHS.has(filePath);
}

function writeOutput(key, value) {
  if (!GITHUB_OUTPUT) {
    return;
  }

  const delimiter = '__AGENTS_DOC_GUARD__';
  appendFileSync(GITHUB_OUTPUT, `${key}<<${delimiter}\n${value}\n${delimiter}\n`, 'utf8');
}

let changedFiles = [];

try {
  const stdout = execFileSync('git', ['diff', '--name-only', `${BASE_SHA}...${HEAD_SHA}`], {
    encoding: 'utf8'
  });

  changedFiles = stdout
    .split('\n')
    .map(normalizePath)
    .filter(Boolean);
} catch (error) {
  console.error(`Failed to compute changed files: ${error.message}`);
  process.exit(1);
}

const agentsChanged = changedFiles.includes('AGENTS.md');
const changedSensitiveFiles = changedFiles.filter(isSensitivePath);
const sensitiveChanged = changedSensitiveFiles.length > 0;
const needsAgentsUpdate = sensitiveChanged && !agentsChanged;

writeOutput('needs_agents_update', needsAgentsUpdate ? 'true' : 'false');
writeOutput('changed_sensitive_files', changedSensitiveFiles.join('\n'));

console.log(`agentsChanged=${agentsChanged}`);
console.log(`sensitiveChanged=${sensitiveChanged}`);
console.log(`needs_agents_update=${needsAgentsUpdate}`);
if (changedSensitiveFiles.length > 0) {
  console.log(`changed_sensitive_files=${changedSensitiveFiles.join(', ')}`);
}
