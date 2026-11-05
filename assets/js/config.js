/* ===== الإعدادات المركزية (SITE_CONFIG) – عدّل هنا فقط ===== */
var SITE_CONFIG = {
  whatsapp: "989395464608",          // +98 939 546 4608 (بانتظار التأكيد النهائي)
  display:  "+98 939 546 4608",
  telegram: "https://t.me/travel_amin",
  defaultMsg: "مرحبًا، أرغب بالاستفسار عن خدماتكم.",
  /* أطباء حقيقيون متعاون معهم فقط. أضف عنصرًا لكل طبيب وسيظهر تلقائيًا على بطاقة التخصص:
     {spec:"أسنان", name:"د. ...", title:"أخصائي زراعة الأسنان", place:"المدينة / المركز", years:"15"}
     spec أحد: تجميل | أسنان | عقم | فحص */
  doctors: [],
  /* أسعار الصرف (TGJU). divisor=10 يحوّل الريال إلى تومان. proxy: عنوان وسيط (اختياري) إذا لم يسمح الخادم بـ CORS */
  rates: {
    show: ["USD","IQD","BHD","KWD","AED","SAR","QAR","OMR"],   /* الدولار + الدينار العراقي والبحريني والكويتي + الدرهم + الريال السعودي والقطري والعماني */
    url: "https://tgju.amirhossein.info/api/price/currency",
    proxy: "https://travelamin.mafia099x.workers.dev/",   /* Cloudflare Worker الخاص بك – يُستدعى أولًا */
    divisor: 10,
    refreshMinutes: 5,
    max: 12
  }
};
/* ============================================================= */
