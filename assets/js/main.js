(function(){
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var yr=$("#yr"); if(yr) yr.textContent = new Date().getFullYear();

  // safe storage
  function sset(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}
  function sget(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
  function sdel(k){try{sessionStorage.removeItem(k)}catch(e){}}

  // menu
  var burger=$("#burger"), menu=$("#menu");
  burger.addEventListener("click",function(){var o=menu.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
  $$("#menu a").forEach(function(a){a.addEventListener("click",function(){menu.classList.remove("open");burger.setAttribute("aria-expanded","false")})});
  
  document.addEventListener("keydown", function(e){
    if(e.key==="Escape" && menu.classList.contains("open")){menu.classList.remove("open");burger.setAttribute("aria-expanded","false");burger.focus()}
  });

  document.addEventListener("click", function(event) {
    if (menu && menu.classList.contains("open")) {
      if (!menu.contains(event.target) && !burger.contains(event.target)) {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    }
  });

  // UTM (FR-28)
  (function(){
    try{
      var p=new URLSearchParams(location.search);
      ["utm_source","utm_medium","utm_campaign"].forEach(function(k){
        var v=p.get(k); if(!v) return;
        v=v.replace(/[^\w\-\.\u0600-\u06FF ]/g,"").slice(0,50).trim();
        if(v) sset(k,v);
      });
    }catch(e){}
  })();
  function utmLine(){
    var parts=["utm_source","utm_medium","utm_campaign"].map(sget).filter(Boolean);
    return parts.length ? "المصدر: "+parts.join(" / ") : "";
  }

  function waLink(text){return "https://wa.me/"+SITE_CONFIG.whatsapp+"?text="+encodeURIComponent(text)}
  function waWeb(text){return "https://web.whatsapp.com/send?phone="+SITE_CONFIG.whatsapp+"&text="+encodeURIComponent(text)}

  // direct links (FAB + contact)
  $$("[data-wa-direct]").forEach(function(a){
    a.href = waLink(SITE_CONFIG.defaultMsg + (utmLine()?"\n"+utmLine():""));
  });

  // chips
  var TOPICS={
    "سياحة":["مشهد","طهران","شمال إيران","ترانسفر وإقامة","أخرى"],
    "علاج":["جراحة تجميلية","طب الأسنان","علاج العقم","فحص شامل","أخرى"]
  };
  var state={type:"",topic:""};
  var gType=$("#g-type"), gTopic=$("#g-topic"), fTopic=$("#f-topic"), other=$("#other"), medwarn=$("#medwarn");

  function setChecked(group,btn){
    $$(".chip",group).forEach(function(c){c.setAttribute("aria-checked", c===btn ? "true":"false"); c.tabIndex = (c===btn)?0:-1});
  }
  function renderTopics(){
    gTopic.innerHTML="";
    (TOPICS[state.type]||[]).forEach(function(t){
      var b=document.createElement("button");
      b.type="button"; b.className="chip"; b.setAttribute("role","radio"); b.setAttribute("aria-checked","false"); b.textContent=t; b.dataset.v=t;
      gTopic.appendChild(b);
    });
    fTopic.classList.toggle("hidden", !state.type);
    medwarn.classList.toggle("hidden", state.type!=="علاج");
    other.classList.add("hidden");
  }
  function pickType(v){
    var btn=$$(".chip",gType).filter(function(c){return c.dataset.v===v})[0]; if(!btn) return;
    state.type=v; state.topic=""; setChecked(gType,btn); renderTopics(); persist();
  }
  gType.addEventListener("click",function(e){var b=e.target.closest(".chip"); if(b) pickType(b.dataset.v)});
  gTopic.addEventListener("click",function(e){
    var b=e.target.closest(".chip"); if(!b) return;
    state.topic=b.dataset.v; setChecked(gTopic,b);
    other.classList.toggle("hidden", state.topic!=="أخرى");
    if(state.topic==="أخرى") other.focus();
  });
  // keyboard arrows for radiogroups
  [gType,gTopic].forEach(function(g){
    g.addEventListener("keydown",function(e){
      var k=e.key; if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].indexOf(k)<0) return;
      var list=$$(".chip",g), i=list.indexOf(document.activeElement); if(i<0) return;
      var next = (k==="ArrowLeft"||k==="ArrowDown") ? (i+1)%list.length : (i-1+list.length)%list.length;
      list[next].focus(); list[next].click(); e.preventDefault();
    });
  });


  // stacked swipe cards (mobile)
  var mq=window.matchMedia("(max-width:700px)");
  var stacks=[];
  function makeStack(row){
    var cards=$$(".card",row); if(cards.length<2) return null;
    var order=cards.map(function(_,i){return i});
    function mkBtn(label,d){
      var b=document.createElement("button"); b.type="button"; b.className="snb"; b.setAttribute("aria-label",label);
      b.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"/></svg>';
      return b;
    }
    var bPrev=mkBtn("البطاقة السابقة","M15 6l-6 6 6 6"), bNext=mkBtn("البطاقة التالية","M9 6l6 6-6 6");
    var nav=document.createElement("div"); nav.className="snav";
    var dots=document.createElement("div"); dots.className="dots"; dots.setAttribute("aria-hidden","true");
    var di=cards.map(function(){var i=document.createElement("i");dots.appendChild(i);return i});
    nav.appendChild(bPrev); nav.appendChild(dots); nav.appendChild(bNext);
    var hint=document.createElement("div"); hint.className="swipe-hint"; hint.textContent="اسحب لليسار للتالي، ولليمين للسابق";
    row.parentNode.insertBefore(nav,row.nextSibling); row.parentNode.insertBefore(hint,nav.nextSibling);
    var on=false, busy=false;
    function layout(){
      order.forEach(function(ci,d){
        var c=cards[ci], k=Math.min(d,2);
        c.style.zIndex=100-d;
        c.style.transform="translateY("+(k*12)+"px) scale("+(1-k*.05)+")";
        c.style.opacity=d>2?0:1;
        c.style.pointerEvents=d===0?"auto":"none";
        c.setAttribute("aria-hidden",d===0?"false":"true");
        try{c.inert = d!==0}catch(_){}
      });
      di.forEach(function(x,i){x.classList.toggle("on",i===order[0])});
    }
    function size(){
      var h=0; cards.forEach(function(c){h=Math.max(h,c.offsetHeight)});
      row.style.height=(h+28)+"px";
    }
    function enable(){
      if(on) return; on=true; row.classList.add("stack");
      cards.forEach(function(c){c.style.transition="none"});
      layout(); size();
      requestAnimationFrame(function(){cards.forEach(function(c){c.style.transition=""})});
    }
    function disable(){
      if(!on) return; on=false; row.classList.remove("stack"); row.style.height="";
      cards.forEach(function(c){c.style.cssText="";c.removeAttribute("aria-hidden");try{c.inert=false}catch(_){}});
    }
    /* next: top card flies away to the back of the pile */
    function goNext(dir){
      if(!on||busy) return; busy=true;
      var c=cards[order[0]]; c.classList.remove("drag");
      c.style.transform="translateX("+(dir*130)+"%) rotate("+(dir*18)+"deg)"; c.style.opacity=0;
      setTimeout(function(){
        c.style.transition="none"; order.push(order.shift()); layout();
        void c.offsetWidth; c.style.transition=""; busy=false;
      },320);
    }
    /* while dragging right, show the PREVIOUS photo beneath (not the next one) */
    var lastDir=0;
    function beneath(dir){
      if(order.length<3) return;
      var nx=cards[order[1]], pc=cards[order[order.length-1]];
      if(dir>0){
        nx.style.opacity=0;
        pc.style.zIndex=99; pc.style.opacity=1; pc.style.transform="translateY(12px) scale(.95)";
      } else {
        pc.style.opacity=0; pc.style.zIndex=100-(order.length-1); pc.style.transform="translateY(24px) scale(.9)";
        nx.style.opacity=1;
      }
    }
    /* previous: top card is thrown to the right, the previous card takes its place */
    function goPrev(){
      if(!on||busy) return; busy=true;
      var c=cards[order[0]]; c.classList.remove("drag"); cur=null; lastDir=0;
      var pc=cards[order[order.length-1]], nx=cards[order[1]];
      if(order.length>=3) nx.style.opacity=0;
      pc.style.zIndex=99; pc.style.opacity=1; pc.style.transform="translateY(0) scale(1)";
      c.style.transform="translateX(130%) rotate(18deg)"; c.style.opacity=0;
      setTimeout(function(){
        c.style.transition="none"; order.unshift(order.pop()); layout();
        void c.offsetWidth; c.style.transition=""; busy=false;
      },340);
    }
    bNext.addEventListener("click",function(){goNext(-1)});
    bPrev.addEventListener("click",goPrev);
    
    // drag
    var sx=0,dx=0,cur=null,id=null;
    row.addEventListener("pointerdown",function(e){
      if(!on||busy) return;
      var c=e.target.closest(".card"); if(!c||c!==cards[order[0]]) return;
      cur=c; id=e.pointerId; sx=e.clientX; dx=0; lastDir=0; c.classList.add("drag");
      try{c.setPointerCapture(id)}catch(_){}
    });
    
    row.addEventListener("pointermove",function(e){
      if(!cur||e.pointerId!==id) return;
      e.preventDefault(); // سحب أفقي فقط؛ التمرير العمودي يتولاه touch-action:pan-y في CSS
      dx=e.clientX-sx;
      cur.style.transform="translateX("+dx+"px) rotate("+(dx/22)+"deg)";
      var dir=dx>8?1:0; if(dir!==lastDir){lastDir=dir; beneath(dir)}
    });
    
    function end(e){
      if(!cur||(e&&e.pointerId!==id)) return;
      var c=cur, d=dx; dx=0;
      c.classList.remove("drag");
      if(d<=70) lastDir=0;
      if(d<-70){ cur=null; goNext(-1) }
      else if(d>70){ goPrev(); cur=null }
      else { cur=null; layout() }
    }
    row.addEventListener("pointerup",end); row.addEventListener("pointercancel",end);
    
    return {enable:enable,disable:disable,size:size,always:row.classList.contains("pstack"),destroy:function(){disable(); if(nav.parentNode) nav.parentNode.removeChild(nav); if(hint.parentNode) hint.parentNode.removeChild(hint)}};
  }
  
  $$(".g4,.g3,.pstack").forEach(function(r){var s=makeStack(r); if(s) stacks.push(s)});
  function applyStacks(){stacks.forEach(function(s){(mq.matches||s.always)?(s.enable(),s.size()):s.disable()})}
  applyStacks();
  window.addEventListener("resize",applyStacks);
  window.addEventListener("load",applyStacks);
  window.TA_stack={
    add:function(row){var s=makeStack(row); if(!s) return null; stacks.push(s); if(mq.matches||s.always){s.enable();s.size()}else s.disable(); return s},
    remove:function(s){if(!s) return; s.destroy(); var i=stacks.indexOf(s); if(i>-1) stacks.splice(i,1)}
  };

  // theme toggle
  (function(){
    var btn=$("#themeBtn"), root=document.documentElement, meta=$("#metaTheme");
    function sync(){
      var d=root.getAttribute("data-theme")==="dark";
      btn.setAttribute("aria-pressed",d?"true":"false");
      btn.setAttribute("aria-label",d?"تبديل إلى الوضع الفاتح":"تبديل إلى الوضع الليلي");
      if(meta) meta.setAttribute("content", d?"#0B1226":"#0B1B45");
    }
    btn.addEventListener("click",function(){
      var n=root.getAttribute("data-theme")==="dark"?"light":"dark";
      root.setAttribute("data-theme",n);
      try{localStorage.setItem("ta_theme",n)}catch(e){}
      sync();
    });
    sync();
  })();

  // CTA buttons that preselect a type
  $$("[data-wa-open]").forEach(function(a){a.addEventListener("click",function(){var p=a.getAttribute("data-pick"); if(p) pickType(p)})});

  // persist non-sensitive fields (FR-29)
  var F={name:$("#name"),country:$("#country"),date:$("#date"),people:$("#people")};
  function persist(){
    sset("f_name",F.name.value); sset("f_country",F.country.value);
    sset("f_date",F.date.value); sset("f_people",F.people.value); sset("f_type",state.type);
  }
  ["name","country","date","people"].forEach(function(k){F[k].addEventListener("input",persist);F[k].addEventListener("change",persist)});
  (function restore(){
    var v;
    if((v=sget("f_name"))) F.name.value=v;
    if((v=sget("f_country"))) F.country.value=v;
    if((v=sget("f_date"))) F.date.value=v;
    if((v=sget("f_people"))) F.people.value=v;
    if((v=sget("f_type"))) pickType(v);
  })();

  // validation (FR-24)
  function setErr(id,msg,el){
    $("#"+id).textContent=msg||"";
    if(el) el.classList.toggle("invalid",!!msg);
  }
  function validate(){
    var ok=true, first=null;
    function bad(id,msg,el){setErr(id,msg,el);ok=false; if(!first) first=el||$("#"+id)}
    setErr("e-name","",F.name); setErr("e-country","",F.country); setErr("e-type",""); setErr("e-topic",""); setErr("e-people","",F.people);
    var n=F.name.value.trim();
    if(n.length<2) bad("e-name","الرجاء إدخال اسمك (حرفان على الأقل).",F.name);
    if(!F.country.value) bad("e-country","الرجاء اختيار الدولة.",F.country);
    if(!state.type) bad("e-type","الرجاء اختيار نوع الخدمة.",$(".chip",gType));
    else if(!state.topic) bad("e-topic","الرجاء اختيار الموضوع.",$(".chip",gTopic));
    else if(state.topic==="أخرى" && other.value.trim().length<2) bad("e-topic","الرجاء كتابة الموضوع.",other);
    var dv=F.date.value.trim();
    if(dv!=="" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(dv)){ F.date.classList.add("invalid"); ok=false; if(!first) first=F.date; }
    else F.date.classList.remove("invalid");
    var pc=F.people.value.trim();
    if(pc!=="" && (!/^\d+$/.test(pc) || +pc<1 || +pc>50)) bad("e-people","أدخل عددًا صحيحًا بين 1 و 50.",F.people);
    if(first && first.focus) first.focus();
    return ok;
  }

  function monthAr(v){
    if(!v) return "";
    var m=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    var p=v.split("-"); if(p.length<2 || !m[+p[1]-1]) return "";
    return m[+p[1]-1]+" "+p[0];
  }

  function clean(s,n){return String(s==null?"":s).replace(/[\u0000-\u001F\u007F\u200E\u200F\u202A-\u202E]/g," ").replace(/\s+/g," ").trim().slice(0,n)}
  function buildMessage(){
    var topic = state.topic==="أخرى" ? clean(other.value,80) : state.topic;
    var L=["السلام عليكم، أرغب بالحصول على استشارة.",""];
    L.push("الاسم: "+clean(F.name.value,60));
    L.push("الدولة: "+clean(F.country.value,40));
    L.push("نوع الخدمة: "+(state.type==="علاج"?"علاج":"سياحة"));
    L.push("الموضوع: "+topic);
    var mo=monthAr(F.date.value); if(mo) L.push("تاريخ السفر التقريبي: "+mo);
    if(F.people.value.trim()) L.push("عدد الأشخاص: "+clean(F.people.value,3));
    var bt=clean($("#besttime").value,50); if(bt) L.push("أفضل وقت للتواصل: "+bt);
    var note=clean($("#note").value,400); if(note) L.push("ملاحظات: "+note);
    var u=utmLine(); if(u){L.push("");L.push(u)}
    return L.join("\n").slice(0,1800);
  }

  $("#bookForm").addEventListener("submit",function(e){
    e.preventDefault();
    if(!validate()) return;
    var msg=buildMessage();
    // لا نستخدم "noopener" في window.open لأنه يُرجع null دائمًا فيُفتح واتساب مرتين
    var win=window.open(waLink(msg),"_blank");
    if(win){ try{win.opener=null}catch(_){} }
    $("#fb-web").href=waWeb(msg);
    $("#fallback").classList.remove("hidden");
    // clear stored form data after sending (FR-29)
    ["f_name","f_country","f_date","f_people","f_type"].forEach(sdel);
    if(!win){ location.href=waLink(msg); }
  });

  $("#fb-copy").addEventListener("click",function(){
    var b=this, t=SITE_CONFIG.display;
    function done(){b.textContent="تم النسخ ✔";setTimeout(function(){b.textContent="نسخ الرقم"},2000)}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){prompt("انسخ الرقم:",t)})}
    else prompt("انسخ الرقم:",t);
  });
})();
