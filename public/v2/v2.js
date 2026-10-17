/* Chess Empire /v2 — WhatsApp signup form, worries accordion, sticky mobile CTA (ported from /v1). */
(function () {
  var d = document;
  var WHATSAPP = "77077872210";
  function waUrl(text) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text); }

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
      adult ? "Здравствуйте! Хочу записаться на бесплатный пробный урок." : "Здравствуйте! Хочу записать ребёнка на бесплатный пробный урок.",
      "Имя: " + nameEl.value.trim(),
      adult ? "Возраст: взрослый" : "Возраст ребёнка: " + age.value,
      "Филиал: " + (branch.value === "help" ? "помогите выбрать" : branch.value)
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
    function selectIt() { var r = d.createRange(); r.selectNodeContents(d.getElementById("v2-msg")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = "Выделено — скопируйте"; }
    try { navigator.clipboard.writeText(lastMsg).then(function () { copyBtn.textContent = "Скопировано"; }, selectIt); } catch { selectIt(); }
  });
  d.getElementById("v2-edit").addEventListener("click", function () { done.hidden = true; form.hidden = false; nameEl.focus(); });

  /* --- worries: open cards on desktop, accordion (first open) on mobile --- */
  var worries = d.querySelectorAll(".v2-worry"), mobile = window.matchMedia("(max-width:820px)");
  function layoutWorries() { worries.forEach(function (w, i) { w.open = !mobile.matches || i === 0; }); }
  worries.forEach(function (w) { w.querySelector("summary").addEventListener("click", function (e) { if (!mobile.matches) e.preventDefault(); }); });
  mobile.addEventListener("change", layoutWorries);
  layoutWorries();

  /* --- sticky mobile CTA: after the hero, hidden while #signup is on screen --- */
  var sticky = d.getElementById("v2-sticky"), heroOut = false, signupIn = false;
  function updateSticky() {
    var show = heroOut && !signupIn;
    sticky.classList.toggle("is-shown", show);
    sticky.setAttribute("aria-hidden", show ? "false" : "true");
    sticky.querySelector("a").tabIndex = show ? 0 : -1;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; updateSticky(); }).observe(d.getElementById("top"));
    new IntersectionObserver(function (es) { signupIn = es[0].isIntersecting; updateSticky(); }).observe(d.getElementById("signup"));
  }
})();
