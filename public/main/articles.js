/* Chess Empire /articles — topic chips filter the cards (without JS every card shows);
   the sticky mobile CTA and the compact WhatsApp button appear once the hero scrolls away. */
(function () {
  var d = document;
  var chips = d.querySelectorAll(".pa-chip"), items = d.querySelectorAll(".pa-list [data-cat]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      items.forEach(function (it) { it.hidden = f !== "all" && it.getAttribute("data-cat") !== f; });
    });
  });

  var sticky = d.getElementById("v2-sticky"), fab = d.getElementById("wa-fab"), hero = d.getElementById("top");
  if (sticky && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      var show = !es[0].isIntersecting;
      sticky.classList.toggle("is-shown", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      sticky.querySelectorAll("a").forEach(function (a) { a.tabIndex = show ? 0 : -1; });
      if (fab) fab.classList.toggle("is-compact", show);
    }).observe(hero);
  }
})();
