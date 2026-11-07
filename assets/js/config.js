/* ===== الإعدادات المركزية (SITE_CONFIG) – عدّل هنا فقط ===== */
var SITE_CONFIG = {
  whatsapp: "989395464608",          // +98 939 546 4608
  display:  "+98 939 546 4608",
  telegram: "https://t.me/travel_amin",
  defaultMsg: "مرحبًا، أرغب بالاستفسار عن خدماتكم.",
  /* أسعار الصرف (TGJU). divisor=10 يحوّل الريال إلى تومان. proxy: عنوان وسيط (اختياري) إذا لم يسمح الخادم بـ CORS */
  rates: {
    show: ["USD","IQD","BHD","KWD","AED","SAR","QAR","OMR"],   /* الدولار + الدينار العراقي والبحريني والكويتي + الدرهم + الريال السعودي والقطري والعماني */
    url: "https://tgju.amirhossein.info/api/price/currency",
    proxy: "https://travelamin-rate.mafia099x.workers.dev/",   /* Cloudflare Worker – المصدر الوحيد للأسعار. عند تغيير الاسم حدّث CSP في index.html و 404.html و _headers أيضًا */
    divisor: 10,
    refreshMinutes: 5,
    max: 12
  }
};
/* ============================================================= */
