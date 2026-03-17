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
    .replace('{{stat_cycles}}', stats.cycles)
    .replace('{{stat_countries}}', stats.countries);

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
    { dir: 'comparison', label: 'Multi-Year Comparisons' }
  ];

  let html = '';

  for (const group of groups) {
    const groupDir = path.join(reportsDir, group.dir);
    if (!fs.existsSync(groupDir)) continue;

    const files = fs.readdirSync(groupDir)
      .filter(f => f.endsWith('.html'))
      .sort();

    if (files.length === 0) continue;

    html += `<details class="report-group">\n`;
    html += `  <summary><h2>${group.label}</h2></summary>\n`;
    html += `    <div class="card-grid">\n`;

    for (const file of files) {
      const title = titleFromFilename(file);
      const href = `reports/${group.dir}/${file}`;
      html += `      <a class="card" href="${href}">
        <h3>${title}</h3>
      </a>\n`;
    }

    html += `    </div>\n`;
    html += `</details>\n`;
  }

  return html;
}

// --- Social media icon SVGs ---
const socialIcons = {
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  scholar: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>',
  website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  orcid: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-3.903-3.722z"/></svg>'
};

// --- Build team cards from JSON ---
function buildTeamCards() {
  const dataFile = path.join(DATA, 'investigators.json');
  if (!fs.existsSync(dataFile)) return '';

  const team = readJSON(dataFile);

  // Define group order
  const groupOrder = ['Researchers', 'Collaborators', 'Past Researchers', 'Funders', 'Mentors'];

  // Group members
  const groups = {};
  for (const m of team) {
    const g = m.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(m);
  }

  // Sort each group alphabetically, with sort_last members at end
  for (const g of Object.keys(groups)) {
    groups[g].sort((a, b) => {
      if (a.sort_last && !b.sort_last) return 1;
      if (!a.sort_last && b.sort_last) return -1;
      return a.name.localeCompare(b.name);
    });
  }

  let html = '';
  for (const groupName of groupOrder) {
    const members = groups[groupName];
    if (!members || members.length === 0) continue;

    html += `<h2 class="team-group-heading">${groupName}</h2>\n`;
    html += `<div class="team-grid">\n`;

    for (const m of members) {
      const img = m.photo ? `<img src="${m.photo}" alt="${m.name}">` : '';
      const aff = m.affiliation ? `<div class="affiliation">${m.affiliation}</div>` : '';

      let links = '';
      if (m.contact || m.profile) {
        links = '<div class="social-links">';
        if (m.contact) {
          const icon = socialIcons[m.contact.icon] || socialIcons.website;
          const label = m.contact.icon === 'linkedin' ? 'LinkedIn' : 'Contact';
          links += `<a href="${m.contact.url}" target="_blank" rel="noopener" title="${label}" class="social-icon">${icon}</a>`;
        }
        if (m.profile) {
          const icon = socialIcons[m.profile.icon] || socialIcons.website;
          const label = m.profile.icon === 'scholar' ? 'Google Scholar' : m.profile.icon === 'website' ? 'Website' : 'Profile';
          links += `<a href="${m.profile.url}" target="_blank" rel="noopener" title="${label}" class="social-icon">${icon}</a>`;
        }
        links += '</div>';
      }

      html += `      <div class="team-member">
        ${img}
        <h3>${m.name}</h3>
        ${aff}
        ${links}
      </div>\n`;
    }

    html += `</div>\n`;
  }

  return html;
}

// --- Build construct rows from JSON ---
function waveToYear(wave) {
  if (wave.startsWith('2018')) return '2018';
  return wave; // "2016", "2020"
}

function buildConstructRows() {
  const dataFile = path.join(DATA, 'constructs.json');
  if (!fs.existsSync(dataFile)) return '';

  const reportsDir = path.join(SITE, 'reports');
  const constructs = readJSON(dataFile);
  return constructs.map(c => {
    const waves = (c.waves || []).map(w => {
      if (c.report_base) {
        const year = waveToYear(w);
        const reportFile = path.join(reportsDir, year, `${c.report_base}.html`);
        if (fs.existsSync(reportFile)) {
          return `<a href="reports/${year}/${c.report_base}.html" class="wave-badge wave-badge-link">${w}</a>`;
        }
      }
      return `<span class="wave-badge">${w}</span>`;
    }).join('');

    let report = '';
    if (c.report_base) {
      const compFile = path.join(reportsDir, 'comparison', `${c.report_base}_comparison.html`);
      if (fs.existsSync(compFile)) {
        report = `<a href="reports/comparison/${c.report_base}_comparison.html" style="color: var(--accent);">Multi-year</a>`;
      }
    }

    return `<tr data-category="${c.category || ''}">
      <td>${c.name}</td>
      <td>${c.category || ''}</td>
      <td><div class="wave-badges">${waves}</div></td>
      <td>${report}</td>
    </tr>`;
  }).join('\n        ');
}

// --- Build survey cards from JSON ---
function buildSurveyCards() {
  const dataFile = path.join(DATA, 'surveys.json');
  if (!fs.existsSync(dataFile)) return '';

  const surveys = readJSON(dataFile);
  let html = '<div class="card-grid">\n';

  for (const s of surveys) {
    const reportExists = fs.existsSync(path.join(SITE, s.report));
    const tag = reportExists ? 'a' : 'div';
    const href = reportExists ? ` href="${s.report}"` : '';
    html += `      <${tag} class="card"${href}>
        <div class="card-category">${s.category}</div>
        <h3>${s.title}</h3>
        <div class="card-desc">${s.description}</div>
      </${tag}>\n`;
  }

  html += '    </div>';
  return html;
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
  if (page.id === 'methodology') {
    template = template.replace('{{survey_cards}}', buildSurveyCards());
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
  .l6-shell-topbar .topbar .mark { background: transparent; color: inherit; }
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
