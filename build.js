/*
  build.js — Chèn nội dung từ content/*.json THẲNG vào HTML lúc Netlify build,
  để khi khách tải trang, HTML đã có nội dung mới nhất — không phải đợi
  content-loader.js fetch JSON nên không còn nháy nội dung cũ.

  Phần động (reviews, carousel, concept gallery, gallery mosaic, danh sách
  dịch vụ...) vẫn để content-loader.js xử lý — chỉ chèn vào HTML những
  phần TĨNH dễ nháy: hero, menu, footer, header bảng giá, các thẻ giá.
*/

const fs = require('fs');
const path = require('path');
let cheerio;
try {
  cheerio = require('cheerio');
} catch (e) {
  console.error('⚠ Không nạp được cheerio:', e.message);
  console.error('   Bỏ qua chèn nội dung tĩnh — content-loader.js sẽ chạy như cũ.');
  process.exit(0);
}

const ROOT = __dirname;

function readJson(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  catch (e) { console.warn('  ⚠ Không đọc được', rel, '-', e.message); return null; }
}

const data = {
  homepage: readJson('content/homepage.json') || {},
  pricing:  readJson('content/pricing.json')  || {},
  services: readJson('content/services.json') || {},
  contact:  readJson('content/contact.json')  || {},
  menu:     readJson('content/menu.json')     || {},
  footer:   readJson('content/footer.json')   || {},
  settings: readJson('content/settings.json') || {},
};

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]
  ));
}

/* ---------- MENU ---------- */
function applyMenu($) {
  const items = (data.menu && data.menu.items) || [];
  if (!items.length) return;
  const $nav = $('.nav-links');
  if (!$nav.length) return;
  // Lấy class active hiện tại để giữ
  const activeHref = $nav.find('a.active').attr('href') || '';
  $nav.empty();
  items.forEach(it => {
    if (!it || !it.url) return;
    const classes = [];
    if (it.cta) classes.push('nav-cta');
    if (it.url === activeHref) classes.push('active');
    const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
    const lbl = escHtml(it.label || '');
    const suffix = it.cta && !/→/.test(it.label || '') ? '' : '';
    $nav.append(`<a href="${escHtml(it.url)}"${cls}>${lbl}${suffix}</a>`);
  });
  // Mobile menu (mm) cũng dùng cùng menu
  const $mm = $('#mm');
  if ($mm.length) {
    $mm.empty();
    items.forEach(it => {
      if (!it || !it.url) return;
      const lbl = escHtml(it.label || '');
      $mm.append(`<a href="${escHtml(it.url)}">${lbl}${it.cta ? ' →' : ''}</a>`);
    });
  }
}

/* ---------- FOOTER ---------- */
function applyFooter($) {
  const f = data.footer || {};
  if (f.tagline)         $('[data-ft="tagline"]').text(f.tagline);
  if (f.services_title)  $('[data-ft="services-title"]').text(f.services_title);
  if (f.contact_title)   $('[data-ft="contact-title"]').text(f.contact_title);
  if (f.copyright)       $('[data-ft="copyright"]').text(f.copyright);
  if (Array.isArray(f.services)) {
    const $ul = $('[data-ft="services"]');
    if ($ul.length) {
      $ul.empty();
      f.services.forEach(s => {
        if (!s) return;
        $ul.append(`<li><a href="${escHtml(s.url || '#')}">${escHtml(s.label || '')}</a></li>`);
      });
    }
  }
}

