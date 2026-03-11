#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const CONTENT = path.join(ROOT, 'content');
const TEMPLATES = path.join(ROOT, 'templates');
const DATA = path.join(ROOT, 'data');

// --- Helpers ---
function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function readJSON(filePath) {
  return JSON.parse(read(filePath));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirSync(src, dest, exclude) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude && exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// --- Load partials ---
const topbar = read(path.join(TEMPLATES, 'partials', 'topbar.html'));
const footer = read(path.join(TEMPLATES, 'partials', 'footer.html'));

function injectPartials(html) {
  return html
    .replace('{{topbar}}', topbar)
    .replace('{{footer}}', footer);
}

function renderMarkdown(mdContent) {
  return marked.parse(mdContent);
}

// --- Page configs ---
const pages = [
  {
    id: 'motivation',
    template: 'inner.html',
    content: 'motivation.md',
    vars: {
      title: 'Motivation',
      page: 'motivation',
      label: 'Foundation',
      heading: 'What is <span>PPBS</span>?',
      section_label: 'Motivation'
    }
  },
  {
    id: 'publications',
    template: 'inner.html',
    content: 'publications.md',
    vars: {
      title: 'Publications',
      page: 'publications',
      label: 'Research',
      heading: '<span>Published</span> Research',
      section_label: 'Publications'
    }
  },
  {
    id: 'methodology',
    template: 'methodology.html',
    content: 'methodology.md',
    vars: {}
  },
  {
    id: 'constructs',
    template: 'constructs.html',
    content: 'constructs.md',
    vars: {}
  },
  {
    id: 'reports',
    template: 'reports.html',
    content: 'reports.md',
    vars: {}
  },
  {
    id: 'investigators',
    template: 'investigators.html',
    content: 'investigators.md',
    vars: {}
  },
  {
    id: 'get-involved',
    template: 'get-involved.html',
    content: 'get-involved.md',
    vars: {}
  }
];

// --- Build Homepage ---
function buildHomepage() {
  console.log('  Building index.html');
  let template = read(path.join(TEMPLATES, 'index.html'));
  template = injectPartials(template);

  const stats = readJSON(path.join(DATA, 'stats.json'));
  template = template
    .replace('{{stat_interviews}}', stats.interviews)
    .replace('{{stat_constructs}}', stats.constructs)
    .replace('{{stat_datasets}}', stats.datasets)
    .replace('{{stat_cycles}}', stats.cycles);

  const mdFile = path.join(CONTENT, 'index.md');
  if (fs.existsSync(mdFile)) {
    const content = renderMarkdown(read(mdFile));
    template = template.replace('{{content}}', content);
  }

  fs.writeFileSync(path.join(SITE, 'index.html'), template);
}

// --- Build report cards by scanning _site/reports/ subdirectories ---
function titleFromFilename(filename) {
  return filename
    .replace('.html', '')
    .replace(/_comparison$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildReportCards() {
  const reportsDir = path.join(SITE, 'reports');
  if (!fs.existsSync(reportsDir)) return '';

  const groups = [
    { dir: '2016', label: 'PPBS 2016' },
    { dir: '2018', label: 'PPBS 2018' },
    { dir: '2020', label: 'PPBS 2020' },
    { dir: 'comparison', label: 'Cross-Wave Comparisons' }
  ];

  let html = '';

  for (const group of groups) {
    const groupDir = path.join(reportsDir, group.dir);
    if (!fs.existsSync(groupDir)) continue;

    const files = fs.readdirSync(groupDir)
      .filter(f => f.endsWith('.html'))
      .sort();

    if (files.length === 0) continue;

    html += `<h2>${group.label}</h2>\n`;
    html += `    <div class="card-grid">\n`;

    for (const file of files) {
      const title = titleFromFilename(file);
      const href = `reports/${group.dir}/${file}`;
      html += `      <a class="card" href="${href}">
        <h3>${title}</h3>
      </a>\n`;
    }

    html += `    </div>\n`;
  }

  return html;
}

// --- Build team cards from JSON ---
function buildTeamCards() {
  const dataFile = path.join(DATA, 'investigators.json');
  if (!fs.existsSync(dataFile)) return '';

  const team = readJSON(dataFile);
  return team.map(m => {
    const img = m.photo ? `<img src="${m.photo}" alt="${m.name}">` : '';
    const role = m.role ? `<div class="role">${m.role}</div>` : '';
    const aff = m.affiliation ? `<div class="affiliation">${m.affiliation}</div>` : '';
    return `<div class="team-member">
      ${img}
      <h3>${m.name}</h3>
      ${role}
      ${aff}
    </div>`;
  }).join('\n      ');
}

// --- Build construct rows from JSON ---
function buildConstructRows() {
  const dataFile = path.join(DATA, 'constructs.json');
  if (!fs.existsSync(dataFile)) return '';

  const constructs = readJSON(dataFile);
  return constructs.map(c => {
    const waves = (c.waves || []).map(w =>
      `<span class="wave-badge">${w}</span>`
    ).join('');
    const report = c.report_url
      ? `<a href="${c.report_url}" style="color: var(--accent);">View</a>`
      : '';
    return `<tr data-category="${c.category || ''}">
      <td>${c.name}</td>
      <td>${c.category || ''}</td>
      <td><div class="wave-badges">${waves}</div></td>
      <td>${report}</td>
    </tr>`;
  }).join('\n        ');
}

// --- Build inner pages ---
function buildPage(page) {
  console.log(`  Building ${page.id}.html`);
  let template = read(path.join(TEMPLATES, page.template));
  template = injectPartials(template);

  // Inject content
  const mdFile = path.join(CONTENT, page.content);
  if (fs.existsSync(mdFile)) {
    const content = renderMarkdown(read(mdFile));
    template = template.replace('{{content}}', content);
  } else {
    template = template.replace('{{content}}', '');
  }

  // Inject variables
  for (const [key, value] of Object.entries(page.vars)) {
    template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  // Handle conditional blocks {{#key}}...{{/key}}
  template = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, block) => {
    return page.vars[key] ? block : '';
  });

  // Inject data-driven content
  if (page.id === 'reports') {
    template = template.replace('{{report_cards}}', buildReportCards());
  }
  if (page.id === 'investigators') {
    template = template.replace('{{team_cards}}', buildTeamCards());
  }
  if (page.id === 'constructs') {
    template = template.replace('{{construct_rows}}', buildConstructRows());
  }

  // Clean up any remaining template tags
  template = template.replace(/\{\{[^}]+\}\}/g, '');

  fs.writeFileSync(path.join(SITE, `${page.id}.html`), template);
}

// --- Inject L6 shell into existing HTML pages (methods, reports) ---
function injectShellIntoSubdir(subdir, activePage) {
  const dir = path.join(SITE, subdir);
  if (!fs.existsSync(dir)) return;

  function processDir(currentDir, depth) {
    const relPrefix = '../'.repeat(depth);

    let subdirTopbar = topbar
      .replace(/href="(?!http)(?!#)([^"]+)"/g, `href="${relPrefix}$1"`);
    if (activePage) {
      subdirTopbar = subdirTopbar.replace(
        `data-page="${activePage}"`,
        `data-page="${activePage}" class="active"`
      );
    }

    const shellCss = `<link rel="stylesheet" href="${relPrefix}css/l6.css">`;
    const shellJs = `<script src="${relPrefix}js/nav.js"></script>`;
    const shellStyle = `
<style>
  .l6-shell-topbar { margin-bottom: 0; }
  .l6-shell-footer { margin-top: 40px; }
  body { background: var(--paper, #f2f0ec); }
</style>`;

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // Skip asset/snippet directories that aren't standalone pages
        if (['assets', 'items'].includes(entry.name) || entry.name.endsWith('_files')) continue;
        processDir(path.join(currentDir, entry.name), depth + 1);
        continue;
      }
      if (!entry.name.endsWith('.html')) continue;

      const filePath = path.join(currentDir, entry.name);
      let html = read(filePath);

      // Skip if already has L6 navigation (injected or native from Quarto)
      if (html.includes('l6-shell-topbar') || html.includes('l6-topbar')) continue;

      // Inject CSS into <head>
      html = html.replace('</head>', `${shellCss}${shellStyle}\n</head>`);

      // Inject topbar after <body...>
      html = html.replace(/(<body[^>]*>)/, `$1\n<div class="l6-shell-topbar">${subdirTopbar}</div>`);

      // Inject footer + JS before </body>
      html = html.replace('</body>', `<div class="l6-shell-footer">${footer}</div>\n${shellJs}\n</body>`);

      const relPath = path.relative(path.join(SITE), filePath);
      fs.writeFileSync(filePath, html);
      console.log(`  Injected L6 shell into ${relPath}`);
    }
  }

  processDir(dir, 1);
}

