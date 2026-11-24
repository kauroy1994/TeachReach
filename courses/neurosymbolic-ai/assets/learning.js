/* CS 691 classroom interactions. Lesson content is rendered as static HTML. */
(() => {
  "use strict";
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const storageKey = "teachreach-cs691-practice-";
  const readSetting = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const writeSetting = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const embedded = new URLSearchParams(location.search).get("embed") === "1" && window.parent !== window;
  if (embedded) {
    document.querySelector(".resource-bar")?.setAttribute("hidden", "");
    for (const a of all("a[href]")) {
      const dest = new URL(a.href);
      if (dest.origin === location.origin && !a.getAttribute("href").startsWith("#")) a.target = "_top";
    }
  }
  for (const a of all("a.form-link")) { a.target = "_blank"; a.rel = "noopener"; }
  function loadPanelFrame() {
    const frame = one("[data-section]:not([hidden]) iframe[data-src]");
    if (frame && !frame.hasAttribute("src")) frame.src = frame.dataset.src;
  }
  if (one("[data-section]")) {
    loadPanelFrame();
    new MutationObserver(loadPanelFrame).observe(one("main"), {subtree:true, attributes:true, attributeFilter:["hidden"]});
  }

  function feedback(button, message) {
    let status = button.parentElement.querySelector(".action-status");
    if (!status) {
      status = document.createElement("span");
      status.className = "action-status"; status.setAttribute("role","status");
      button.after(status);
    }
    status.textContent = message;
  }
  for (const btn of all("[data-full]")) {
    const target = btn.dataset.full ? document.getElementById(btn.dataset.full) : document.documentElement;
    btn.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await target.requestFullscreen();
      } catch { feedback(btn,"Use Open in new tab for a larger view."); }
    });
    document.addEventListener("fullscreenchange", () => { btn.textContent = document.fullscreenElement === target ? "Exit full screen" : "Full screen"; });
  }
  for (const btn of all("[data-copy]")) btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(btn.parentElement.querySelector("code").textContent); feedback(btn,"Copied"); }
    catch { feedback(btn,"Select the code and copy it with your browser."); }
  });

  const slides = all("[data-slide]");
  if (slides.length) {
    const outline = one("#outline");
    let index = 0;
    function display() {
      const num = Number(location.hash.slice(1));
      index = Number.isInteger(num) && num >= 1 && num <= slides.length ? num - 1 : 0;
      slides.forEach((s,i) => { s.hidden = i !== index; });
      one("#slide-count").textContent = (index + 1) + " / " + slides.length;
      one("#back").disabled = index === 0;
      one("#next").disabled = index === slides.length - 1;
      one(".resource-body").scrollTop = 0;
      if (outline.open) outline.close();
    }
    function advance(offset) {
      const next = index + offset;
      if (next >= 0 && next < slides.length) location.hash = String(next + 1);
    }
    one("#back").addEventListener("click",() => advance(-1));
    one("#next").addEventListener("click",() => advance(1));
    one("[data-outline]").addEventListener("click",() => outline.showModal());
    one("[data-close]").addEventListener("click",() => outline.close());
    outline.addEventListener("click", e => { if (e.target.closest("a")) outline.close(); });
    window.addEventListener("hashchange",display);
    window.addEventListener("keydown", e => {
      if (e.altKey || e.ctrlKey || e.metaKey || outline.open || e.target.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); advance(e.key === "ArrowRight" ? 1 : -1); }
      if (e.key.toLowerCase() === "g") outline.showModal();
      if (e.key.toLowerCase() === "p") {
        const example = slides[index].querySelector("[data-example]");
        if (example) example.open = !example.open;
      }
    });
    display();
  }
  const select = one("#case-choice");
  if (select) select.addEventListener("change",() => all("[data-case]").forEach(c => {
    c.hidden = c.dataset.case !== select.value;
    c.querySelector("details").open = false;
  }));
  const diagnostic=one("[data-diagnostic]");
  if (diagnostic) {
    const pick = i => diagnostic.querySelector('input[value="' + i + '"]');
    const saved = readSetting(storageKey + diagnostic.dataset.module);
    if (["0","1","2"].includes(saved) && pick(saved)) pick(saved).checked = true;
    diagnostic.addEventListener("change",() => diagnostic.querySelectorAll("[data-feedback],[data-needed]").forEach(p => {p.hidden = true;}));
    diagnostic.addEventListener("submit", e => {
      e.preventDefault();
      const checked = diagnostic.querySelector("input:checked");
      diagnostic.querySelector("[data-needed]").hidden = Boolean(checked);
      diagnostic.querySelectorAll("[data-feedback]").forEach(p => {p.hidden = p.dataset.feedback !== checked?.value;});
      if (checked) writeSetting(storageKey + diagnostic.dataset.module, checked.value);
    });
  }
  const search = one("#faq-search");
  if (search) {
    const entries = all("[data-faq]");
    function openFromHash() {
      const answer = document.getElementById(location.hash.slice(1));
      if (answer?.matches("[data-faq]")) { answer.open = true; answer.scrollIntoView(); }
    }
    window.addEventListener("hashchange", openFromHash); openFromHash();
    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      for (const faq of entries) faq.hidden = !faq.textContent.toLowerCase().includes(term);
      one("#no-faq").hidden = entries.some(v => !v.hidden);
    });
    for (const btn of all("[data-listen]")) btn.addEventListener("click",() => {
      if (!window.speechSynthesis) {feedback(btn,"Narration is unavailable in this browser.");return;}
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(btn.closest("details").querySelector("p").textContent));
    });
    for (const btn of all("[data-stop]")) btn.addEventListener("click",() => window.speechSynthesis?.cancel());
    window.addEventListener("pagehide",() => window.speechSynthesis?.cancel());
  }
})();
