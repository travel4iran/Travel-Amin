(function(){
  var root=document.documentElement, s=null;
  try{s=localStorage.getItem("ta_theme")}catch(e){}
  if(s!=="dark"&&s!=="light"){
    try{s=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){s="light"}
  }
  root.setAttribute("data-theme",s);
  /* شاشة الدخول: مرة واحدة لكل جلسة، وفي الصفحة الرئيسية فقط، وليس مع تقليل الحركة */
  try{
    var base=new URL("../../",document.currentScript.src).pathname;
    var home=location.pathname===base||location.pathname===base+"index.html";
    var seen=sessionStorage.getItem("ta_intro")==="1";
    var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(home&&!seen&&!calm){
      root.classList.add("intro");
      setTimeout(function(){root.classList.remove("intro")},9000);
    }
  }catch(e){}
})();
