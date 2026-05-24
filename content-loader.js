/* Hello Chụp Ảnh — nạp nội dung & giao diện động (sửa qua /admin) */
(function(){
  var REPO="hellochupanh/hellochupanh-web", BRANCH="main";
  function raw(p){ return "https://raw.githubusercontent.com/"+REPO+"/"+BRANCH+"/"+String(p).replace(/^\//,"")+"?t="+Date.now(); }
  function resolveImg(p){ if(!p) return ""; if(/^https?:/.test(p)) return p; return "https://raw.githubusercontent.com/"+REPO+"/"+BRANCH+"/"+String(p).replace(/^\//,""); }
  function getJSON(path){ return fetch(raw(path)).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function setText(sel,val){ if(val==null) return; document.querySelectorAll(sel).forEach(function(el){ el.textContent=val; }); }
  function esc(s){ return String(s||"").replace(/[&<>"]/g,function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]); }); }

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
    setText('[data-edit="address"]', s.address);
    setText('[data-edit="hours"]', s.hours);
  });

  /* ---- BẢNG GIÁ ---- */
  if(document.querySelector('[data-price-card]')){
    getJSON("content/pricing.json").then(function(p){
      if(!p||!p.packages) return;
      document.querySelectorAll('[data-price-card]').forEach(function(card){
        var pk=p.packages[parseInt(card.getAttribute('data-price-card'),10)]; if(!pk) return;
        var h=card.querySelector('h3'); if(h&&pk.name) h.innerHTML=String(pk.name).replace(/\n/g,"<br/>");
        var now=card.querySelector('.now'); if(now&&pk.now) now.textContent=pk.now;
        var was=card.querySelector('.was'); if(was) was.textContent=pk.was||"";
        var save=card.querySelector('.save'); if(save) save.textContent=pk.save||"";
        var ul=card.querySelector('ul'); if(ul&&pk.features){ ul.innerHTML=""; pk.features.forEach(function(f){ var li=document.createElement('li'); li.textContent=(f&&f.item!==undefined?f.item:f); ul.appendChild(li); }); }
      });
    });
  }

  /* ---- SẮP XẾP KHỐI TRANG CHỦ ---- */
  if(document.querySelector('[data-section]')){
    getJSON("content/sections.json").then(function(sec){
      if(!sec||!sec.order) return;
      var map={}; document.querySelectorAll('[data-section]').forEach(function(el){ map[el.getAttribute('data-section')]=el; });
      var first=document.querySelector('[data-section]'); if(!first) return;
      var parent=first.parentNode, anchor=first.previousElementSibling;
      sec.order.forEach(function(o){
        var el=map[o.key]; if(!el) return;
        el.style.display=(o.visible===false)?'none':'';
        if(anchor){ parent.insertBefore(el, anchor.nextSibling); } else { parent.insertBefore(el, parent.firstChild); }
        anchor=el;
      });
    });
  }
})();
