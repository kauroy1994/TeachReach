(() => {
  "use strict";
  // The outer module supplies navigation while viewing a resource inside it.
  // Restore the resource's own links when its iframe enters fullscreen.
  if (window.parent !== window) {
    try {
      const outer = window.parent.document;
      if (outer.getElementById("tr-global-nav")) {
        const sync = () => document.documentElement.classList.toggle("tr-inner-resource",
          outer.fullscreenElement !== window.frameElement && !document.fullscreenElement);
        sync();
        outer.addEventListener("fullscreenchange", sync);
        document.addEventListener("fullscreenchange", sync);
        window.addEventListener("pagehide", () => outer.removeEventListener("fullscreenchange", sync), {once:true});
      }
    } catch { /* Keep the home link visible in an external learning platform. */ }
  }
  const query = document.getElementById("lesson-search");
  if (!query) return;
  const filter = document.getElementById("course-filter");
  const stage = document.getElementById("stage-filter");
  const count = document.getElementById("lesson-count");
  function update() {
    const words = query.value.trim().toLowerCase().split(/\s+/);
    let matches = 0;
    for (const course of document.querySelectorAll("[data-course]")) {
      const allowed = !filter.value || filter.value === course.dataset.course;
      for (const group of course.querySelectorAll("[data-group]")) {
        for (const row of group.querySelectorAll("[data-lesson]")) {
          const title = "module " + row.querySelector("h4").textContent.toLowerCase();
          row.hidden = !allowed || (stage.value && stage.value !== group.dataset.group) || !words.every(word => title.includes(word));
          if (!row.hidden) matches++;
        }
        group.hidden = !group.querySelector("[data-lesson]:not([hidden])");
      }
      course.hidden = !course.querySelector("[data-group]:not([hidden])");
    }
    count.textContent = matches ? matches + (matches === 1 ? " module" : " modules") : "No matching modules. Try another title or clear the filters.";
  }
  query.closest(".directory-tools").hidden = false;
  query.addEventListener("input", update);
  stage.addEventListener("change", update);
  filter.addEventListener("change", update);
  document.getElementById("clear-filters").addEventListener("click", () => {
    filter.value = ""; stage.value = ""; query.value = ""; update(); query.focus();
  });
  update();
})();
