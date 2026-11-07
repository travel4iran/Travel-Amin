(function(){
  var cfg=(window.SITE_CONFIG&&SITE_CONFIG.rates)||null;
  var grid=document.getElementById("ratesGrid"), meta=document.getElementById("ratesMeta"), retry=document.getElementById("ratesRetry");
  if(!cfg||!grid||!meta||!retry) return;
  var DEFS=[
    {code:"USD",ar:"الدولار الأمريكي",fl:"🇺🇸",keys:["price_dollar_rl","price_dollar"],titles:["دلار","دلار آمریکا"]},
    {code:"AED",ar:"الدرهم الإماراتي",fl:"🇦🇪",keys:["price_aed"],titles:["درهم امارات","درهم"]},
    {code:"EUR",ar:"اليورو",fl:"🇪🇺",keys:["price_eur"],titles:["یورو"]},
    {code:"KWD",ar:"الدينار الكويتي",fl:"🇰🇼",keys:["price_kwd"],titles:["دینار کویت"]},
    {code:"SAR",ar:"الريال السعودي",fl:"🇸🇦",keys:["price_sar"],titles:["ریال عربستان","ریال سعودی"]},
    {code:"QAR",ar:"الريال القطري",fl:"🇶🇦",keys:["price_qar"],titles:["ریال قطر"]},
    {code:"OMR",ar:"الريال العماني",fl:"🇴🇲",keys:["price_omr"],titles:["ریال عمان"]},
    {code:"BHD",ar:"الدينار البحريني",fl:"🇧🇭",keys:["price_bhd"],titles:["دینار بحرین"]},
    {code:"IQD",ar:"الدينار العراقي",fl:"🇮🇶",keys:["price_iqd"],titles:["دینار عراق"]},
    {code:"GBP",ar:"الجنيه الإسترليني",fl:"🇬🇧",keys:["price_gbp"],titles:["پوند","پوند انگلیس"]}
  ];
  function latin(s){return String(s==null?"":s).replace(/[۰-۹]/g,function(d){return "۰۱۲۳۴۵۶۷۸۹".indexOf(d)}).replace(/[٠-٩]/g,function(d){return "٠١٢٣٤٥٦٧٨٩".indexOf(d)})}
  function num(s){var n=parseFloat(latin(s).replace(/[^\d.]/g,"")); return isFinite(n)?n:NaN}
  function toman(s){var n=num(s); if(isNaN(n)) return null; var v=n/(cfg.divisor||10); return v<1000?Math.round(v*10)/10:Math.round(v)}
  function fmt(n){return n.toLocaleString("en-US",{maximumFractionDigits:1})}
  
  // مهلة 15 ثانية؛ المؤقّت يُلغى عند اكتمال الطلب
  function getJSON(u){
    var c=new AbortController(), t=setTimeout(function(){c.abort()},15000);
    return fetch(u,{signal:c.signal,headers:{"Accept":"application/json"}}).then(function(r){
      if(!r.ok) throw new Error("http "+r.status); return r.json();
    }).then(function(d){clearTimeout(t); return d},function(e){clearTimeout(t); throw e});
  }
  // الـ Worker هو المصدر الوحيد (CSP لا يسمح بالاتصال المباشر بـ TGJU)
  function load(src){return getJSON(cfg.proxy||src)}
  function toList(data){
    var list=Array.isArray(data)?data:(data&&(data.data||data.prices||data.items))||[];
    if(!Array.isArray(list)&&list&&typeof list==="object"){ list=list.currencies?Object.keys(list.currencies).map(function(k){var o=list.currencies[k]; o.symbol=o.symbol||k; return o}):Object.keys(list).map(function(k){return list[k]}) }
    return Array.isArray(list)?list:[];
  }
  function fetchList(src){return load(src).then(toList)}
  function pick(list){
    var out=[];
    DEFS.forEach(function(d){
      var it=list.filter(function(x){return x&&(d.keys.indexOf(x.key)>-1||d.titles.indexOf(String(x.title||"").trim())>-1)})[0];
      if(!it) return;
      var p=toman(it.price); if(p===null||p<=0) return;
      out.push({d:d,p:p,lo:toman(it.low_price),hi:toman(it.high_price),st:String(it.status||"").toLowerCase()});
    });
    return out;
  }
  var stackH=null;
  function unstack(){ if(stackH&&window.TA_stack){TA_stack.remove(stackH)} stackH=null }
  function render(items){
    unstack();
    grid.innerHTML="";
    items.forEach(function(r){
      var c=document.createElement("div"); c.className="rate card";
      var fl=document.createElement("span"); fl.className="fl"; fl.textContent=r.d.fl; fl.setAttribute("aria-hidden","true");
      var nm=document.createElement("span"); nm.className="nm"; nm.textContent=r.d.ar;
      var pr=document.createElement("span"); pr.className="pr"; pr.textContent=fmt(r.p);
      var un=document.createElement("span"); un.className="un"; un.textContent="تومان";
      c.appendChild(fl); c.appendChild(nm); c.appendChild(pr); c.appendChild(un);
      if(r.st==="high"||r.st==="low"){
        var ch=document.createElement("span"); ch.className="chg "+(r.st==="high"?"up":"down"); ch.dir="ltr"; ch.textContent=(r.st==="high"?"▲":"▼"); c.appendChild(ch);
      }
      if(r.lo&&r.hi){var rg=document.createElement("span"); rg.className="rg"; rg.textContent=fmt(r.lo)+" – "+fmt(r.hi); c.appendChild(rg)}
      grid.appendChild(c);
    });
    if(window.TA_stack) stackH=TA_stack.add(grid);
  }
  function skeleton(){unstack(); grid.innerHTML='<div class="rate card sk"></div><div class="rate card sk"></div><div class="rate card sk"></div><div class="rate card sk"></div>'}
  function hhmm(){var d=new Date();return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)}
  
  var last=0, busy=false;
  function refresh(first){
    if(busy) return; busy=true; retry.classList.add("hidden");
    if(first) skeleton();
    
    var attempt = 0;
    var maxAttempts = 3; // تلاش ۳ باره در صورت خطا

    function doFetch() {
      attempt++;
      fetchList(cfg.url).then(function(tg){
        var by={}; pick(tg).forEach(function(r){by[r.d.code]=r});
        var items=[]; (cfg.show||["USD"]).forEach(function(c){ if(by[c]) items.push(by[c]) });
        if(!items.length) throw new Error("empty");
        render(items); last=Date.now();
        meta.textContent="آخر تحديث: "+hhmm()+" · المصدر: TGJU";
        busy=false;
      }).catch(function(e){
        if (attempt < maxAttempts) {
          setTimeout(doFetch, 2000); // اگر خطا داد، ۲ ثانیه صبر میکنه و دوباره تلاش میکنه
        } else {
          var code="NET"; try{ if(e&&e.name==="AbortError") code="TIMEOUT"; else if(e&&/^http/.test(e.message)) code=e.message.toUpperCase().replace(" ",""); else if(e&&e.message==="empty") code="EMPTY"; }catch(_){}
          if(!last){ unstack(); grid.innerHTML=""; meta.textContent=""; meta.appendChild(document.createTextNode("تعذّر تحميل الأسعار الآن. ")); var cd=document.createElement("small"); cd.dir="ltr"; cd.style.opacity=".6"; cd.textContent="["+code+"]"; meta.appendChild(cd); retry.classList.remove("hidden"); }
          else { meta.textContent="تعذّر التحديث، آخر أسعار محمّلة عند "+hhmm()+"."; }
          busy=false;
        }
      });
    }
    
    doFetch();
  }
  
  if(retry) retry.addEventListener("click",function(){refresh(true)});
  refresh(true);
  var every=Math.max(1,cfg.refreshMinutes||5)*60000;
  setInterval(function(){if(!document.hidden) refresh(false)},every);
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&Date.now()-last>every) refresh(false)});
})();
