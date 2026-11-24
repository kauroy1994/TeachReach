(() => {
  const noisy = [[0,0],[1,0],[2,1],[3,0],[4,1]];
  function localVotes(x,k) {
    return [...noisy].sort((a,b) => Math.abs(a[0]-x)-Math.abs(b[0]-x) || a[0]-b[0]).slice(0,k);
  }
  function fraction(rows) { return rows.reduce((sum,row) => sum + row[1],0)/rows.length; }
  function predictionSteps(bounds, classify) {
    const points = [];
    for (let i=1;i<bounds.length;i++) {
      const left=bounds[i-1], right=bounds[i];
      const y=classify((left+right)/2);
      points.push({x:left,y}, {x:right,y});
    }
    return points;
  }
  window.ML_LABS = [
    {
      title:"Compare a neighborhood with a tree leaf",
      prompt:"Move the query slowly along the hours axis. Watch which neighboring records and which leaf supply the two predictions. Then change the size of the neighborhood.",
      controls:[{label:"Query hours",min:0,max:4,step:0.1,value:2.1},
        {label:"Number of neighbors k",min:1,max:5,step:2,value:3},
        {label:"Stump splits below this hour",min:0.5,max:3.5,step:1,value:1.5}],
      run([x,k,split]) {
        const neighbors=localVotes(x,k), leaf=noisy.filter(([u]) => (u<split)===(x<split));
        const knn=fraction(neighbors), tree=fraction(leaf);
        // A neighbor ordering can only change at a midpoint of two training hours.
        const midpoints=noisy.flatMap(([a],i) => noisy.slice(i+1).map(([b]) => (a+b)/2));
        const bounds=[...new Set([0,...midpoints,4])].sort((a,b) => a-b);
        const plot={title:"Predicted class across the hours axis",xLabel:"Study hours",yLabel:"Predicted or observed class",
          xRange:[-0.15,4.15],yRange:[-0.2,1.2],xTicks:[0,1,2,3,4],yTicks:[0,1],series:[
            {label:"kNN class",kind:"line",points:predictionSteps(bounds,u => Number(fraction(localVotes(u,k))>0.5))},
            {label:"Tree class",kind:"line",dashed:true,points:predictionSteps([0,split,4],u =>
              Number(fraction(noisy.filter(([h]) => (h<split)===(u<split)))>0.5))},
            {label:"Query hour",kind:"line",color:"#734483",points:[{x,y:-0.15},{x,y:1.15}]},
            {label:"Other records",kind:"points",color:"#7a8085",points:noisy.filter(row => !neighbors.includes(row)).map(([x,y]) => ({x,y}))},
            {label:"Selected neighbors",kind:"points",color:"#006d77",points:neighbors.map(([x,y]) => ({x,y}))}
          ]};
        return {plot,labels:["kNN positive votes (%)","Tree leaf positives (%)"],values:[100*knn,100*tree],
          explanation:`Training hours 0,1,2,3,4 have labels 0,0,1,0,1. Nearest hours: ${neighbors.map(r=>r[0]).join(", ")}. Their positive fraction is ${knn.toFixed(2)}, predicting class ${Number(knn>0.5)}. The leaf contains hours ${leaf.map(r=>r[0]).join(", ")} and predicts ${Number(tree>0.5)}. A tied leaf predicts 0 here. Equal-distance neighbors are ordered by smaller hour.`};
      }
    },
    {
      title:"Measure a margin and combine three boundaries",
      prompt:"On the clean four-row sample, move a candidate separating threshold. Which choice maximizes its smaller gap? Then move the unlabeled query and see whether two other classifiers agree with the candidate.",
      controls:[{label:"Candidate threshold (hours)",min:1.1,max:2.9,step:0.1,value:2},
        {label:"Query hours",min:0,max:4,step:0.1,value:2.2}],
      run([t,x]) {
        const left=t-1, right=3-t;
        const nearest = x<=2 ? 0:1;
        const stump=Number(x>=1.6), linear=Number(x>=t);
        const vote=Number(nearest+stump+linear>=2);
        const gapY=0.5;
        const plot={title:"Distance from the boundary to each nearest class",xLabel:"Study hours",yLabel:"Training class",
          xRange:[-0.15,4.15],yRange:[-0.15,1.15],xTicks:[0,1,2,3,4],yTicks:[0,1],series:[
            {label:"Gap to hour 1",kind:"line",color:"#006d77",points:[{x:1,y:gapY},{x:t,y:gapY}]},
            {label:"Gap to hour 3",kind:"line",color:"#734483",points:[{x:t,y:gapY},{x:3,y:gapY}]},
            {label:"Candidate boundary",kind:"line",color:"#9e1b32",points:[{x:t,y:-0.1},{x:t,y:1.1}]},
            {label:"Query hour",kind:"line",color:"#525961",dashed:true,points:[{x,y:-0.1},{x,y:1.1}]},
            {label:"Training records",kind:"points",points:[[0,0],[1,0],[3,1],[4,1]].map(([x,y]) => ({x,y}))}
          ]};
        return {plot,labels:["Gap to negative at 1 h","Gap to positive at 3 h","Smaller gap (margin)"],values:[left,right,Math.min(left,right)],
          explanation:`The records are (0,0), (1,0), (3,1), (4,1). The widest margin is at t=2. At the selected t, the margin is ${Math.min(left,right).toFixed(1)} hour. For a query at ${x} hours, the nearest neighbor votes ${nearest}, the tree splitting at 1.6 votes ${stump}, and the candidate line votes ${linear}. Their majority is ${vote}. The true query label is unknown. Nearest ties choose the smaller hour.`};
      }
    }
  ];
})();
