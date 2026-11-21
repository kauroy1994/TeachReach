(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const variance = 100;
  const observed = 60;
  const minimumLoss = Math.log(Math.sqrt(2 * Math.PI * variance));
  const loss = mean => minimumLoss + (mean - observed) ** 2 / (2 * variance);
  const derivative = mean => (mean - observed) / variance;

  function drawCurve() {
    const mean = Number(byId("mean").value);
    const slope = derivative(mean);
    const x = value => 56 + (value - 45) * 15;
    const y = value => 175 - (value - minimumLoss) * 115;
    const points = [];
    for (let value = 45; value <= 75; value += 0.25) {
      points.push(x(value) + "," + y(loss(value)));
    }
    const tangentY = value => y(loss(mean) + slope * (value - mean));
    const left = Math.max(45, mean - 2.5);
    const right = Math.min(75, mean + 2.5);
    byId("curve").innerHTML = `
      <g fill="#354f60" font-size="14"><text x="8" y="18">NLL</text>
      <text x="4" y="${y(minimumLoss) + 4}">3.22</text>
      <text x="4" y="${y(minimumLoss + 1) + 4}">4.22</text>
      <text x="46" y="198">45</text><text x="271" y="198">60</text>
      <text x="495" y="198">75</text><text x="216" y="217">Predicted mean</text></g>
      <path d="M56 30V180H506" stroke="#82909a" fill="none"/>
      <polyline points="${points.join(" ")}" fill="none" stroke="#9e1b32" stroke-width="3"/>
      <line x1="${x(left)}" y1="${tangentY(left)}" x2="${x(right)}" y2="${tangentY(right)}" stroke="#284f70" stroke-width="4"/>
      <circle cx="${x(mean)}" cy="${y(loss(mean))}" r="5" fill="#284f70"/>`;
    byId("meanValue").value = mean;
    byId("slopeOutput").textContent = `At μ = ${mean}, NLL = ${loss(mean).toFixed(6)} and slope = ${slope.toFixed(3)}. ` +
      (slope < 0 ? "Increasing the mean slightly lowers the loss." :
        slope > 0 ? "Decreasing the mean slightly lowers the loss." : "The curve has a horizontal tangent at its minimum.");
  }

  function compareStep() {
    const rate = Number(byId("rate").value);
    const slope = derivative(55);
    const w1 = 10 - rate * slope * 2;
    const w2 = 5 - rate * slope * 3;
    const bias = 20 - rate * slope;
    const mean = 2 * w1 + 3 * w2 + bias;
    const rows = [
      ["Study-hours weight", 10, w1, 3], ["Practice-sets weight", 5, w2, 3],
      ["Bias", 20, bias, 3], ["Predicted mean", 55, mean, 2], ["Gaussian NLL", loss(55), loss(mean), 6]
    ];
    byId("rateValue").value = rate;
    const table = byId("updateRows");
    table.replaceChildren();
    for (const [label, before, after, digits] of rows) {
      const row = table.insertRow();
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = label;
      row.append(heading);
      row.insertCell().textContent = before.toFixed(digits);
      row.insertCell().textContent = after.toFixed(digits);
    }
    const result = rate === 0 ? "At rate zero the parameters stay at their starting values." :
      (mean > observed ? "The step crosses 60. " : "The mean moves toward 60. ") +
      (loss(mean) < loss(55) ? "The smaller distance reduces the loss." : "The larger distance increases the loss.");
    byId("diagnosis").textContent = result;
  }
  function measureSlope() {
    const h = Number(byId("trial").value);
    const after = loss(55 + h);
    const difference = after - loss(55);
    const container = byId("trialResult");
    container.replaceChildren();
    for (const line of [
      `Starting loss at 55 = ${loss(55).toFixed(7)}.`,
      `Trial loss at ${55 + h} = ${after.toFixed(7)}.`,
      `Change in loss = ${difference.toFixed(7)}. Divide by ${h} to get ${(difference/h).toFixed(5)} loss units per point.`
    ]) {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      container.append(paragraph);
    }
  }
  byId("trial").addEventListener("change", measureSlope);
  measureSlope();
  byId("mean").addEventListener("input", drawCurve);
  byId("rate").addEventListener("input", compareStep);
  drawCurve();
  compareStep();
})();
