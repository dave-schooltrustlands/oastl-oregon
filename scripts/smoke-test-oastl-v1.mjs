#!/usr/bin/env node
// OASTL v1 smoke tests.
//
// Two modes:
//   1. Local dist mode (default): asserts against ./dist after `npm run build`.
//   2. Live mode: pass --live (or set OASTL_SMOKE_LIVE=1) and OASTL_SMOKE_URL
//      to hit a deployed origin (e.g. https://oastl-oregon.drdavesullivan.workers.dev).
//
// Assertions O.A–O.J per the v1 handoff:
//   O.A  Homepage 200 + "Schoolchildren have standing"
//   O.B  Homepage contains "January 28, 2026"
//   O.C  Homepage contains the case name "Advocates for School Trust Lands v. State of Oregon"
//   O.D  Legal Desk contains "Natalie Scott" and "The Scott Law Group"
//   O.E  Briefing Room references "Common School Fund" and "Elliott State Forest"
//   O.F  Coalition Table contains "Margaret Bird" and "Dave Sullivan" and "Bob Zybach"
//   O.G  Join page contains all four membership-class strings (Class A,B,C,D)
//   O.H  Founding Texts band contains "Oregon’s Constitutional Duties to Schools"
//   O.I  .eai-utility-bar element exists at top of <body> on every page
//   O.J  Cross-bridge links to schooltrusts.net, schooltrustlands.net, orww.org, eighthanchor.org

import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');

const args = new Set(process.argv.slice(2));
const LIVE = args.has('--live') || process.env.OASTL_SMOKE_LIVE === '1';
const LIVE_URL = process.env.OASTL_SMOKE_URL || 'https://oastl-oregon.drdavesullivan.workers.dev';

const results = [];
const pass = (id, msg) => results.push({ id, ok: true, msg });
const fail = (id, msg) => results.push({ id, ok: false, msg });

const routes = {
  '/':                  'index.html',
  '/legal-desk/':       'legal-desk/index.html',
  '/briefing-room/':    'briefing-room/index.html',
  '/coalition-table/':  'coalition-table/index.html',
  '/join/':             'join/index.html',
  '/founding-texts/':   'founding-texts/index.html',
  '/field-notes/':      'field-notes/index.html',
  '/donate/':           'donate/index.html',
};

async function fetchPage(path) {
  if (LIVE) {
    const url = new URL(path, LIVE_URL).toString();
    const res = await fetch(url);
    const body = await res.text();
    return { status: res.status, body, url };
  }
  const file = routes[path];
  if (!file) throw new Error(`Unknown route: ${path}`);
  const body = await readFile(join(DIST, file), 'utf8');
  return { status: 200, body, url: join(DIST, file) };
}

const contains = (body, needle) => body.includes(needle);

async function run() {
  // Pre-load all pages
  const pages = {};
  for (const p of Object.keys(routes)) {
    pages[p] = await fetchPage(p);
  }

  const home    = pages['/'];
  const legal   = pages['/legal-desk/'];
  const brief   = pages['/briefing-room/'];
  const board   = pages['/coalition-table/'];
  const join    = pages['/join/'];
  const founding = pages['/founding-texts/'];

  // O.A
  if (home.status === 200 && contains(home.body, 'Schoolchildren have standing'))
    pass('O.A', 'homepage 200 + headline present');
  else
    fail('O.A', `status=${home.status}, headline=${contains(home.body, 'Schoolchildren have standing')}`);

  // O.B
  if (contains(home.body, 'January 28, 2026'))
    pass('O.B', '"January 28, 2026" present on homepage');
  else
    fail('O.B', 'date string missing from homepage');

  // O.C
  if (contains(home.body, 'Advocates for School Trust Lands v. State of Oregon'))
    pass('O.C', 'case name present on homepage');
  else
    fail('O.C', 'case name missing from homepage');

  // O.D
  const dNat = contains(legal.body, 'Natalie Scott');
  const dFirm = contains(legal.body, 'The Scott Law Group');
  if (dNat && dFirm)
    pass('O.D', 'Legal Desk names lead counsel + firm');
  else
    fail('O.D', `Natalie Scott=${dNat}, Scott Law Group=${dFirm}`);

  // O.E
  const eCsf = contains(brief.body, 'Common School Fund');
  const eEsf = contains(brief.body, 'Elliott State Forest');
  if (eCsf && eEsf)
    pass('O.E', 'Briefing Room references CSF + Elliott');
  else
    fail('O.E', `CSF=${eCsf}, Elliott=${eEsf}`);

  // O.F
  const fMB = contains(board.body, 'Margaret Bird');
  const fDS = contains(board.body, 'Dave Sullivan');
  const fBZ = contains(board.body, 'Bob Zybach');
  if (fMB && fDS && fBZ)
    pass('O.F', 'Coalition Table names all three confirmed directors');
  else
    fail('O.F', `MB=${fMB}, DS=${fDS}, BZ=${fBZ}`);

  // O.G — all four class strings on Join
  const classes = ['Class A', 'Class B', 'Class C', 'Class D'];
  const missing = classes.filter((c) => !contains(join.body, c));
  if (missing.length === 0)
    pass('O.G', 'Join page lists all four membership classes');
  else
    fail('O.G', `missing classes: ${missing.join(', ')}`);

  // O.H
  const hBook = contains(founding.body, 'Oregon’s Constitutional Duties to Schools')
             || contains(founding.body, "Oregon's Constitutional Duties to Schools");
  if (hBook)
    pass('O.H', 'Founding Texts surfaces the OASTL founding book');
  else
    fail('O.H', 'book title missing from Founding Texts page');

  // O.I — no legacy utility bar on public pages
  const utilityBarIssues = [];
  for (const [route, page] of Object.entries(pages)) {
    if (contains(page.body, 'eai-utility-bar')) {
      utilityBarIssues.push(`${route}: legacy utility bar still present`);
    }
  }
  if (utilityBarIssues.length === 0)
    pass('O.I', 'legacy utility bar absent from every page');
  else
    fail('O.I', utilityBarIssues.join('; '));

  // O.J — top header stays on-site
  const forbiddenHeaderDomains = ['schooltrusts.net', 'schooltrustlands.net', 'orww.org', 'eighthanchor.org', 'eighthanchor.net'];
  const headerLinkIssues = [];
  for (const [route, page] of Object.entries(pages)) {
    const headerStart = page.body.indexOf('<header');
    const headerEnd = page.body.indexOf('</header>', headerStart);
    if (headerStart < 0 || headerEnd < 0) {
      headerLinkIssues.push(`${route}: header not found`);
      continue;
    }
    const headerHtml = page.body.slice(headerStart, headerEnd);
    const found = forbiddenHeaderDomains.filter((d) => headerHtml.includes(d));
    if (found.length > 0) headerLinkIssues.push(`${route}: header links ${found.join(', ')}`);
  }
  if (headerLinkIssues.length === 0)
    pass('O.J', 'top header has no off-site network links');
  else
    fail('O.J', headerLinkIssues.join('; '));

  // Report
  let okAll = true;
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    console.log(`  ${mark} ${r.id}  ${r.msg}`);
    if (!r.ok) okAll = false;
  }
  console.log('');
  console.log(`  ${results.filter((r) => r.ok).length} / ${results.length} assertions passed (${LIVE ? `LIVE ${LIVE_URL}` : 'LOCAL dist'})`);
  process.exit(okAll ? 0 : 1);
}

run().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exit(2);
});
