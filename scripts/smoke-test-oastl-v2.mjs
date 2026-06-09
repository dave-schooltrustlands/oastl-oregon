#!/usr/bin/env node
// OASTL v2 smoke tests.
//
// Inherits v1 assertions O.A–O.J and adds v2.A–v2.M for the comprehensive
// port from legacy oastl.org.
//
// Two modes:
//   1. Local dist mode (default): asserts against ./dist after `npm run build`.
//   2. Live mode: pass --live (or set OASTL_SMOKE_LIVE=1) and OASTL_SMOKE_URL.

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
  '/404':               '404.html',
  '/legal-desk/':       'legal-desk/index.html',
  '/briefing-room/':    'briefing-room/index.html',
  '/coalition-table/':  'coalition-table/index.html',
  '/join/':             'join/index.html',
  '/founding-texts/':   'founding-texts/index.html',
  '/field-notes/':      'field-notes/index.html',
  '/donate/':           'donate/index.html',
  '/students/':         'students/index.html',
  '/governance/':       'governance/index.html',
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
const containsInOrder = (body, needles) => {
  let at = 0;
  for (const needle of needles) {
    const next = body.indexOf(needle, at);
    if (next < 0) return false;
    at = next + needle.length;
  }
  return true;
};
// Helper: check for typographic or straight quote variants
const containsLoose = (body, needle) => {
  const variants = [
    needle,
    needle.replace(/'/g, '’'),
    needle.replace(/’/g, "'"),
    needle.replace(/"/g, '“').replace(/"/g, '”'),
  ];
  return variants.some((v) => body.includes(v));
};

async function run() {
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
  const donate  = pages['/donate/'];
  const students = pages['/students/'];
  const governance = pages['/governance/'];

  // ===== v1 assertions =====

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

  // O.G
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

  // O.I
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

  // O.J
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

  // O.K — public contact email and footer remain simple
  const footerIssues = [];
  for (const [route, page] of Object.entries(pages)) {
    if (contains(page.body, 'info@oastl.org')) {
      footerIssues.push(`${route}: old info@ contact still present`);
    }
    const footerStart = page.body.indexOf('<footer');
    const footerEnd = page.body.indexOf('</footer>', footerStart);
    if (footerStart < 0 || footerEnd < 0) {
      footerIssues.push(`${route}: footer not found`);
      continue;
    }
    const footerHtml = page.body.slice(footerStart, footerEnd);
    if (footerHtml.includes('>Governance<') || footerHtml.includes('>Citation<')) {
      footerIssues.push(`${route}: old Governance/Citation footer block present`);
    }
  }
  if (footerIssues.length === 0)
    pass('O.K', 'footer uses current contact email and no Governance/Citation blocks');
  else
    fail('O.K', footerIssues.join('; '));

  // ===== v2 assertions =====

  // v2.A — All 5 active board + David Gould In Memoriam
  const boardNames = ['Dave Sullivan', 'Barb Sullivan', 'Laura D. Cooper', 'Margaret Bird', 'Bob Zybach', 'David Gould'];
  const missingBoard = boardNames.filter((n) => !contains(board.body, n));
  const hasMemoriam = contains(board.body, 'In Memoriam') && contains(board.body, '1942–2024');
  if (missingBoard.length === 0 && hasMemoriam)
    pass('v2.A', 'Coalition Table lists all 5 active board + David Gould In Memoriam');
  else
    fail('v2.A', `missingBoard=${missingBoard.join(', ')}, memoriam=${hasMemoriam}`);

  // v2.B — Daniel Zene Crowe + two-track strategy
  const hasCrowe = contains(legal.body, 'Daniel Zene Crowe');
  const hasTwoTracks = contains(legal.body, 'The Strategy: Two Tracks')
                    && contains(legal.body, 'The constitutional challenge')
                    && contains(legal.body, 'The accounting investigation');
  if (hasCrowe && hasTwoTracks)
    pass('v2.B', 'Legal Desk contains Daniel Zene Crowe + two-track strategy');
  else
    fail('v2.B', `Crowe=${hasCrowe}, twoTracks=${hasTwoTracks}`);

  // v2.C — Key documents: 5 docs + at least one Google Drive URL
  const evidenceTitles = [
    'Defendants’ Answer',
    'First AMENDED Complaint',
    'The Full Case',
    'Letter Opinion Granting Standing',
    'Letter Opinion Denying',
  ];
  const missingEvidence = evidenceTitles.filter((t) => !contains(legal.body, t));
  const hasDriveLink = contains(legal.body, 'drive.google.com/file/d/');
  if (missingEvidence.length === 0 && hasDriveLink)
    pass('v2.C', 'Legal Desk key documents — all 5 docs + Drive URLs present');
  else
    fail('v2.C', `missing=${missingEvidence.join(', ')}, drive=${hasDriveLink}`);

  // v2.D — Richardson Trust mapping table
  const richardson = [
    'Richardson Trust',
    'Beaver State Bank',
    'Beaver Consultants',
    'Oregon Vineyard Management',
  ];
  const missingRich = richardson.filter((s) => !contains(legal.body, s));
  if (missingRich.length === 0)
    pass('v2.D', 'Legal Desk contains Richardson Trust mapping');
  else
    fail('v2.D', `missing: ${missingRich.join(', ')}`);

  // v2.E — Bill Lansing + Menasha
  const hasLansing = contains(brief.body, 'Bill Lansing');
  const hasMenasha = contains(brief.body, 'Menasha Forest Products');
  if (hasLansing && hasMenasha)
    pass('v2.E', 'Briefing Room contains Bill Lansing + Menasha Forest Products');
  else
    fail('v2.E', `Lansing=${hasLansing}, Menasha=${hasMenasha}`);

  // v2.F — Both YouTube iframes
  const hasBirthright = contains(brief.body, 'MuHxwN4W2Qk');
  const hasMatter = contains(brief.body, '6EUBwF7gKgk');
  if (hasBirthright && hasMatter)
    pass('v2.F', 'Briefing Room embeds both YouTube videos (Birthright + Matter of Trust)');
  else
    fail('v2.F', `Birthright=${hasBirthright}, MatterOfTrust=${hasMatter}`);

  // v2.G — Students page contains "Corvallis Effect"
  if (contains(students.body, 'Corvallis Effect'))
    pass('v2.G', 'Students page contains "Corvallis Effect"');
  else
    fail('v2.G', 'Students page missing "Corvallis Effect"');

  // v2.H — Join page contains at least 4 distinct testimonial quotes
  const testimonialFragments = [
    'transfer to OSU',
    'forester over 6 years',
    'Jerry Phillips is rolling over',
    'required by law for the state',
    'grandchildren in the Oregon Public School System',
    'full market value',
  ];
  const foundTestimonials = testimonialFragments.filter((f) => contains(join.body, f));
  if (foundTestimonials.length >= 4)
    pass('v2.H', `Join page has ${foundTestimonials.length}/6 member testimonials`);
  else
    fail('v2.H', `only ${foundTestimonials.length}/6 testimonial fragments found`);

  // v2.I — Donate page Donorbox link
  if (contains(donate.body, 'donorbox.org/support-oastl'))
    pass('v2.I', 'Donate page links to Donorbox');
  else
    fail('v2.I', 'Donate page missing Donorbox URL');

  // v2.J — Judge Andrew Combs quote
  if (contains(donate.body, 'Judge Andrew Combs') || contains(donate.body, 'Andrew Combs'))
    pass('v2.J', 'Donate page contains Judge Andrew Combs quote');
  else
    fail('v2.J', 'Donate page missing Judge Andrew Combs');

  // v2.K — Mailing address
  if (contains(donate.body, '12875 Kings Valley Highway'))
    pass('v2.K', 'Donate page contains mailing address');
  else
    fail('v2.K', 'Donate page missing mailing address');

  // v2.L — Governance page with both PDFs
  const hasBylawsUrl = contains(governance.body, '1J2i-7CbrJoqaahUQziqH-ryoDRV0lJcl');
  const hasIrsUrl = contains(governance.body, '1bHCBvjLWWFlg0PmIJj_qU5XWQAGWNEpl');
  if (hasBylawsUrl && hasIrsUrl)
    pass('v2.L', 'Governance page links to Bylaws + IRS Determination Letter');
  else
    fail('v2.L', `Bylaws=${hasBylawsUrl}, IRS=${hasIrsUrl}`);

  // v2.M — Founding Texts: real PDF + Amazon URLs
  const hasBookPdf = contains(founding.body, '1E1IhBgk8fdtKnQd2FqkFqE9V1xduYd0u');
  const hasAmazon = contains(founding.body, 'a.co/d/8PpB6f8');
  if (hasBookPdf && hasAmazon)
    pass('v2.M', 'Founding Texts links to real Drive PDF + Amazon URL');
  else
    fail('v2.M', `PDF=${hasBookPdf}, Amazon=${hasAmazon}`);

  // v2.N — Counsel and board portraits stay mapped to the right people.
  // The source filenames predate the current portrait mapping, so this test
  // intentionally checks the page sections rather than trusting asset names.
  const portraitChecks = [
    ['Natalie section', legal.body, ['Natalie Scott — The Scott Law Group', 'src="/images/board/laura-cooper-attorney.png"', 'alt="Natalie Scott"']],
    ['Daniel section', legal.body, ['Daniel Zene Crowe — leading the expanded legal work', 'src="/images/board/natalie-scott.png"', 'alt="Daniel Zene Crowe"']],
    ['Laura legal section', legal.body, ['Laura D. Cooper, OSB# 863589', 'src="/images/board/daniel-crowe.png"', 'alt="Laura D. Cooper"']],
    ['Laura board card', board.body, ['src="/images/board/daniel-crowe.png"', 'alt="Laura D. Cooper"', 'Laura D. Cooper']],
  ];
  const badPortraits = portraitChecks
    .filter(([, body, parts]) => !containsInOrder(body, parts))
    .map(([label]) => label);
  if (badPortraits.length === 0)
    pass('v2.N', 'Legal Desk + board portrait mapping is correct');
  else
    fail('v2.N', `portrait mapping failed: ${badPortraits.join(', ')}`);

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
