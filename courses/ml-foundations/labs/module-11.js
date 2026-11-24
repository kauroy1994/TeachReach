(() => {
  function attention(query, keys, lastKey) {
    const scores = keys.map((key, i) => i <= lastKey
      ? (key[0] * query[0] + key[1] * query[1]) / Math.sqrt(2)
      : -Infinity);
    const largest = Math.max(...scores);
    const masses = scores.map(s => Math.exp(s - largest));
    const sum = masses.reduce((a, b) => a + b, 0);
    return masses.map(m => m / sum);
  }
  const tokens = ["red 1", "blue 2", "red 3"];
  const colors = [[1, 0], [0, 1], [1, 0]];
  window.ML_LABS = [
    {
      title: "Attention-weight heatmap",
      prompt: "The three rows are queries for red, blue and red. The columns are possible sources. Predict which cell will brighten when you strengthen the blue key, then compare the selected row.",
      controls: [
        {label:"Strength of the middle blue key", min:0, max:4, step:0.25, value:1},
        {label:"Query position to inspect (1–3)", min:1, max:3, step:1, value:2}
      ],
      run([strength, position]) {
        const keys = [[1, 0], [0, strength], [1, 0]];
        const matrix = colors.map(q => attention(q, keys, 2));
        const weights = matrix[position - 1];
        const value = weights.reduce((total,w,i) => total + w * [8,2,6][i], 0);
        return {labels:tokens, values:weights, matrix, rowLabels:tokens, columnLabels:tokens,
          explanation:"Query "+position+" gives the middle value weight "+weights[1].toFixed(3)+". Mixing brightness readings [8, 2, 6] yields "+value.toFixed(3)+". Only a query with a nonzero blue coordinate responds to this change of key."};
      }
    },
    {
      title: "Causal mask and token position",
      prompt: "Predict what happens to the last column of the first row when the causal mask turns on. Then add position offsets and compare the two red rows with the mask off.",
      controls: [
        {label:"Causal mask (0 off, 1 on)",min:0,max:1,step:1,value:1},
        {label:"Position offset per step",min:0,max:1,step:0.1,value:0},
        {label:"Query position to inspect (1–3)",min:1,max:3,step:1,value:2}
      ],
      run([mask, offset, position]) {
        const rows = colors.map(([r,b],i) => [r + i*offset,b]);
        const matrix = rows.map((q,i) => attention(q,rows,mask ? i : 2));
        const weights = matrix[position - 1];
        return {labels:tokens,values:weights,matrix,rowLabels:tokens,columnLabels:tokens,
          explanation:"The first coordinate receives offsets [0, "+offset.toFixed(1)+", "+(2*offset).toFixed(1)+"]. Query "+position+" can read "+(mask ? position : 3)+" positions. The final column receives weight "+weights[2].toFixed(3)+" from this query."};
      }
    }
  ];
})();