// --- Main build ---
function build() {
  console.log('Building PPBS site...');

  // Ensure _site directory
  ensureDir(SITE);

  // Copy static assets
  console.log('  Copying static assets...');
  copyDirSync(path.join(ROOT, 'css'), path.join(SITE, 'css'));
  copyDirSync(path.join(ROOT, 'js'), path.join(SITE, 'js'), ['build.js']);
  if (fs.existsSync(path.join(ROOT, 'img'))) {
    copyDirSync(path.join(ROOT, 'img'), path.join(SITE, 'img'));
  }

  // Copy images from Website root
  for (const img of ['logo_sm.png', 'banner_sm.png', 'ppbs_banner.png', 'ppbs_head_logo.png']) {
    const src = path.join(ROOT, img);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(SITE, 'img', img));
    }
  }

  // Remove old Quarto-generated files that are being replaced
  const oldFiles = ['contact.html', 'published_research.html', 'robots.txt', 'sitemap.xml'];
  for (const f of oldFiles) {
    const p = path.join(SITE, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  Removed old ${f}`);
    }
  }

  // Build homepage
  buildHomepage();

  // Build inner pages
  for (const page of pages) {
    buildPage(page);
  }

  // Note: _site/reports/ and _site/methods/ are preserved (not deleted)
  console.log('  Preserving existing reports/ and methods/ directories');

  // Inject L6 shell into methods and reports pages
  injectShellIntoSubdir('methods', 'methodology');
  injectShellIntoSubdir('reports', 'reports');

  console.log('Done! Output in _site/');
}

build();
