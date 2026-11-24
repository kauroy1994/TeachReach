window.ML_LABS = [
  {
    title: "Trace three sensor windows",
    prompt: "The record is [1, 1, peak, end]. Predict which adjacent window has the largest rise or fall. Then choose a layer to inspect.",
    controls: [
      {label: "Third reading (peak)", min: 0, max: 6, step: 1, value: 3},
      {label: "Last reading (end)", min: 0, max: 6, step: 1, value: 2},
      {label: "Layer (1 = changes, 2 = rises, 3 = falls, 4 = pooled features)", min: 1, max: 4, step: 1, value: 2}
    ],
    run([peak, end, layer]) {
      const changes = [0, peak - 1, end - peak];
      const rises = changes.map(d => Math.max(0, d));
      const falls = changes.map(d => Math.max(0, -d));
      const strongest = [Math.max(...rises), Math.max(...falls)];
      const pooled = layer === 4;
      const values = [changes, rises, falls, strongest][layer - 1];
      const score = strongest[0] + strongest[1] - 2.5;
      return {
        labels: pooled ? ["Strongest rise", "Strongest fall"] : ["Readings 1–2", "Readings 2–3", "Readings 3–4"],
        values,
        explanation: "Signed differences are [" + changes.join(", ") + "]. The rise channel retains positive increases and the fall channel retains the magnitudes of decreases. After pooling, the readout score is " + strongest[0] + " + " + strongest[1] + " − 2.5 = " + score + "."
      };
    }
  },
  {
    title: "Follow a gradient through repeated blocks",
    prompt: "Each correction branch has slope a. Compare the original chain with a chain that copies its input around every branch. Predict the sign before changing the depth.",
    controls: [
      {label: "Branch slope a", min: -1, max: 0.5, step: 0.1, value: -0.2},
      {label: "Number of blocks", min: 1, max: 8, step: 1, value: 3}
    ],
    run([slope, depth]) {
      const plain = Math.pow(slope, depth);
      const residual = Math.pow(1 + slope, depth);
      return {
        labels: ["Plain gradient", "Residual gradient"],
        values: [plain, residual],
        explanation: "Over " + depth + " blocks, the plain multiplier is a raised to the number of blocks (" + plain.toPrecision(3) + "). Adding an identity route changes each local slope to 1 + a; multiplying gives " + residual.toPrecision(3) + ". A slope of −1 in every correction exactly cancels the direct route."
      };
    }
  }
];
