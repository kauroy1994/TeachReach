window.ML_LABS = [
  {
    title: "Find a neighboring trend in embedding space",
    prompt: "The query has coordinates [1, 0]. Give candidate A a direction and a length. Candidate B stays at [1, 1]. Which one is more similar to the query?",
    controls: [
      {label: "Candidate A angle (degrees from the query)", min: 0, max: 180, step: 15, value: 60},
      {label: "Candidate A length", min: 1, max: 5, step: 0.5, value: 2},
      {label: "Score (1 = cosine, 2 = dot product)", min: 1, max: 2, step: 1, value: 1}
    ],
    run([angle, length, metric]) {
      const radians = angle * Math.PI / 180;
      const x = length * Math.cos(radians);
      const y = length * Math.sin(radians);
      const cosine = metric === 1;
      const values = cosine ? [x / length, 1 / Math.sqrt(2)] : [x, 1];
      const difference = values[0] - values[1];
      const rank = Math.abs(difference) < 1e-9 ? "The two candidates tie." : (difference > 0 ? "A ranks first." : "B ranks first.");
      return {
        labels: ["Candidate A", "Candidate B"],
        values,
        explanation: "A has coordinates [" + x.toFixed(2) + ", " + y.toFixed(2) + "]. " + (cosine ? "Cosine divides the dot product by both vector lengths." : "Here the dot product equals the candidate’s first coordinate.") + " " + rank
      };
    }
  },
  {
    title: "Count a competing match",
    prompt: "An anchor’s true positive has similarity 0.8. Choose a competitor and a temperature. Predict how much of the match probability goes to the positive.",
    controls: [
      {label: "Competitor (1 = different trend, 2 = distinct record with same trend)", min: 1, max: 2, step: 1, value: 1},
      {label: "Temperature", min: 0.1, max: 2, step: 0.1, value: 1}
    ],
    run([choice, temperature]) {
      const negative = choice === 1 ? -0.2 : 0.9;
      const positiveWeight = Math.exp(0.8 / temperature);
      const negativeWeight = Math.exp(negative / temperature);
      const p = positiveWeight / (positiveWeight + negativeWeight);
      const loss = -Math.log(p);
      return {
        labels: ["Positive probability", "Competitor probability"],
        values: [p, 1 - p],
        explanation: "The supplied similarities are 0.8 and " + negative + ". Divide each by " + temperature.toFixed(1) + ", exponentiate and normalize. Positive probability = " + p.toFixed(3) + "; one-anchor loss = " + loss.toFixed(3) + ". " + (choice === 2 ? "The rival shares the trend. Training still pressures the encoder to separate these different records." : "Lower temperature concentrates more probability on the higher-scoring positive.")
      };
    }
  }
];
