/* Hello Chụp Ảnh — nạp nội dung & giao diện động (sửa qua /admin) */
(function(){
  /* Đánh dấu body.cms-ready sau khi các fetch JSON đã có thời gian xong,
     để style.css hiện các phần đã ẩn ra (chống nhấp nháy nội dung cũ). */
  function _markCmsReady(){ try{ if(document.body) document.body.classList.add('cms-ready'); }catch(e){} }
  setTimeout(_markCmsReady, 500);
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') { setTimeout(_markCmsReady, 50); }
    else { window.addEventListener('load', function(){ setTimeout(_markCmsReady, 50); }); }
  }

  var REPO="hellochupanh/hellochupanh-web", BRANCH="main";
  /* Đọc nội dung THẲNG từ web (Netlify) để sửa xong thấy ngay sau khi build (~1 phút),
     không bị kẹt bộ nhớ đệm 5 phút của GitHub raw. */
  function raw(p){ return "/"+String(p).replace(/^\//,"")+"?t="+Date.now(); }
  function resolveImg(p){ if(!p) return ""; if(/^https?:/.test(p)) return p; return "/"+String(p).replace(/^\//,""); }
  function getJSON(path){ return fetch(raw(path)).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function setText(sel,val){ if(val==null) return; document.querySelectorAll(sel).forEach(function(el){ el.textContent=val; }); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]); }); }
  function nl2br(s){ return esc(s).replace(/\n/g,"<br/>"); }
  /* tô đậm 1 cụm chữ bằng màu nhấn (highlight) */
  function hl(text, word, openTag, closeTag){
    var t=esc(text); if(!word) return t;
    var w=esc(word); var i=t.indexOf(w);
    if(i<0) return t;
    return t.slice(0,i)+openTag+w+closeTag+t.slice(i+w.length);
  }

  /* ---- Chèn CSS cho phần mới (đánh giá + nút MXH) — đảm bảo áp dụng dù style.css bị cache ---- */
  (function(){
    var css=".reviews-sec{background:#f3ece1}"
      +".reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-bottom:6px}"
      +".review-card{background:#fff;border-radius:16px;padding:26px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.05)}"
      +".rv-text{color:#4a443b;font-size:15.5px;line-height:1.7;font-style:italic;margin-bottom:14px}"
      +".rv-name{font-family:var(--serif);font-weight:700;color:var(--gold-dark)}"
      +".rv-img{width:100%;border-radius:10px;margin-bottom:14px;display:block}"
      +"@media(max-width:760px){.reviews-grid{grid-template-columns:1fr}}"
      +".fc-ig{background:radial-gradient(circle at 30% 110%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}"
      +".fc-tt{background:#111}"
      +".rv-stars{color:var(--gold);letter-spacing:2px;font-size:15px;margin-bottom:10px}"
      +".nav-links{flex:1;justify-content:center}"
      +".nav-social{display:flex;gap:14px;align-items:center}"
      +".nav-social a{color:var(--ink);display:inline-flex;align-items:center;transition:color .15s}"
      +".nav-social a:hover{color:var(--gold-dark)}"
      +".nav-social svg{width:20px;height:20px;display:block}"
      +"@media(max-width:900px){.nav-social{display:none}}"
      +".logos-row{display:flex;flex-wrap:wrap;gap:34px;align-items:center;justify-content:center}"
      +".logos-row img{height:46px;width:auto;opacity:.65;filter:grayscale(1);transition:.2s}"
      +".logos-row img:hover{opacity:1;filter:none}"
      +".ft-ico{display:inline-flex;align-items:center;gap:8px}"
      +".ft-ico svg{width:16px;height:16px;flex:none}"
      +".cc-carousel{position:relative}"
      +".ccc-view{overflow:hidden}"
      +".ccc-track{display:flex;gap:22px;transition:transform .45s ease;will-change:transform;padding:18px 0}"
      +".ccc-card{flex:0 0 300px;max-width:80vw;position:relative;border-radius:16px;overflow:hidden;opacity:.45;transform:scale(.88);transition:opacity .45s,transform .45s;text-decoration:none}"
      +".ccc-card.on{opacity:1;transform:scale(1)}"
      +".ccc-img{aspect-ratio:3/4;background:linear-gradient(135deg,#e8d4b8,#c9a06a);background-size:cover;background-position:center}"
      +".ccc-cap{position:absolute;left:0;right:0;bottom:0;padding:16px;text-align:center;background:linear-gradient(transparent,rgba(255,255,255,.92))}"
      +".ccc-cap .k{font-size:11px;letter-spacing:2px;color:var(--gold-dark);font-weight:600}"
      +".ccc-cap .nm{font-family:var(--serif);font-weight:700;font-size:18px;color:var(--ink);margin-top:2px}"
      +".ccc-prev,.ccc-next{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.92);cursor:pointer;font-size:22px;color:var(--ink);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.12)}"
      +".ccc-prev{left:8px}.ccc-next{right:8px}"
      +".float-contact a svg{width:24px;height:24px}"
      +"@keyframes fcPulse{0%{transform:scale(1);box-shadow:0 6px 18px rgba(0,0,0,.22),0 0 0 0 rgba(255,255,255,.55)}50%{transform:scale(1.09)}100%{transform:scale(1);box-shadow:0 6px 18px rgba(0,0,0,.22),0 0 0 15px rgba(255,255,255,0)}}"
      +"@keyframes fcPulseSm{0%{transform:scale(1);box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 0 rgba(255,255,255,.5)}50%{transform:scale(1.05)}100%{transform:scale(1);box-shadow:0 4px 12px rgba(0,0,0,.22),0 0 0 8px rgba(255,255,255,0)}}"
      +".float-contact a{animation:fcPulse 1.5s ease-in-out infinite}"
      +".float-contact a:nth-child(2){animation-delay:.15s}"
      +".float-contact a:nth-child(3){animation-delay:.3s}"
      +".float-contact a:nth-child(4){animation-delay:.45s}"
      +".float-contact a:nth-child(5){animation-delay:.6s}"
      +".float-contact a:hover{animation-play-state:paused}"
      +"@media(max-width:600px){.float-contact{right:9px;bottom:10px;gap:8px}.float-contact a{width:38px;height:38px;font-size:16px;animation-name:fcPulseSm}.float-contact a svg{width:17px;height:17px}.fc-zalo{font-size:10px}}"
      +".lb-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:30px;flex-wrap:wrap}"
      +".lb-head .eyebrow{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--gold-dark);font-weight:600;margin-bottom:10px}"
      +".lb-head h2{font-family:var(--serif);font-size:clamp(30px,5vw,56px);font-weight:700;line-height:1.05;letter-spacing:-.5px}"
      +".lb-sub{color:var(--muted);font-size:16px;margin-top:10px;max-width:560px}"
      +".lb-btn{flex:none;background:#fff;border:1.5px solid var(--line);color:var(--ink);padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px;transition:.15s;white-space:nowrap}"
      +".lb-btn:hover{border-color:var(--gold);color:var(--gold-dark)}"
      +".lb-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:165px;gap:14px;grid-auto-flow:dense}"
      +".lb-it{grid-row:span 2;overflow:hidden;border-radius:14px;background:#efe7da}"
      +".lb-it:nth-child(8n+1){grid-column:span 2}"
      +".lb-it:nth-child(8n+6){grid-column:span 2}"
      +".lb-it img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}"
      +".lb-it:hover img{transform:scale(1.05)}"
      +"@media(max-width:760px){.lb-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:140px}.lb-it:nth-child(8n+1),.lb-it:nth-child(8n+6){grid-column:span 2}}";
    try{ var st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st); }catch(e){}
  })();

  /* ---- GIAO DIỆN: màu + phông ---- */
  var FONT_PRESETS={
    classic:{serif:"'Playfair Display', Georgia, serif", sans:"'Be Vietnam Pro', sans-serif", url:"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"},
    modern:{serif:"'Montserrat', sans-serif", sans:"'Be Vietnam Pro', sans-serif", url:"https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"},
    elegant:{serif:"'Cormorant Garamond', serif", sans:"'Be Vietnam Pro', sans-serif", url:"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap"}
  };
  getJSON("content/theme.json").then(function(th){
    if(!th) return;
    var r=document.documentElement;
    if(th.primary) r.style.setProperty('--gold', th.primary);
    if(th.primary_dark) r.style.setProperty('--gold-dark', th.primary_dark);
    if(th.dark){ r.style.setProperty('--black', th.dark); r.style.setProperty('--ink', th.dark); }
    if(th.font && FONT_PRESETS[th.font]){
      var fp=FONT_PRESETS[th.font];
      var link=document.createElement('link'); link.rel='stylesheet'; link.href=fp.url; document.head.appendChild(link);
      r.style.setProperty('--serif', fp.serif); r.style.setProperty('--sans', fp.sans);
    }
  });

  /* ---- MENU ---- */
  getJSON("content/menu.json").then(function(m){
    if(!m || !m.items || !m.items.length) return;
    var path=location.pathname.replace(/index\.html$/,'');
    var desk='', mob='';
    m.items.forEach(function(it){
      if(!it || !it.label || !it.url) return;
      var act=(it.url===path)?' active':'';
      if(it.cta){
        desk+='<a href="'+esc(it.url)+'" class="nav-cta">'+esc(it.label)+'</a>';
        mob+='<a href="'+esc(it.url)+'">'+esc(it.label)+' →</a>';
      } else {
        desk+='<a href="'+esc(it.url)+'"'+(act?' class="active"':'')+'>'+esc(it.label)+'</a>';
        mob+='<a href="'+esc(it.url)+'">'+esc(it.label)+'</a>';
      }
    });
    var nl=document.querySelector('.nav-links'); if(nl) nl.innerHTML=desk;
    var mm=document.querySelector('.mobile-menu'); if(mm) mm.innerHTML=mob;
  });

  /* ---- CÀI ĐẶT CHUNG: logo + liên hệ ---- */
  getJSON("content/settings.json").then(function(s){
    if(!s) return;
    if(s.logo){ var lg=resolveImg(s.logo); document.querySelectorAll(".nav-logo img, .ft-logo img").forEach(function(im){ im.src=lg; }); }
    if(s.phone){
      var digits=String(s.phone).replace(/[^0-9]/g,"");
      document.querySelectorAll('a[href^="tel:"]').forEach(function(a){ a.setAttribute("href","tel:"+digits); if(/[0-9]/.test(a.textContent)){ var icon=(a.textContent.match(/^[^0-9]*/)||[""])[0]; a.textContent=icon+s.phone; } });
      document.querySelectorAll('a[href*="zalo.me"]').forEach(function(a){ a.setAttribute("href","https://zalo.me/"+digits); });
      setText('[data-edit="phone"]', s.phone);
    }
    if(s.email){ document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){ a.setAttribute("href","mailto:"+s.email); if(/@/.test(a.textContent)) a.textContent=s.email; }); setText('[data-edit="email"]', s.email); }
    if(s.facebook){ document.querySelectorAll('a[href*="facebook.com"]').forEach(function(a){ a.setAttribute("href", s.facebook); }); }
    if(s.instagram){ document.querySelectorAll('a[href*="instagram.com"]').forEach(function(a){ a.setAttribute("href", s.instagram); }); }
    if(s.tiktok){ document.querySelectorAll('a[href*="tiktok.com"]').forEach(function(a){ a.setAttribute("href", s.tiktok); }); }
    addSocial(s);
    buildHeaderSocial(s);
    setText('[data-edit="address"]', s.address);
    setText('[data-edit="hours"]', s.hours);
  });

  /* ---- MẠNG XÃ HỘI: thêm Instagram + TikTok vào chân trang & nút nổi (mọi trang) ---- */
  var IC={
    phone:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
    chat:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1H9l-4 4v-4H4c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z"/></svg>',
    fb:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 8.4h-2V7.1c0-.5.3-.6.5-.6h1.4V4.1L13.5 4.1c-2.1 0-2.6 1.6-2.6 2.6v1.7H9.4V11h1.5v7h2.6v-7h1.7z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 5 8-5"/></svg>',
    cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5h3L7.5 6h9L18 8.5h3v10H3z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    tt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 4c.3 1.6 1.4 2.8 3 3v2.3c-1.1 0-2.1-.3-3-.9v5.1A4.8 4.8 0 1 1 9.2 9v2.4A2.4 2.4 0 1 0 11.6 14V4H14z"/></svg>'
  };
  function addSocial(s){
    function row(href,svg,label,blank){ return '<li><a class="ft-ico" href="'+esc(href)+'"'+(blank?' target="_blank" rel="noopener"':'')+'>'+svg+'<span>'+esc(label)+'</span></a></li>'; }
    var ct=document.querySelector('[data-ft="contact-title"]');
    var ul=(ct && ct.parentNode && ct.parentNode.querySelector) ? ct.parentNode.querySelector('ul') : null;
    if(ul){
      var digits=String(s.phone||'').replace(/[^0-9]/g,'');
      var rows='';
      if(s.phone) rows+=row('tel:'+digits, IC.phone, s.phone, false);
      if(digits) rows+=row('https://zalo.me/'+digits, IC.chat, 'Zalo', true);
      if(s.facebook) rows+=row(s.facebook, IC.fb, 'Facebook', true);
      if(s.instagram) rows+=row(s.instagram, IC.ig, 'Instagram', true);
      if(s.tiktok) rows+=row(s.tiktok, IC.tt, 'TikTok', true);
      if(s.email) rows+=row('mailto:'+s.email, IC.mail, s.email, false);
      rows+=row('/khachhangchonanh/', IC.cam, 'Khách hàng chọn ảnh', false);
      if(rows) ul.innerHTML=rows;
    }
    var fc=document.querySelector('.float-contact');
    if(fc){
      var fd=String(s.phone||'').replace(/[^0-9]/g,'');
      function fbtn(href,cls,svg,title,blank){ return '<a class="'+cls+'" href="'+esc(href)+'"'+(blank?' target="_blank" rel="noopener"':'')+' title="'+esc(title)+'">'+svg+'</a>'; }
      var fb='';
      if(s.phone) fb+=fbtn('tel:'+fd,'fc-phone',IC.phone,'Gọi',false);
      if(fd) fb+=fbtn('https://zalo.me/'+fd,'fc-zalo',IC.chat,'Zalo',true);
      if(s.facebook) fb+=fbtn(s.facebook,'fc-fb',IC.fb,'Facebook',true);
      if(s.instagram) fb+=fbtn(s.instagram,'fc-ig',IC.ig,'Instagram',true);
      if(s.tiktok) fb+=fbtn(s.tiktok,'fc-tt',IC.tt,'TikTok',true);
      if(fb) fc.innerHTML=fb;
    }
  }

  /* ---- Icon mạng xã hội trên thanh menu (góc phải) ---- */
  function buildHeaderSocial(s){
    var inner=document.querySelector('.nav-inner');
    if(!inner || inner.querySelector('.nav-social')) return;
    var fb='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 8.4h-2V7.1c0-.5.3-.6.5-.6h1.4V4.1L13.5 4.1c-2.1 0-2.6 1.6-2.6 2.6v1.7H9.4V11h1.5v7h2.6v-7h1.7z"/></svg>';
    var ig='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/></svg>';
    var tt='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 4c.3 1.6 1.4 2.8 3 3v2.3c-1.1 0-2.1-.3-3-.9v5.1A4.8 4.8 0 1 1 9.2 9v2.4A2.4 2.4 0 1 0 11.6 14V4H14z"/></svg>';
    var mail='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 5 8-5"/></svg>';
    var wrap=document.createElement('div'); wrap.className='nav-social';
    function add(href,svg,title,blank){ var a=document.createElement('a'); a.setAttribute('href',href); if(blank){ a.target='_blank'; a.rel='noopener'; } a.title=title; a.innerHTML=svg; wrap.appendChild(a); }
    if(s.facebook) add(s.facebook,fb,'Facebook',true);
    if(s.instagram) add(s.instagram,ig,'Instagram',true);
    if(s.tiktok) add(s.tiktok,tt,'TikTok',true);
    if(s.email) add('mailto:'+s.email,mail,'Email',false);
    if(wrap.children.length){ var t=inner.querySelector('.nav-toggle'); if(t){ inner.insertBefore(wrap,t); } else { inner.appendChild(wrap); } }
  }

  /* ---- CHÂN TRANG (footer) — mọi trang ---- */
  getJSON("content/footer.json").then(function(f){
    if(!f) return;
    setText('[data-ft="tagline"]', f.tagline);
    setText('[data-ft="services-title"]', f.services_title);
    setText('[data-ft="contact-title"]', f.contact_title);
    setText('[data-ft="copyright"]', f.copyright);
    if(f.services && f.services.length){
      var ul=document.querySelector('[data-ft="services"]');
      if(ul) ul.innerHTML=f.services.map(function(s){ return '<li><a href="'+esc(s.url)+'">'+esc(s.label)+'</a></li>'; }).join('');
    }
  });

  /* ===================== TRANG CHỦ ===================== */
  function renderHero(hero){
    if(!hero) return;
    setText('.hero .eyebrow', hero.eyebrow);
    var h1=document.querySelector('.hero h1');
    if(h1 && hero.title) h1.innerHTML=hl(hero.title, hero.highlight, '<em>', '</em>');
    setText('.hero p.lead', hero.lead);
    var b1=document.querySelector('[data-hero="btn1"]');
    if(b1){ if(hero.btn1_label) b1.textContent=hero.btn1_label; if(hero.btn1_url) b1.setAttribute('href', hero.btn1_url); }
    var b2=document.querySelector('[data-hero="btn2"]');
    if(b2){ if(hero.btn2_label) b2.textContent=hero.btn2_label; if(hero.btn2_url) b2.setAttribute('href', hero.btn2_url); }
    if(hero.image){ var ph=document.querySelector('.hero-bg .ph'); if(ph) ph.style.background="linear-gradient(rgba(26,23,20,0.5),rgba(26,23,20,0.62)),url('"+resolveImg(hero.image)+"') center/cover no-repeat"; }
  }

  function blockStats(b){
    var items=(b.items||[]).map(function(it){
      return '<div class="stat"><div class="num">'+esc(it.num)+'</div><div class="lbl">'+esc(it.lbl)+'</div></div>';
    }).join('');
    return '<section class="stats"><div class="wrap stats-grid">'+items+'</div></section>';
  }
  function blockIntro(b){
    var imgStyle = b.image ? (" style=\"background:url('"+resolveImg(b.image)+"') center/cover no-repeat\"") : "";
    var imgCls = b.image ? " has-img" : "";
    var ps=(b.paragraphs||[]).map(function(p){ return '<p>'+nl2br(p.item!==undefined?p.item:p.text)+'</p>'; }).join('');
    var head=b.heading ? '<h2>'+hl(b.heading, b.highlight, '<span style="color:var(--gold-dark)">', '</span>')+'</h2>' : '';
    var sign=b.sign ? '<div class="sign">'+esc(b.sign)+'</div>' : '';
    return '<section class="block"><div class="wrap intro"><div class="ph-img'+imgCls+'"'+imgStyle+'></div><div>'+head+ps+sign+'</div></div></section>';
  }
  function blockCards(b){
    var cards=(b.items||[]).map(function(it){
      var bg = it.image ? ("linear-gradient(rgba(0,0,0,0.12),rgba(0,0,0,0.62)),url('"+resolveImg(it.image)+"')") : "linear-gradient(rgba(0,0,0,0.15),rgba(0,0,0,0.65)),linear-gradient(135deg,#d8a978,#7a5638)";
      return '<a class="concept-card" href="'+esc(it.link||'/dich-vu/')+'">'
        +'<div class="ph" style="background-image:'+bg+';background-size:cover;background-position:center"></div>'
        +'<div class="label"><div class="k">'+esc(it.tag)+'</div><h3>'+esc(it.title)+'</h3><div class="price">'+esc(it.price)+'</div></div></a>';
    }).join('');
    var head='<div class="sec-head">'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')
      +(b.sub?'<p>'+esc(b.sub)+'</p>':'')+'</div>';
    return '<section class="block"><div class="wrap">'+head+'<div class="concepts">'+cards+'</div></div></section>';
  }
  function blockWhy(b){
    var items=(b.items||[]).map(function(it){
      return '<div class="why-item"><div class="ic">'+esc(it.icon)+'</div><h3>'+esc(it.title)+'</h3><p>'+nl2br(it.text)+'</p></div>';
    }).join('');
    var head='<div class="sec-head">'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')+'</div>';
    return '<section class="block why"><div class="wrap">'+head+'<div class="why-grid">'+items+'</div></div></section>';
  }
  function blockCta(b){
    return '<section class="block"><div class="wrap"><div class="cta-banner">'
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')
      +(b.text?'<p>'+nl2br(b.text)+'</p>':'')
      +(b.btn_label?'<a class="btn btn-white" href="'+esc(b.btn_url||'/lien-he/')+'">'+esc(b.btn_label)+'</a>':'')
      +'</div></div></section>';
  }
  function blockRichtext(b){
    var head='<div class="sec-head">'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')+'</div>';
    return '<section class="block"><div class="wrap">'+head
      +'<div style="max-width:760px;margin:0 auto;color:#5a5349;font-size:16px;line-height:1.85">'+nl2br(b.body)+'</div></div></section>';
  }
  function blockReviews(b){
    var head='<div class="sec-head">'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')+'</div>';
    var lim = b.limit ? (' data-reviews-limit="'+esc(b.limit)+'"') : '';
    return '<section class="block reviews-sec"><div class="wrap">'+head
      +'<div class="reviews-grid" data-reviews'+lim+'></div>'
      +'<div style="text-align:center;margin-top:6px"><a href="/danh-gia/" style="color:var(--gold-dark);font-weight:600">Xem tất cả đánh giá →</a></div>'
      +'</div></section>';
  }
  function blockLogos(b){
    var imgs=(b.items||[]).map(function(it){ var src=resolveImg(it&&it.image!==undefined?it.image:it); return src?'<img src="'+src+'" alt="'+esc((it&&it.name)||'')+'" referrerpolicy="no-referrer"/>':''; }).join('');
    if(!imgs) return '';
    var head=b.heading?'<div class="sec-head"><h2>'+esc(b.heading)+'</h2></div>':'';
    return '<section class="block"><div class="wrap">'+head+'<div class="logos-row">'+imgs+'</div></div></section>';
  }
  function blockCarousel(b){
    var head='<div class="sec-head">'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')+'</div>';
    return '<section class="block"><div class="wrap">'+head
      +'<div class="cc-carousel" data-carousel><button class="ccc-prev" aria-label="Trước">‹</button><div class="ccc-view"><div class="ccc-track"></div></div><button class="ccc-next" aria-label="Sau">›</button></div>'
      +'<div style="text-align:center;margin-top:26px"><a class="btn btn-gold" href="/concept/">Xem thêm concept →</a></div>'
      +'</div></section>';
  }
  function blockGallery(b){
    var imgs=(b.items||[]).map(function(it){ var src=resolveImg(it&&it.image!==undefined?it.image:it); return src?'<div class="lb-it"><img loading="lazy" referrerpolicy="no-referrer" src="'+src+'" alt="'+esc(b.heading||'')+'"/></div>':''; }).join('');
    if(!imgs && !b.heading) return '';
    var btn=b.btn_label?'<a class="lb-btn" href="'+esc(b.btn_url||'/concept/')+'">'+esc(b.btn_label)+'</a>':'';
    var head='<div class="lb-head"><div>'
      +(b.eyebrow?'<div class="eyebrow">'+esc(b.eyebrow)+'</div>':'')
      +(b.heading?'<h2>'+esc(b.heading)+'</h2>':'')
      +(b.sub?'<p class="lb-sub">'+nl2br(b.sub)+'</p>':'')
      +'</div>'+btn+'</div>';
    return '<section class="block"><div class="wrap">'+head+(imgs?'<div class="lb-grid">'+imgs+'</div>':'')+'</div></section>';
  }
  var BLOCKS={ stats:blockStats, intro:blockIntro, cards:blockCards, why:blockWhy, cta:blockCta, richtext:blockRichtext, reviews:blockReviews, logos:blockLogos, carousel:blockCarousel, gallery:blockGallery };

  function fillCarousel(){
    var boxes=document.querySelectorAll('[data-carousel]');
    if(!boxes.length) return;
    getJSON("content/concepts.json").then(function(data){
      var groups=(data&&data.items)||[];
      boxes.forEach(function(box){
        var track=box.querySelector('.ccc-track'), view=box.querySelector('.ccc-view');
        if(!track||!view) return;
        if(!groups.length){ box.style.display='none'; return; }
        track.innerHTML=groups.map(function(g,i){
          var first=g.concepts&&g.concepts[0];
          var cover=resolveImg(g.cover||(first&&(first.cover||(first.photos&&first.photos[0]&&(first.photos[0].image||first.photos[0]))))||'');
          var cv=cover?(" style=\"background-image:url('"+cover+"')\""):'';
          return '<a class="ccc-card" href="/concept/?g='+i+'"><div class="ccc-img"'+cv+'></div><div class="ccc-cap"><div class="k">CONCEPT</div><div class="nm">'+esc(g.name)+'</div></div></a>';
        }).join('');
        var cards=track.querySelectorAll('.ccc-card');
        var idx=cards.length>1?1:0;
        function update(){
          cards.forEach(function(c,i){ c.classList.toggle('on', i===idx); });
          var card=cards[idx]; if(!card) return;
          var off=card.offsetLeft-(view.clientWidth-card.offsetWidth)/2;
          track.style.transform='translateX('+(-off)+'px)';
        }
        var prev=box.querySelector('.ccc-prev'), next=box.querySelector('.ccc-next');
        if(prev) prev.addEventListener('click',function(){ if(idx>0){ idx--; update(); } });
        if(next) next.addEventListener('click',function(){ if(idx<cards.length-1){ idx++; update(); } });
        cards.forEach(function(c,i){ c.addEventListener('click',function(e){ if(i!==idx){ e.preventDefault(); idx=i; update(); } }); });
        update();
        window.addEventListener('resize', update);
      });
    }).catch(function(){});
  }

  function reviewCard(r){
    var im=r.image?'<img class="rv-img" referrerpolicy="no-referrer" src="'+resolveImg(r.image)+'" alt="Đánh giá khách hàng"/>':'';
    var txt=r.text?'<p class="rv-text">“'+esc(r.text)+'”</p>':'';
    var stars='<div class="rv-stars">★★★★★</div>';
    var nm=r.name?'<div class="rv-name">— '+esc(r.name)+'</div>':'';
    return '<div class="review-card">'+im+txt+stars+nm+'</div>';
  }
  function fillReviews(){
    var boxes=document.querySelectorAll('.reviews-grid[data-reviews]');
    if(!boxes.length) return;
    getJSON("content/reviews.json").then(function(rv){
      var items=(rv&&rv.items)||[];
      boxes.forEach(function(box){
        var lim=parseInt(box.getAttribute('data-reviews-limit')||'3',10) || 3;
        var list=items.slice(0,lim);
        box.innerHTML=list.length?list.map(reviewCard).join(''):'<p style="text-align:center;color:var(--muted);grid-column:1/-1">Chưa có đánh giá nào.</p>';
      });
    });
  }

  var homeBox=document.getElementById('home-blocks');
  if(homeBox){
    getJSON("content/homepage.json").then(function(hp){
      if(!hp) return; /* lỗi => giữ HTML tĩnh */
      renderHero(hp.hero);
      if(hp.blocks && hp.blocks.length){
        var html=hp.blocks.map(function(b){
          if(!b || b.visible===false) return '';
          var fn=BLOCKS[b.type]; return fn?fn(b):'';
        }).join('');
        if(html){ homeBox.innerHTML=html; fillReviews(); fillCarousel(); }
      }
    });
  }

  /* ===================== TRANG DỊCH VỤ ===================== */
  var svcBox=document.getElementById('services-list');
  if(svcBox || document.querySelector('[data-edit="svc.title"]')){
    getJSON("content/services.json").then(function(sv){
      if(!sv) return;
      setText('[data-edit="svc.eyebrow"]', sv.eyebrow);
      setText('[data-edit="svc.title"]', sv.title);
      setText('[data-edit="svc.sub"]', sv.sub);
      if(svcBox && sv.items && sv.items.length){
        svcBox.innerHTML=sv.items.map(function(it,idx){
          var feats=(it.features||[]).map(function(f){ return '<li>'+esc(f.item!==undefined?f.item:f)+'</li>'; }).join('');
          var bg = it.image ? ("url('"+resolveImg(it.image)+"')") : "linear-gradient(135deg,#d8a978,#7a5638)";
          var price='<div class="svc-price"><span class="now">'+esc(it.now)+'</span>'
            +(it.was?'<span class="was">'+esc(it.was)+'</span>':'')
            +(it.save?'<span class="save">'+esc(it.save)+'</span>':'')+'</div>';
          return '<div class="svc"><div class="svc-img s'+((idx%3)+1)+'"><div class="ph" style="background-image:'+bg+';background-size:cover;background-position:center"></div></div>'
            +'<div class="svc-body"><div class="k">'+esc(it.tag)+'</div><h2>'+esc(it.heading)+'</h2>'
            +'<p class="desc">'+nl2br(it.desc)+'</p><ul>'+feats+'</ul>'+price
            +(it.btn_label?'<a class="btn btn-gold" href="'+esc(it.btn_url||'/lien-he/')+'">'+esc(it.btn_label)+'</a>':'')
            +'<div style="margin-top:12px"><a href="/concept/" style="color:var(--gold-dark);font-weight:600;font-size:14px">Xem thêm concept →</a></div>'
            +'</div></div>';
        }).join('');
      }
    });
  }

  /* ===================== TRANG LIÊN HỆ ===================== */
  if(document.querySelector('[data-edit="contact.title"]')){
    getJSON("content/contact.json").then(function(c){
      if(!c) return;
      setText('[data-edit="contact.eyebrow"]', c.eyebrow);
      setText('[data-edit="contact.title"]', c.title);
      setText('[data-edit="contact.sub"]', c.sub);
      setText('[data-edit="contact.form_title"]', c.form_title);
      setText('[data-edit="contact.form_sub"]', c.form_sub);
      setText('[data-edit="contact.info_title"]', c.info_title);
    });
  }

  /* ===================== BẢNG GIÁ ===================== */
  if(document.querySelector('.pricing') || document.querySelector('[data-edit="pricing.title"]')){
    getJSON("content/pricing.json").then(function(p){
      if(!p) return;
      if(p.header){
        setText('[data-edit="pricing.eyebrow"]', p.header.eyebrow);
        setText('[data-edit="pricing.title"]', p.header.title);
        setText('[data-edit="pricing.sub"]', p.header.sub);
        setText('[data-edit="pricing.note"]', p.header.note);
        var noteEl=document.querySelector('[data-edit="pricing.note"]');
        if(noteEl) noteEl.style.display = p.header.note ? "" : "none";
      }
      var grid=document.querySelector('.pricing');
      if(grid && p.packages){
        var pks = p.packages || [];
        if(!pks.length){
          grid.innerHTML='<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:36px 0">Chưa có gói nào. Vào trang quản trị để thêm gói chụp.</p>';
        } else {
          grid.innerHTML = pks.map(function(pk){
            pk = pk || {};
            var feats = ((pk.features)||[]).map(function(f){
              var t = (f && f.item!==undefined) ? f.item : f;
              return t ? '<li>'+esc(t)+'</li>' : '';
            }).join('');
            var badge = pk.featured ? '<div class="badge-pop">'+esc(pk.badge||'Phổ biến nhất')+'</div>' : '';
            var was   = pk.was  ? '<span class="was">'+esc(pk.was)+'</span>' : '';
            var save  = pk.save ? '<span class="save">'+esc(pk.save)+'</span>' : '';
            var tag   = (pk.tag!==undefined && pk.tag!==null) ? esc(pk.tag) : 'Concept';
            var name  = esc(pk.name||'').replace(/\n/g,'<br/>');
            var now   = pk.now ? '<span class="now">'+esc(pk.now)+'</span>' : '';
            var btnL  = esc(pk.btn_label || 'Đặt gói này →');
            var btnU  = esc(pk.btn_url || '/lien-he/');
            return '<div class="price-card'+(pk.featured?' featured':'')+'">'
              + badge
              + (tag ? '<div class="pk">'+tag+'</div>' : '')
              + '<h3>'+name+'</h3>'
              + '<div class="price">'+now+was+'</div>'
              + save
              + '<ul>'+feats+'</ul>'
              + '<a class="btn btn-gold" href="'+btnU+'">'+btnL+'</a>'
              + '</div>';
          }).join('');
        }
      }
    });
  }
})();
