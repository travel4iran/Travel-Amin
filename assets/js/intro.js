(function(){
  var el=document.getElementById("intro"), root=document.documentElement;
  if(!el) return;
  if(!root.classList.contains("intro")){el.remove();return}
  var $=function(id){return document.getElementById(id)};
  var finished=false, timers=[];
  function later(fn,ms){timers.push(setTimeout(fn,ms))}
  function finish(){
    if(finished) return; finished=true;
    try{sessionStorage.setItem("ta_intro","1")}catch(e){}
    timers.forEach(clearTimeout);
    el.classList.add("leave");
    setTimeout(function(){root.classList.remove("intro"); if(el.parentNode) el.parentNode.removeChild(el)},850);
  }

  /* shrine skyline behind (cloned from hero) */
  function addSky(){try{var sk=document.querySelector(".skyline"); if(sk&&!finished){var c=sk.cloneNode(true); c.setAttribute("class","in-sky"); el.insertBefore(c,el.children[1])}}catch(e){}}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",addSky); else addSky();

  /* random Arab origin; times are illustrative */
  var ORIGINS=[
    {c:"BGW",n:"مطار بغداد الدولي",dur:115,off:30},
    {c:"KWI",n:"مطار الكويت الدولي",dur:140,off:30},
    {c:"DXB",n:"مطار دبي الدولي",dur:120,off:-30},
    {c:"DOH",n:"مطار حمد الدولي – الدوحة",dur:125,off:30},
    {c:"MCT",n:"مطار مسقط الدولي",dur:130,off:-30},
    {c:"BAH",n:"مطار البحرين الدولي",dur:130,off:30},
    {c:"RUH",n:"مطار الملك خالد الدولي – الرياض",dur:170,off:30}
  ];
  var o=ORIGINS[Math.floor(Math.random()*ORIGINS.length)];
  function pad(n){return (n<10?"0":"")+n}
  function fmt(m){m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60)}
  var dep=(5+Math.floor(Math.random()*17))*60+[0,15,30,45][Math.floor(Math.random()*4)];
  var arr=dep+o.dur+o.off;
  $("fromCode").textContent=o.c; $("fromName").textContent=o.n; $("fromTime").textContent=fmt(dep);
  $("toTime").textContent=fmt(arr);
  try{$("stampDate").textContent=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}catch(e){}

  /* flight 0 -> 100 */
  var arc=$("inArc"), trail=$("inTrail"), plane=$("inPlane"), num=$("inNum"), bar=$("inBar"), ring=$("inRing");
  $("ppLogo").src=$("inLogo").src;
  var len=arc.getTotalLength();
  trail.style.strokeDasharray=len; trail.style.strokeDashoffset=len;
  function setP(p){
    var a=Math.min(len,len*p), b=Math.min(len,len*p+1), pt=arc.getPointAtLength(a), pt2=arc.getPointAtLength(b);
    if(b===a){pt2=pt; pt=arc.getPointAtLength(Math.max(0,a-1))}
    var ang=Math.atan2(pt2.y-pt.y,pt2.x-pt.x)*180/Math.PI;
    plane.setAttribute("transform","translate("+pt.x+" "+pt.y+") rotate("+ang+") scale(1.5)");
    trail.style.strokeDashoffset=len*(1-p);
    num.textContent=Math.round(p*100); bar.style.width=(p*100)+"%"; ring.style.strokeDashoffset=351.86*(1-p);
  }
  setP(0);
  var T=2800, t0=0;
  function ease(x){return -(Math.cos(Math.PI*x)-1)/2}
  function frame(now){
    if(finished) return;
    if(!t0) t0=now;
    var x=Math.min(1,(now-t0)/T);
    setP(ease(x));
    if(x<1) requestAnimationFrame(frame); else arrived();
  }
  later(function(){requestAnimationFrame(frame)},350);

  function arrived(){
    $("toCard").classList.add("arrived");
    el.classList.add("arrived-all");
    $("inTitle").textContent="وصلنا! مطار مشهد الدولي";
    later(function(){el.classList.add("phase-pass")},400);
    later(function(){el.classList.add("open")},1000);
    later(function(){
      el.classList.add("stamped");
      var pp=$("pp"); pp.classList.add("shake");
      try{navigator.vibrate&&navigator.vibrate(35)}catch(e){}
    },1500);
    later(finish,2200);
  }
  /* زر التخطي + Escape */
  var sk=$("inSkip"); if(sk) sk.addEventListener("click",finish);
  document.addEventListener("keydown",function(e){if(e.key==="Escape") finish()});
  /* safety */
  later(finish,8000);
})();