/* ---------- HOMEPAGE HERO ---------- */
function applyHomepageHero($) {
  const h = data.homepage && data.homepage.hero;
  if (!h) return;
  if (h.eyebrow) $('.hero .eyebrow').text(h.eyebrow);
  if (h.title) {
    let html;
    if (h.highlight && h.title.indexOf(h.highlight) >= 0) {
      const i = h.title.indexOf(h.highlight);
      html = escHtml(h.title.slice(0, i))
           + '<em>' + escHtml(h.highlight) + '</em>'
           + escHtml(h.title.slice(i + h.highlight.length));
    } else {
      html = escHtml(h.title);
    }
    $('.hero h1').html(html);
  }
  if (h.lead) $('.hero p.lead').text(h.lead);
  if (h.btn1_label) $('[data-hero="btn1"]').contents().filter(function(){return this.type==='text';}).remove();
  if (h.btn1_label) $('[data-hero="btn1"]').text(h.btn1_label);
  if (h.btn1_url)   $('[data-hero="btn1"]').attr('href', h.btn1_url);
  if (h.btn2_label) $('[data-hero="btn2"]').text(h.btn2_label);
  if (h.btn2_url)   $('[data-hero="btn2"]').attr('href', h.btn2_url);
  if (h.image) {
    const $ph = $('.hero-bg .ph');
    if ($ph.length) {
      $ph.attr('style',
        "background:linear-gradient(rgba(26,23,20,0.5),rgba(26,23,20,0.62)),"+
        "url('"+ escHtml(h.image) +"') center/cover no-repeat"
      );
    }
  }
}

/* ---------- BẢNG GIÁ ---------- */
function applyPricing($) {
  const p = data.pricing || {};
  if (p.header) {
    if (p.header.eyebrow) $('[data-edit="pricing.eyebrow"]').text(p.header.eyebrow);
    if (p.header.title)   $('[data-edit="pricing.title"]').text(p.header.title);
    if (p.header.sub)     $('[data-edit="pricing.sub"]').text(p.header.sub);
    if (p.header.note)    $('[data-edit="pricing.note"]').text(p.header.note);
  }
  const $grid = $('.pricing');
  if (!$grid.length) return;
  const pks = Array.isArray(p.packages) ? p.packages : [];
  if (!pks.length) return;
  $grid.empty();
  pks.forEach(pk => {
    pk = pk || {};
    const feats = Array.isArray(pk.features) ? pk.features.map(f => {
      const t = (f && f.item !== undefined) ? f.item : f;
      return t ? `<li>${escHtml(t)}</li>` : '';
    }).join('') : '';
    const badge = pk.featured
      ? `<div class="badge-pop">${escHtml(pk.badge || 'Phổ biến nhất')}</div>` : '';
    const was  = pk.was  ? `<span class="was">${escHtml(pk.was)}</span>` : '';
    const save = pk.save ? `<span class="save">${escHtml(pk.save)}</span>` : '';
    const tag  = (pk.tag !== undefined && pk.tag !== null) ? escHtml(pk.tag) : 'Concept';
    const name = escHtml(pk.name || '').replace(/\n/g, '<br/>');
    const now  = pk.now ? `<span class="now">${escHtml(pk.now)}</span>` : '';
    const btnL = escHtml(pk.btn_label || 'Đặt gói này →');
    const btnU = escHtml(pk.btn_url   || '/lien-he/');
    const cls  = 'price-card' + (pk.featured ? ' featured' : '');
    $grid.append(
      `<div class="${cls}">`
      + badge
      + (tag ? `<div class="pk">${tag}</div>` : '')
      + `<h3>${name}</h3>`
      + `<div class="price">${now}${was}</div>`
      + save
      + `<ul>${feats}</ul>`
      + `<a class="btn btn-gold" href="${btnU}">${btnL}</a>`
      + `</div>`
    );
  });
}

/* ---------- DUYỆT TẤT CẢ HTML CHÍNH ---------- */
function processHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  applyMenu($);
  applyFooter($);
  if (filePath === path.join(ROOT, 'index.html')) applyHomepageHero($);
  if (filePath === path.join(ROOT, 'bang-gia/index.html')) applyPricing($);
  fs.writeFileSync(filePath, $.html());
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Bỏ qua các thư mục không phải nội dung chính
      if (['node_modules', 'admin', '.git', 'netlify', 'content'].includes(e.name)) continue;
      // Trang khách-chọn-ảnh không dùng content-loader / không có nav-links chuẩn -> bỏ qua
      if (e.name === 'khachhangchonanh') continue;
      walk(p);
    } else if (e.name.endsWith('.html')) {
      try {
        console.log('  ✓', path.relative(ROOT, p));
        processHtml(p);
      } catch (err) {
        console.error('  ✗ Lỗi xử lý', p, err.message);
      }
    }
  }
}

console.log('🔧 Đang chèn nội dung tĩnh vào HTML...');
walk(ROOT);
console.log('✅ Build xong.');
