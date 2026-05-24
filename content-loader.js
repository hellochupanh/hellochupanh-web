/* Hello Chụp Ảnh — nạp nội dung động (sửa qua /admin) */
(function(){
  var REPO="hellochupanh/hellochupanh-web", BRANCH="main";
  function raw(p){ return "https://raw.githubusercontent.com/"+REPO+"/"+BRANCH+"/"+String(p).replace(/^\//,"")+"?t="+Date.now(); }
  function resolveImg(p){ if(!p) return ""; if(/^https?:/.test(p)) return p; return "https://raw.githubusercontent.com/"+REPO+"/"+BRANCH+"/"+String(p).replace(/^\//,""); }
  function getJSON(path){ return fetch(raw(path)).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function setText(sel,val){ if(val==null) return; document.querySelectorAll(sel).forEach(function(el){ el.textContent=val; }); }

  getJSON("content/settings.json").then(function(s){
    if(!s) return;
    if(s.logo){ var lg=resolveImg(s.logo); document.querySelectorAll(".nav-logo img, .ft-logo img").forEach(function(im){ im.src=lg; }); }
    if(s.phone){
      var digits=String(s.phone).replace(/[^0-9]/g,"");
      document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
        a.setAttribute("href","tel:"+digits);
        if(/[0-9]/.test(a.textContent)){ var icon=(a.textContent.match(/^[^0-9]*/)||[""])[0]; a.textContent=icon+s.phone; }
      });
      document.querySelectorAll('a[href*="zalo.me"]').forEach(function(a){ a.setAttribute("href","https://zalo.me/"+digits); });
      setText('[data-edit="phone"]', s.phone);
    }
    if(s.email){
      document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){ a.setAttribute("href","mailto:"+s.email); if(/@/.test(a.textContent)) a.textContent=s.email; });
      setText('[data-edit="email"]', s.email);
    }
    if(s.facebook){ document.querySelectorAll('a[href*="facebook.com"]').forEach(function(a){ a.setAttribute("href", s.facebook); }); }
    setText('[data-edit="address"]', s.address);
    setText('[data-edit="hours"]', s.hours);
  });

  if(document.querySelector('[data-price-card]')){
    getJSON("content/pricing.json").then(function(p){
      if(!p||!p.packages) return;
      document.querySelectorAll('[data-price-card]').forEach(function(card){
        var pk=p.packages[parseInt(card.getAttribute('data-price-card'),10)];
        if(!pk) return;
        var h=card.querySelector('h3'); if(h&&pk.name) h.innerHTML=String(pk.name).replace(/\n/g,"<br/>");
        var now=card.querySelector('.now'); if(now&&pk.now) now.textContent=pk.now;
        var was=card.querySelector('.was'); if(was) was.textContent=pk.was||"";
        var save=card.querySelector('.save'); if(save) save.textContent=pk.save||"";
        var ul=card.querySelector('ul');
        if(ul&&pk.features){ ul.innerHTML=""; pk.features.forEach(function(f){ var li=document.createElement('li'); li.textContent=(f&&f.item!==undefined?f.item:f); ul.appendChild(li); }); }
      });
    });
  }
})();
