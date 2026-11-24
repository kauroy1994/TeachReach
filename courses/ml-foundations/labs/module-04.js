(() => {
  const rows = [[0, 50], [1, 56], [2, 60], [3, 66]];
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  window.ML_LABS = [
    {
      title: "Compare a sample with the whole population",
      prompt: "At the first setting the sample contains Ava alone. Predict how each risk will change when you switch rules. Then grow the sample until it includes everyone.",
      controls: [
        {label:"Rule (0 = constant 60, 1 = line 50 + 5x)",min:0,max:1,step:1,value:0},
        {label:"First row (0–3, starting with zero hours)",min:0,max:3,step:1,value:2},
        {label:"Number of sample rows",min:1,max:4,step:1,value:1}
      ],
      run([rule, start, size]) {
        const losses = rows.map(([x, y]) => ((rule ? 50 + 5*x : 60) - y) ** 2);
        const indices = Array.from({length:size}, (_, i) => (start+i) % rows.length);
        const sample = mean(indices.map(i => losses[i]));
        const population = mean(losses);
        return {labels:["Sample mean loss","Population mean loss"],values:[sample,population],
          explanation:`Equally likely population hours are 0, 1, 2, 3. The sample takes consecutive rows, wrapping around. Selected hours: ${indices.join(", ")}. Sample losses: ${indices.map(i => losses[i]).join(", ")}. Average sample loss is ${sample.toFixed(2)} squared points. All four losses average ${population.toFixed(2)} squared points.`};
      }
    },
    {
      title: "Estimate average loss from different samples",
      prompt: "Keep a constant prediction of 60 and draw distinct records. Predict how widely the estimates can differ when you increase the sample size.",
      controls:[{label:"Number of distinct records in each sample",min:1,max:4,step:1,value:2}],
      run([size]) {
        const labels = [], values = [];
        for (let mask=1; mask<16; mask++) {
          const sample = rows.filter((row,i) => (mask & (1<<i)) !== 0);
          if (sample.length !== size) continue;
          labels.push("Hours " + sample.map(([x]) => x).join(", "));
          values.push(mean(sample.map(([,y]) => (60-y)**2)));
        }
        return {labels,values,explanation:`Each bar is the mean squared loss for one possible sample, weighting the ${labels.length} samples equally. Estimates range from ${Math.min(...values).toFixed(2)} to ${Math.max(...values).toFixed(2)} squared points. Their mean is ${mean(values).toFixed(2)}. At size four there is only one sample.`};
      }
    }
  ];
})();
