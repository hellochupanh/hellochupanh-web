/* Hello Chụp Ảnh — nạp nội dung & giao diện động (sửa qua /admin) */
(function(){
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
      +"@media(max-width:760px){.reviews-grid{grid-template-columns:1fr}}"
      +".fc-ig{background:radial-gradient(circle at 30% 110%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}"
      +".fc-tt{background:#111}";
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
    setText('[data-edit="address"]', s.address);
    setText('[data-edit="hours"]', s.hours);
  });

  /* ---- MẠNG XÃ HỘI: thêm Instagram + TikTok vào chân trang & nút nổi (mọi trang) ---- */
  function addSocial(s){
    var ct=document.querySelector('[data-ft="contact-title"]');
    var ul=(ct && ct.parentNode && ct.parentNode.querySelector) ? ct.parentNode.querySelector('ul') : null;
    if(ul){
      if(s.instagram && !ul.querySelector('a[href*="instagram.com"]')){ var li=document.createElement('li'); var a0=document.createElement('a'); a0.target="_blank"; a0.rel="noopener"; a0.setAttribute("href", s.instagram); a0.textContent="📷 Instagram"; li.appendChild(a0); ul.appendChild(li); }
      if(s.tiktok && !ul.querySelector('a[href*="tiktok.com"]')){ var li2=document.createElement('li'); var a1=document.createElement('a'); a1.target="_blank"; a1.rel="noopener"; a1.setAttribute("href", s.tiktok); a1.textContent="🎵 TikTok"; li2.appendChild(a1); ul.appendChild(li2); }
    }
    var fc=document.querySelector('.float-contact');
    if(fc){
      if(s.instagram && !fc.querySelector('a[href*="instagram.com"]')){ var ig=document.createElement('a'); ig.className="fc-ig"; ig.target="_blank"; ig.rel="noopener"; ig.title="Instagram"; ig.setAttribute("href", s.instagram); ig.textContent="📷"; fc.appendChild(ig); }
      if(s.tiktok && !fc.querySelector('a[href*="tiktok.com"]')){ var tt=document.createElement('a'); tt.className="fc-tt"; tt.target="_blank"; tt.rel="noopener"; tt.title="TikTok"; tt.setAttribute("href", s.tiktok); tt.textContent="🎵"; fc.appendChild(tt); }
    }
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
  var BLOCKS={ stats:blockStats, intro:blockIntro, cards:blockCards, why:blockWhy, cta:blockCta, richtext:blockRichtext, reviews:blockReviews };

  function reviewCard(r){ return '<div class="review-card"><p class="rv-text">“'+esc(r.text)+'”</p><div class="rv-name">— '+esc(r.name)+'</div></div>'; }
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
        if(html){ homeBox.innerHTML=html; fillReviews(); }
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
  if(document.querySelector('[data-price-card]') || document.querySelector('[data-edit="pricing.title"]')){
    getJSON("content/pricing.json").then(function(p){
      if(!p) return;
      if(p.header){
        setText('[data-edit="pricing.eyebrow"]', p.header.eyebrow);
        setText('[data-edit="pricing.title"]', p.header.title);
        setText('[data-edit="pricing.sub"]', p.header.sub);
        setText('[data-edit="pricing.note"]', p.header.note);
      }
      if(p.packages){
        document.querySelectorAll('[data-price-card]').forEach(function(card){
          var pk=p.packages[parseInt(card.getAttribute('data-price-card'),10)]; if(!pk) return;
          var h=card.querySelector('h3'); if(h&&pk.name) h.innerHTML=String(pk.name).replace(/\n/g,"<br/>");
          var now=card.querySelector('.now'); if(now&&pk.now) now.textContent=pk.now;
          var was=card.querySelector('.was'); if(was) was.textContent=pk.was||"";
          var save=card.querySelector('.save'); if(save) save.textContent=pk.save||"";
          var ul=card.querySelector('ul'); if(ul&&pk.features){ ul.innerHTML=""; pk.features.forEach(function(f){ var li=document.createElement('li'); li.textContent=(f&&f.item!==undefined?f.item:f); ul.appendChild(li); }); }
        });
      }
    });
  }
})();
