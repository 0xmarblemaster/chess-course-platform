/* Branch picker (#branches): tabs → 2GIS map | branch card.
   Data from 2ГИС (10.10.2026). "Алматы 1" is the Сауранбаева 7/1 point (БЦ Sibel) next to the Алматы-1 station.
   Language follows <html lang>: ru | en | kk. */
(function () {
  var root = document.querySelector("[data-branch-picker]");
  if (!root) return;

  var WHATSAPP = "77077872210";
  var MAP = { city: "almaty", overviewZoom: 11, branchZoom: 15 };
  var LANG = { ru: "ru", en: "en", kk: "kk" }[document.documentElement.lang] || "ru";

  var T = {
    ru: { days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], closed: "выходной", gis: "Открыть в 2ГИС", route: "Маршрут",
      schedule: "Расписание групп", scheduleVal: "Подберём удобное время при записи", hours: "Часы работы", phone: "Телефон филиала",
      book: "Записаться в этот филиал", pickTime: "Подобрать время", all: "Все филиалы", loading: "Загружаем карту 2ГИС…",
      mapTitle: "Карта филиалов Chess Empire в 2ГИС", decimal: ",",
      rating: function (n) { var a = n % 10, b = n % 100; return n + " " + (a === 1 && b !== 11 ? "оценка" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "оценки" : "оценок") + " в 2ГИС"; },
      waBook: function (n, a) { return "Здравствуйте! Хочу записать ребёнка на пробный урок в филиал " + n + " (" + a + ")."; },
      waTime: function (n, a) { return "Здравствуйте! Подберите, пожалуйста, удобное время в филиале " + n + " (" + a + ")."; } },
    en: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], closed: "closed", gis: "Open in 2GIS", route: "Directions",
      schedule: "Group schedule", scheduleVal: "We'll find a convenient time when you sign up", hours: "Opening hours", phone: "Branch phone",
      book: "Sign up at this branch", pickTime: "Find a time", all: "All branches", loading: "Loading 2GIS map…",
      mapTitle: "Chess Empire branches on the 2GIS map", decimal: ".",
      rating: function (n) { return n + " rating" + (n === 1 ? "" : "s") + " on 2GIS"; },
      waBook: function (n, a) { return "Hello! I'd like to sign my child up for a trial lesson at the " + n + " branch (" + a + ")."; },
      waTime: function (n, a) { return "Hello! Could you help me find a convenient time at the " + n + " branch (" + a + ")?"; } },
    kk: { days: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"], closed: "демалыс", gis: "2ГИС-те ашу", route: "Бағыт",
      schedule: "Топтар кестесі", scheduleVal: "Жазылу кезінде ыңғайлы уақытты таңдаймыз", hours: "Жұмыс уақыты", phone: "Филиал телефоны",
      book: "Осы филиалға жазылу", pickTime: "Уақыт таңдау", all: "Барлық филиалдар", loading: "2ГИС картасы жүктелуде…",
      mapTitle: "Chess Empire филиалдары 2ГИС картасында", decimal: ",",
      rating: function (n) { return "2ГИС-те " + n + " баға"; },
      waBook: function (n, a) { return "Сәлеметсіз бе! Баламды " + n + " филиалына (" + a + ") сынақ сабағына жазғым келеді."; },
      waTime: function (n, a) { return "Сәлеметсіз бе! " + n + " филиалында (" + a + ") ыңғайлы уақыт таңдауға көмектесіңізші."; } }
  }[LANG];

  var WEEKDAYS = "09:00-18:00";
  var BRANCHES = [
    { id: "arena", gisId: "70000001030399258", lat: 43.262664, lon: 76.818421, rating: 4.9, ratings: 202, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Sat: "09:00-13:00", Sun: "09:00-13:00" },
      name: { ru: "Алматы Арена", en: "Almaty Arena", kk: "Алматы Арена" },
      address: { ru: "мкр. Нуркент, 7", en: "7 Nurkent microdistrict", kk: "Нұркент ш/а, 7" },
      building: { ru: "Almaty Arena", en: "Almaty Arena", kk: "Almaty Arena" },
      entrance: { ru: "2 этаж, блок D, каб. 5 и 6", en: "2nd floor, block D, rooms 5 & 6", kk: "2-қабат, D блогы, 5 және 6-кабинеттер" },
      district: { ru: "Алатауский р‑н", en: "Alatau district", kk: "Алатау ауданы" } },
    { id: "debut", gisId: "70000001104248570", lat: 43.250483, lon: 76.952242, rating: 5.0, ratings: 163, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Sat: "09:00-14:00", Sun: "09:00-14:00" },
      name: { ru: "Дебют", en: "Debut", kk: "Дебют" },
      address: { ru: "ул. Кабанбай батыра, 71", en: "71 Kabanbay Batyr St", kk: "Қабанбай батыр к-сі, 71" },
      district: { ru: "Медеуский р‑н", en: "Medeu district", kk: "Медеу ауданы" },
      note: { ru: "Здесь же — вечерние занятия для взрослых", en: "Evening classes for adults are held here too", kk: "Мұнда ересектерге арналған кешкі сабақтар да өтеді" } },
    { id: "halyk", gisId: "70000001061297172", lat: 43.288076, lon: 76.990837, rating: 4.9, ratings: 82, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Fri: "09:00-13:00", Sat: WEEKDAYS, Sun: WEEKDAYS },
      name: { ru: "Халык Арена", en: "Halyk Arena", kk: "Халық Арена" },
      address: { ru: "Кульджинский тракт, 2", en: "2 Kuldzha Highway", kk: "Құлжа тас жолы, 2" },
      building: { ru: "Halyk Arena", en: "Halyk Arena", kk: "Halyk Arena" },
      entrance: { ru: "2 этаж, каб. 193 и 195", en: "2nd floor, rooms 193 & 195", kk: "2-қабат, 193 және 195-кабинеттер" },
      district: { ru: "Медеуский р‑н", en: "Medeu district", kk: "Медеу ауданы" } },
    { id: "almaty1", gisId: "70000001055873518", lat: 43.336175, lon: 76.948426, rating: 5.0, ratings: 120, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Fri: "09:00-14:00", Sat: WEEKDAYS, Sun: WEEKDAYS },
      name: { ru: "Алматы 1", en: "Almaty 1", kk: "Алматы 1" },
      address: { ru: "ул. Сауранбаева, 7/1", en: "7/1 Sauranbayev St", kk: "Сауранбаев к-сі, 7/1" },
      building: { ru: "БЦ Sibel", en: "Sibel Business Centre", kk: "Sibel БО" },
      entrance: { ru: "3 этаж, офис 301", en: "3rd floor, office 301", kk: "3-қабат, 301-кеңсе" },
      district: { ru: "Турксибский р‑н", en: "Turksib district", kk: "Түрксіб ауданы" } },
    { id: "zhandosov", gisId: "70000001089892904", lat: 43.201787, lon: 76.849176, rating: 5.0, ratings: 25, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Sat: "09:00-14:00", Sun: "09:00-14:00" },
      name: { ru: "Жандосова 305", en: "Zhandosov 305", kk: "Жандосов 305" },
      address: { ru: "ул. Жандосова, 305", en: "305 Zhandosov St", kk: "Жандосов к-сі, 305" },
      entrance: { ru: "кабинет 7", en: "room 7", kk: "7-кабинет" },
      district: { ru: "Ауэзовский р‑н", en: "Auezov district", kk: "Әуезов ауданы" } },
    { id: "gagarin", gisId: "70000001112466521", lat: 43.204118, lon: 76.897401, rating: 4.9, ratings: 153, phone: "+77077872210",
      hours: { Mon: WEEKDAYS, Tue: WEEKDAYS, Wed: WEEKDAYS, Thu: WEEKDAYS, Sat: "09:00-14:00", Sun: "09:00-14:00" },
      name: { ru: "ЖК Gagarin Park", en: "Gagarin Park", kk: "Gagarin Park ТК" },
      address: { ru: "пр. Гагарина, 287/2", en: "287/2 Gagarin Ave", kk: "Гагарин даңғ., 287/2" },
      building: { ru: "ЖК Gagarin Park", en: "Gagarin Park residential complex", kk: "Gagarin Park ТК" },
      entrance: { ru: "1 этаж", en: "1st floor", kk: "1-қабат" },
      district: { ru: "Бостандыкский р‑н", en: "Bostandyk district", kk: "Бостандық ауданы" } }
  ];

  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function tr(field) { return field ? field[LANG] : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtHours(h) {
    var t = function (v) { return v ? v.split("-").map(function (x) { return x.replace(/^0/, ""); }).join("–") : T.closed; };
    var out = [], i = 0;
    while (i < 7) { var j = i; while (j + 1 < 7 && h[DAYS[j + 1]] === h[DAYS[i]]) j++; out.push([i === j ? T.days[i] : T.days[i] + "–" + T.days[j], t(h[DAYS[i]])]); i = j + 1; }
    return out;
  }
  function fmtPhone(p) { var d = p.replace(/\D/g, ""); return "+7 " + d.slice(1, 4) + " " + d.slice(4, 7) + "-" + d.slice(7, 9) + "-" + d.slice(9, 11); }
  function gisUrl(b) { return "https://2gis.kz/almaty/firm/" + b.gisId; }
  function routeUrl(b) { return "https://2gis.kz/almaty/directions/points/%7C" + b.lon + "%2C" + b.lat + "%3B" + b.gisId; }
  function waUrl(b, msg) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg(tr(b.name), tr(b.address))); }

  var IC = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>'
  };

  function detail(b) {
    var hrs = fmtHours(b.hours).map(function (r) { return "<li><span>" + r[0] + "</span><span>" + r[1] + "</span></li>"; }).join("");
    var meta = [tr(b.entrance), tr(b.district)].filter(Boolean).map(esc).join(" · ");
    return '' +
      '<div class="bd-head"><p class="eyebrow">Chess Empire</p><h3 class="bd-name">' + esc(tr(b.name)) + "</h3>" +
        '<a class="bd-rating" href="' + gisUrl(b) + '/tab/reviews" target="_blank" rel="noopener"><span aria-hidden="true">★</span> ' +
        b.rating.toFixed(1).replace(".", T.decimal) + " · " + esc(T.rating(b.ratings)) + "</a></div>" +
      '<div class="bd-where"><p><b>' + esc(tr(b.address)) + "</b>" + (b.building ? ", " + esc(tr(b.building)) : "") + "</p>" +
        (meta ? '<p class="bd-muted">' + meta + "</p>" : "") +
        (b.note ? '<p class="bd-note">' + esc(tr(b.note)) + "</p>" : "") +
        '<p class="bd-links"><a href="' + gisUrl(b) + '" target="_blank" rel="noopener">' + IC.pin + esc(T.gis) + "</a>" +
        '<a href="' + routeUrl(b) + '" target="_blank" rel="noopener">' + IC.route + esc(T.route) + "</a></p></div>" +
      '<dl class="bd-facts">' +
        "<div><dt>" + esc(T.schedule) + "</dt><dd>" + esc(T.scheduleVal) + "</dd></div>" +
        "<div><dt>" + esc(T.hours) + '</dt><dd><ul class="bd-hours">' + hrs + "</ul></dd></div>" +
        "<div><dt>" + esc(T.phone) + '</dt><dd><a class="bd-phone" href="tel:' + b.phone + '">' + fmtPhone(b.phone) + "</a></dd></div>" +
      "</dl>" +
      '<div class="bd-actions"><a class="btn btn-primary" href="' + waUrl(b, T.waBook) + '" target="_blank" rel="noopener">' + esc(T.book) + "</a>" +
        '<a class="btn btn-ghost" href="' + waUrl(b, T.waTime) + '" target="_blank" rel="noopener">' + esc(T.pickTime) + "</a></div>";
  }

  /* 2GIS free widget iframe (firmsonmap, no API key) — same URL scheme as v1 */
  function mountMap(box) {
    var lats = BRANCHES.map(function (b) { return b.lat; }), lons = BRANCHES.map(function (b) { return b.lon; });
    var overview = { lat: +((Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2).toFixed(6),
      lon: +((Math.min.apply(null, lons) + Math.max.apply(null, lons)) / 2).toFixed(6), zoom: MAP.overviewZoom };
    var org = BRANCHES.map(function (b) { return b.gisId; }).join(",");
    function url(pos) { return "https://widgets.2gis.com/widget?type=firmsonmap&options=" + encodeURIComponent(JSON.stringify({ pos: pos, opt: { city: MAP.city }, org: org })); }
    box.innerHTML = '<iframe title="' + esc(T.mapTitle) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
      '<div class="map-loading"><span>' + esc(T.loading) + '</span></div><button type="button" class="map-all" hidden>' + esc(T.all) + "</button>";
    var fr = box.querySelector("iframe"), loading = box.querySelector(".map-loading"), all = box.querySelector(".map-all"), timer;
    fr.addEventListener("load", function () { loading.hidden = true; });
    function go(pos) { clearTimeout(timer); timer = setTimeout(function () { loading.hidden = false; fr.src = url(pos); }, 250); all.hidden = pos === overview; }
    fr.src = url(overview);
    all.addEventListener("click", function () { go(overview); });
    return { focus: function (b) { go({ lat: b.lat, lon: b.lon, zoom: MAP.branchZoom }); } };
  }

  var tabs = root.querySelector(".br-tabs"), panel = root.querySelector(".bd"), map = mountMap(root.querySelector(".bmap"));
  BRANCHES.forEach(function (b, i) {
    var t = document.createElement("button");
    t.type = "button"; t.className = "br-tab"; t.id = "br-tab-" + b.id; t.textContent = tr(b.name);
    t.setAttribute("role", "tab"); t.setAttribute("aria-controls", panel.id);
    t.addEventListener("click", function () { select(b, true); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = BRANCHES[(i + d + BRANCHES.length) % BRANCHES.length];
      select(n, true); document.getElementById("br-tab-" + n.id).focus();
    });
    tabs.appendChild(t);
  });
  function select(b, focusMap) {
    tabs.querySelectorAll(".br-tab").forEach(function (t) { var on = t.id === "br-tab-" + b.id; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute("aria-labelledby", "br-tab-" + b.id);
    panel.innerHTML = detail(b);
    if (focusMap) map.focus(b);
  }
  select(BRANCHES[0], false);
  root.hidden = false;
})();
