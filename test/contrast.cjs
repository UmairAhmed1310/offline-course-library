#!/usr/bin/env node
/**
 * Contrast checker for CSS custom properties.
 * Fails if any text/background pair in light or dark mode falls below WCAG AA (4.5:1 for text, 3:1 for UI).
 */

const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.error('No <style> block found');
  process.exit(1);
}
const css = styleMatch[1];

// Extract :root and dark mode variables
const rootMatch = css.match(/:root\s*{([^}]+)}/);
const darkMatch = css.match(/@media\(prefers-color-scheme:dark\)\s*{:root[^}]*{([^}]+)}}/);
const darkExplicitMatch = css.match(/:root\[data-theme="dark"\]\s*{([^}]+)}/);

function parseVars(block) {
  const vars = {};
  const lines = block.split(';');
  for (const line of lines) {
    const m = line.match(/--([^:]+):\s*([^;]+)/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

const lightVars = parseVars(rootMatch ? rootMatch[1] : '');
const darkVars = parseVars(darkMatch ? darkMatch[1] : (darkExplicitMatch ? darkExplicitMatch[1] : ''));

// Relevant color variables
const colorVars = ['bg', 'fg', 'mut', 'card', 'line', 'ac', 'ok', 'ok-bg', 'wn', 'bd'];

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function luminance({ r, g, b }) {
  const srgb = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(name, fgHex, bgHex, minRatio) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const ratio = contrastRatio(luminance(fg), luminance(bg));
  const pass = ratio >= minRatio;
  return { name, ratio: ratio.toFixed(2), min: minRatio, pass, fg: fgHex, bg: bgHex };
}

// Define critical text/background pairs to check
const pairs = [
  // Light mode
  { name: 'light: fg on bg', fg: lightVars.fg, bg: lightVars.bg, min: 4.5 },
  { name: 'light: mut on bg', fg: lightVars.mut, bg: lightVars.bg, min: 4.5 },
  { name: 'light: button.pri (white on ac)', fg: '#ffffff', bg: lightVars.ac, min: 4.5 },
  { name: 'light: .pill.d (white on ok)', fg: '#ffffff', bg: lightVars.ok, min: 4.5 },
  { name: 'light: .toast (white on ok)', fg: '#ffffff', bg: lightVars.ok, min: 4.5 },
  { name: 'light: .toast.w (white on wn)', fg: '#ffffff', bg: lightVars.wn, min: 4.5 },
  { name: 'light: .hb help button (white on ac)', fg: '#ffffff', bg: lightVars.ac, min: 4.5 },
  { name: 'light: .bar i (ok on line)', fg: lightVars.ok, bg: lightVars.line, min: 3 },
  { name: 'light: .ok text on bg', fg: lightVars.ok, bg: lightVars.bg, min: 4.5 },
  { name: 'light: .wn text on bg', fg: lightVars.wn, bg: lightVars.bg, min: 4.5 },
  { name: 'light: .bd text on bg', fg: lightVars.bd, bg: lightVars.bg, min: 4.5 },

  // Dark mode
  { name: 'dark: fg on bg', fg: darkVars.fg, bg: darkVars.bg, min: 4.5 },
  { name: 'dark: mut on bg', fg: darkVars.mut, bg: darkVars.bg, min: 4.5 },
  { name: 'dark: button.pri (white on ac)', fg: '#ffffff', bg: darkVars.ac, min: 4.5 },
  { name: 'dark: .pill.d (white on ok-bg)', fg: '#ffffff', bg: darkVars['ok-bg'], min: 4.5 },
  { name: 'dark: .toast (white on ok-bg)', fg: '#ffffff', bg: darkVars['ok-bg'], min: 4.5 },
  { name: 'dark: .toast.w (dark on wn)', fg: darkVars.bg, bg: darkVars.wn, min: 4.5 },
  { name: 'dark: .hb help button (white on ac)', fg: '#ffffff', bg: darkVars.ac, min: 4.5 },
  { name: 'dark: .bar i (ok on line)', fg: darkVars.ok, bg: darkVars.line, min: 3 },
  { name: 'dark: .ok text on bg', fg: darkVars.ok, bg: darkVars.bg, min: 4.5 },
  { name: 'dark: .wn text on bg', fg: darkVars.wn, bg: darkVars.bg, min: 4.5 },
  { name: 'dark: .bd text on bg', fg: darkVars.bd, bg: darkVars.bg, min: 4.5 },
];

console.log('Contrast Check Results\n');
let allPass = true;
for (const p of pairs) {
  const result = checkContrast(p.name, p.fg, p.bg, p.min);
  const status = result.pass ? '✅ PASS' : '❌ FAIL';
  if (!result.pass) allPass = false;
  console.log(`${status} ${result.name}: ${result.ratio}:1 (min ${result.min}:1) — fg=${result.fg} bg=${result.bg}`);
}

console.log('\n' + (allPass ? '✅ All contrast checks passed' : '❌ Some contrast checks failed'));
process.exit(allPass ? 0 : 1);