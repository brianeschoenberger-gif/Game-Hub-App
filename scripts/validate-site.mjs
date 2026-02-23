#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const errors = [];

function fail(message) {
  errors.push(message);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function validateMetadata() {
  const metadataPath = resolve(rootDir, 'data', 'games.json');

  if (!existsSync(metadataPath)) {
    fail('Missing data/games.json.');
    return;
  }

  let games;

  try {
    games = JSON.parse(readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in data/games.json: ${error.message}`);
    return;
  }

  if (!Array.isArray(games)) {
    fail('data/games.json must be an array of game objects.');
    return;
  }

  const idSet = new Set();
  const slugSet = new Set();
  const required = ['id', 'slug', 'title', 'releaseDate', 'thumbnailUrl', 'gamePath', 'status'];

  for (const [index, game] of games.entries()) {
    const context = `games[${index}]`;

    if (!game || typeof game !== 'object') {
      fail(`${context} must be an object.`);
      continue;
    }

    for (const field of required) {
      if (!(field in game)) {
        fail(`${context} is missing required field: ${field}.`);
      }
    }

    if (typeof game.id !== 'string' || !game.id.trim()) {
      fail(`${context}.id must be a non-empty string.`);
    } else if (idSet.has(game.id)) {
      fail(`${context}.id must be unique. Duplicate: ${game.id}`);
    } else {
      idSet.add(game.id);
    }

    if (typeof game.slug !== 'string' || !game.slug.trim()) {
      fail(`${context}.slug must be a non-empty string.`);
    } else if (slugSet.has(game.slug)) {
      fail(`${context}.slug must be unique. Duplicate: ${game.slug}`);
    } else {
      slugSet.add(game.slug);
    }

    if (typeof game.releaseDate !== 'string' || !isValidIsoDate(game.releaseDate)) {
      fail(`${context}.releaseDate must be a valid YYYY-MM-DD date.`);
    }

    if (typeof game.status !== 'string' || !['published', 'draft'].includes(game.status)) {
      fail(`${context}.status must be either "published" or "draft".`);
    }

    if (game.status !== 'published') {
      continue;
    }

    if (typeof game.gamePath !== 'string' || !game.gamePath.trim()) {
      fail(`${context}.gamePath must be a non-empty string for published games.`);
    } else if (!isHttpUrl(game.gamePath)) {
      const normalizedPath = game.gamePath.replace(/^\.\//, '').replace(/^\//, '');
      const runtimePath = resolve(rootDir, normalizedPath);
      if (!existsSync(runtimePath)) {
        fail(`${context}.gamePath does not exist on disk: ${game.gamePath}`);
      }
    }

    if (typeof game.thumbnailUrl !== 'string' || !game.thumbnailUrl.trim()) {
      fail(`${context}.thumbnailUrl must be a non-empty string for published games.`);
    } else if (!isHttpUrl(game.thumbnailUrl)) {
      const normalizedPath = game.thumbnailUrl.replace(/^\.\//, '').replace(/^\//, '');
      const thumbnailPath = resolve(rootDir, normalizedPath);
      if (!existsSync(thumbnailPath)) {
        fail(`${context}.thumbnailUrl does not exist on disk: ${game.thumbnailUrl}`);
      }
    }
  }
}

function validateJsSyntax() {
  const jsFiles = [
    'src/app-version.js',
    'src/archive.js',
    'src/data.js',
    'src/game-detail.js',
    'src/home.js',
    'src/news-banner.js',
    'src/paths.js',
    'src/player.js',
    'src/sanitize.js',
    'src/ui.js'
  ];

  for (const relativePath of jsFiles) {
    if (extname(relativePath) !== '.js') {
      continue;
    }

    const absolutePath = resolve(rootDir, relativePath);
    if (!existsSync(absolutePath)) {
      fail(`Missing JS module: ${relativePath}`);
      continue;
    }

    const result = spawnSync('node', ['--check', absolutePath], {
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      fail(`Syntax check failed for ${relativePath}:\n${result.stderr || result.stdout}`);
    }
  }
}

validateMetadata();
validateJsSyntax();

if (errors.length > 0) {
  console.error('❌ Validation failed with the following issues:\n');
  for (const [index, message] of errors.entries()) {
    console.error(`${index + 1}. ${message}`);
  }
  process.exit(1);
}

console.log('✅ Metadata and JavaScript validation passed.');
