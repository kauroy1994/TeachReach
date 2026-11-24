(() => {
  window.ML_LABS = [
    {
      title:"Fit a line through the training averages",
      prompt:"Choose a slope. For that slope, the intercept is fitted to make the mean prediction equal the mean training score. Which slope minimizes training squared error?",
      controls:[{label:"Slope (score points per hour)",min:0,max:10,step:0.5,value:3}],
      run([w]) {
        const scores=[50,56,60], b=166/3-w;
        const prediction=scores.map((_,x) => b+w*x);
        const mse=scores.reduce((sum,y,x) => sum+(prediction[x]-y)**2,0)/scores.length;
        const plot={title:"Observed scores and fitted line",xLabel:"Study hours",yLabel:"Score (points)",
          xRange:[-0.1,2.1],yRange:[40,70],xTicks:[0,1,2],yTicks:[40,50,60,70],
          series:[
            {label:"Vertical residual",kind:"segments",dashed:true,segments:scores.map((y,x) => [{x,y},{x,y:prediction[x]}])},
            {label:"Fitted score",kind:"line",points:prediction.map((y,x) => ({x,y}))},
            {label:"Observed score",kind:"points",points:scores.map((y,x) => ({x,y}))}
          ]};
        return {plot,labels:["0 h observed","0 h fitted","1 h observed","1 h fitted","2 h observed","2 h fitted"],
          values:scores.flatMap((v,i) => [v,prediction[i]]),
          explanation:`The training means are 1 hour and 55.33 points. With slope ${w}, the fitted intercept is ${b.toFixed(2)}. Mean squared training loss is ${mse.toFixed(3)} squared points. Compare slopes on training records first. A slope of 5 gives the least-squares solution.`};
      }
    },
    {
      title:"Move a probabilistic decision boundary",
      prompt:"The logistic rule predicts success probability from hours. Move the intercept or decision threshold. Which one changes the probability at every hour?",
      controls:[{label:"Intercept b in z = b + x",min:-4,max:0,step:0.25,value:-2},
        {label:"Decision threshold (%)",min:10,max:90,step:5,value:50}],
      run([b,percent]) {
        const threshold=percent/100;
        const hours=[0,1,2,3,4];
        const probabilities=hours.map(x => 1/(1+Math.exp(-(b+x))));
        const boundary=Math.log(threshold/(1-threshold))-b;
        const series=[
          {label:"Success probability",kind:"line",points:Array.from({length:81},(_,i) => {
            const x=i/20; return {x,y:100/(1+Math.exp(-(b+x)))};
          })},
          {label:"Decision threshold",kind:"line",dashed:true,points:[{x:0,y:percent},{x:4,y:percent}]}
        ];
        if (boundary>=0 && boundary<=4) series.push({label:"Decision boundary",kind:"line",
          points:[{x:boundary,y:0},{x:boundary,y:percent}]});
        const plot={title:"Where predicted probability crosses the cutoff",xLabel:"Study hours",yLabel:"Success probability (%)",
          xRange:[0,4],yRange:[0,100],xTicks:hours,yTicks:[0,25,50,75,100],series};
        return {plot,labels:hours.map((h,i) => h+" h · class "+Number(probabilities[i]>=threshold)),
          values:probabilities.map(p => 100*p),
          explanation:`Bars show predicted percentages. At a cutoff of ${percent}%, classify a row as 1 when b + x ≥ log(p_cutoff/(1 − p_cutoff)), so the hours boundary is ${boundary.toFixed(2)}. Changing only the cutoff changes decisions when the boundary crosses an input, while the bar heights stay fixed.`};
      }
    }
  ];
})();
