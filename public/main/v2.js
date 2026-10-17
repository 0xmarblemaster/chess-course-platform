/* Chess Empire /v2 — WhatsApp signup form, worries accordion, sticky mobile CTA (ported from /v1). */
(function () {
  var d = document;
  var WHATSAPP = "77077872210";
  function waUrl(text) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text); }
  // Language follows <html lang>: ru | en | kk.
  var L = {
    ru: { hiChild: "Здравствуйте! Хочу записать ребёнка на бесплатный пробный урок.", hiAdult: "Здравствуйте! Хочу записаться на бесплатный пробный урок.",
      name: "Имя: ", age: "Возраст ребёнка: ", adult: "Возраст: взрослый", branch: "Филиал: ", help: "помогите выбрать", copied: "Скопировано", selected: "Выделено — скопируйте" },
    en: { hiChild: "Hello! I'd like to sign my child up for a free trial lesson.", hiAdult: "Hello! I'd like to sign up for a free trial lesson.",
      name: "Name: ", age: "Child's age: ", adult: "Age: adult", branch: "Branch: ", help: "please help me choose", copied: "Copied", selected: "Selected — copy it" },
    kk: { hiChild: "Сәлеметсіз бе! Баламды тегін сынақ сабаққа жазғым келеді.", hiAdult: "Сәлеметсіз бе! Тегін сынақ сабаққа жазылғым келеді.",
      name: "Аты: ", age: "Баланың жасы: ", adult: "Жасы: ересек", branch: "Филиал: ", help: "таңдауға көмектесіңіз", copied: "Көшірілді", selected: "Белгіленді — көшіріп алыңыз" }
  };
  var T = L[d.documentElement.lang] || L.ru;

  /* --- signup form → WhatsApp --- */
  var form = d.getElementById("v2-form"), done = d.getElementById("v2-done");
  var nameEl = d.getElementById("name"), age = d.getElementById("age"), branch = d.getElementById("branch");
  var lastMsg = "";
  function setErr(id, on) {
    var f = d.getElementById(id), input = f.querySelector("input,select");
    f.classList.toggle("is-invalid", on); f.querySelector(".v2-err").hidden = !on; input.setAttribute("aria-invalid", on ? "true" : "false");
  }
  [["f-name", nameEl], ["f-age", age], ["f-branch", branch]].forEach(function (p) {
    // text input clears on "input": clearing on blur would shift the layout under a click on the submit button
    p[1].addEventListener(p[1].tagName === "INPUT" ? "input" : "change", function () { if (p[1].value.trim()) setErr(p[0], false); });
  });
  function compose() {
    var adult = age.value === "adult";
    return [
      adult ? T.hiAdult : T.hiChild,
      T.name + nameEl.value.trim(),
      adult ? T.adult : T.age + age.value,
      T.branch + (branch.value === "help" ? T.help : branch.value)
    ].join("\n");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = [];
    if (nameEl.value.trim().length < 2) bad.push(["f-name", nameEl]);
    if (!age.value) bad.push(["f-age", age]);
    if (!branch.value) bad.push(["f-branch", branch]);
    ["f-name", "f-age", "f-branch"].forEach(function (id) { setErr(id, bad.some(function (b) { return b[0] === id; })); });
    if (bad.length) { bad[0][1].focus(); return; }
    lastMsg = compose();
    var again = d.getElementById("v2-wa-again");
    again.href = waUrl(lastMsg);
    again.click();
    d.getElementById("v2-msg").textContent = lastMsg;
    form.hidden = true; done.hidden = false; done.focus();
  });
  var copyBtn = d.getElementById("v2-copy");
  copyBtn.addEventListener("click", function () {
    function selectIt() { var r = d.createRange(); r.selectNodeContents(d.getElementById("v2-msg")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = T.selected; }
    try { navigator.clipboard.writeText(lastMsg).then(function () { copyBtn.textContent = T.copied; }, selectIt); } catch { selectIt(); }
  });
  d.getElementById("v2-edit").addEventListener("click", function () { done.hidden = true; form.hidden = false; nameEl.focus(); });

  /* --- worries: open cards on desktop, accordion (first open) on mobile --- */
  var worries = d.querySelectorAll(".v2-worry"), mobile = window.matchMedia("(max-width:820px)");
  function layoutWorries() { worries.forEach(function (w, i) { w.open = !mobile.matches || i === 0; }); }
  worries.forEach(function (w) { w.querySelector("summary").addEventListener("click", function (e) { if (!mobile.matches) e.preventDefault(); }); });
  mobile.addEventListener("change", layoutWorries);
  layoutWorries();

  /* --- sticky mobile CTA + desktop WhatsApp button: react to the hero leaving and #signup entering --- */
  var sticky = d.getElementById("v2-sticky"), fab = d.getElementById("wa-fab"), heroOut = false, signupIn = false;
  function updateSticky() {
    var show = heroOut && !signupIn;
    sticky.classList.toggle("is-shown", show);
    sticky.setAttribute("aria-hidden", show ? "false" : "true");
    sticky.querySelectorAll("a").forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    if (fab) { fab.classList.toggle("is-compact", heroOut); fab.classList.toggle("is-hidden", signupIn); }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; updateSticky(); }).observe(d.getElementById("top"));
    new IntersectionObserver(function (es) { signupIn = es[0].isIntersecting; updateSticky(); }).observe(d.getElementById("signup"));
  }

  /* --- founder letter: click-to-play reel; any video starting pauses every other one on the page --- */
  var reel = d.querySelectorAll("#about .v2-reel-video")[0];
  if (reel) {
    d.addEventListener("play", function (e) {
      d.querySelectorAll("video").forEach(function (v) { if (v !== e.target && !v.paused) v.pause(); });
    }, true);
    var reelPlay = reel.parentNode.querySelector(".v2-reel-play");
    reelPlay.addEventListener("click", function () {
      reel.controls = true; reelPlay.hidden = true;
      var p = reel.play(); if (p && p.catch) p.catch(function () {});
    });
    reel.addEventListener("ended", function () { reel.controls = false; reel.load(); reelPlay.hidden = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting && !reel.paused) reel.pause();
    }, { threshold: 0.5 }).observe(reel);
  }

  /* --- trainers: slider (Back/Next, counter, arrow keys) + click-to-play coach videos --- */
  var slider = d.querySelectorAll("#trainers .tr-slider")[0];
  if (slider) {
    var track = slider.querySelector(".trainers"), cards = track.querySelectorAll(".trainer");
    var prev = slider.querySelector('[data-tr="prev"]'), next = slider.querySelector('[data-tr="next"]'), count = slider.querySelector(".tr-count");
    var videos = track.querySelectorAll(".trainer-video");
    function step() { return cards[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0); }
    function pauseOthers(keep) { videos.forEach(function (v) { if (v !== keep && !v.paused) v.pause(); }); }
    function updateNav() {
      var x = track.scrollLeft, max = track.scrollWidth - track.clientWidth, s = step();
      var visible = Math.max(1, Math.round((track.clientWidth + s - cards[0].offsetWidth) / s));
      var atEnd = x >= max - 2, first = atEnd ? cards.length - visible : Math.round(x / s);
      prev.disabled = x <= 2;
      next.disabled = atEnd;
      count.textContent = (visible > 1 ? (first + 1) + "–" + (first + visible) : first + 1) + " / " + cards.length;
    }
    function move(dir) { pauseOthers(null); track.scrollBy({ left: dir * step() }); }
    prev.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
    slider.addEventListener("keydown", function (e) {
      if (e.target.tagName === "VIDEO" || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault(); move(e.key === "ArrowRight" ? 1 : -1);
    });
    track.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    updateNav();

    var seen = "IntersectionObserver" in window && new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting && !e.target.paused) e.target.pause(); });
    }, { threshold: 0.5 });
    videos.forEach(function (v) {
      var play = v.parentNode.querySelector(".trainer-play");
      play.addEventListener("click", function () {
        pauseOthers(v); v.controls = true; play.hidden = true;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      });
      v.addEventListener("play", function () { pauseOthers(v); });
      // ended: back to the poster and the play overlay
      v.addEventListener("ended", function () { v.controls = false; v.load(); play.hidden = false; });
      if (seen) seen.observe(v);
    });
  }
})();
