/* Render each experiment from its numeric inputs and computed result. */
(() => {
  const make = (tag, text, parent) => {
    const node = document.createElement(tag);
    if (text !== null) node.textContent = text;
    parent.append(node);
    return node;
  };
  function format(value) {
    if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(2);
    return Number(value.toFixed(3)).toLocaleString("en-US", {maximumFractionDigits: 3});
  }
  function matrixTable(parent, result) {
    const table = make("table", null, parent);
    const columns = result.columnLabels ?? result.matrix[0].map((_,i) => String(i+1));
    const header = table.createTHead().insertRow();
    make("th", "", header);
    for (const name of columns) make("th", name, header).scope = "col";
    const body = table.createTBody();
    for (const [i, values] of result.matrix.entries()) {
      const row = body.insertRow();
      make("th", result.rowLabels?.[i] ?? String(i+1), row).scope = "row";
      for (const value of values) {
        const cell = make("td", format(value), row);
        cell.style.backgroundColor = "rgba(158,27,50," + (0.04 + 0.28 * Math.min(1, Math.abs(value))) + ")";
      }
    }
  }
  function chart(parent, labels, values) {
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    const percent = value => 100 * (value - lo) / (hi - lo || 1);
    for (const [index, value] of values.entries()) {
      const row = make("div", null, parent);
      row.className = "ml-chart-row";
      make("span", labels[index], row);
      const track = make("span", null, row);
      track.className = "ml-chart-track";
      track.setAttribute("aria-hidden", "true");
      track.style.setProperty("--zero", percent(0) + "%");
      const bar = make("i", null, track);
      bar.style.left = percent(Math.min(0,value)) + "%";
      bar.style.width = Math.abs(percent(value) - percent(0)) + "%";
      make("strong", format(value), row);
    }
  }
  for (const target of document.querySelectorAll("[data-experiment]")) {
    const lab = window.ML_LABS[Number(target.dataset.experiment)];
    if (target.closest(".inline-lab")) make("h3", lab.title, target);
    make("p", lab.prompt, target);
    const controls = make("div", null, target);
    controls.className = "ml-lab-controls";
    const sliders = lab.controls.map((c,i) => {
      const group = make("div", null, controls);
      const label = make("label", c.label, group);
      const id = "experiment-" + target.dataset.experiment + "-input-" + i;
      label.htmlFor = id;
      const output = make("output", String(c.value), group);
      output.setAttribute("for", id);
      const input = make("input", null, group);
      Object.assign(input, {id, type:"range", min:c.min, max:c.max, step:c.step, value:c.value});
      input.addEventListener("input", () => { output.value = input.value; render(); });
      return input;
    });
    const results = make("div", null, target);
    results.className = "ml-lab-results";
    const explanation = make("p", null, target);
    explanation.setAttribute("role","status");
    function render() {
      const result = lab.run(sliders.map(input => Number(input.value)));
      results.replaceChildren();
      chart(results, result.labels, result.values);
      if (result.matrix) matrixTable(results, result);
      window.renderMLPlot(results, result);
      explanation.textContent = result.explanation;
    }
    render();
  }
})();
