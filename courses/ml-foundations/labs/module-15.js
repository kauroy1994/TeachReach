window.ML_LABS = [
  {
    title:"Reliability diagram and uncertainty",
    prompt:"Five low-score attempts all receive probability 0.4 and two succeed. Ten high-score attempts share a forecast you can change. Change the number of observed successes and watch the high-bin point move on the diagram. Compare it with the diagonal where mean forecast equals observed frequency.",
    controls:[
      {label:"High-bin forecast", min:0.5, max:1, step:0.05, value:0.9},
      {label:"High-bin successes out of 10", min:0, max:10, step:1, value:6}
    ],
    run([forecast, successes]) {
      const observed = successes/10;
      const gap = forecast - observed;
      const verdict = Math.abs(gap) < 1e-9 ? "matches the observed frequency" : gap > 0 ? "overpredicts success" : "underpredicts success";
      const ece = 10/15 * Math.abs(gap);
      const brier = (successes*(1-forecast)**2 + (10-successes)*forecast**2)/10;
      return {labels:["Low: forecast","Low: observed","High: forecast","High: observed"],values:[0.4,0.4,forecast,observed],
        plot:{title:"Reliability diagram",xLabel:"Mean predicted probability",yLabel:"Observed success fraction",
          xRange:[0,1],yRange:[0,1],xTicks:[0,0.25,0.5,0.75,1],yTicks:[0,0.25,0.5,0.75,1],
          series:[
            {label:"Perfect calibration",kind:"line",dashed:true,points:[{x:0,y:0},{x:1,y:1}]},
            {label:"Observed bins",kind:"points",points:[{x:0.4,y:0.4,label:"Low bin, 5 attempts"},{x:forecast,y:observed,label:"High bin, 10 attempts"}]}
          ]},
        explanation:"Reliability points (mean forecast, observed frequency): (0.40, 0.40) and (" + forecast.toFixed(2) + ", " + observed.toFixed(2) + "). The high bin " + verdict + " in these ten cases. Two-bin ECE = " + ece.toFixed(3) + "; high-bin Brier score = " + brier.toFixed(3) + "."};
    }
  },
  {
    title:"Distribution shift and a logging error",
    prompt:"In this fictional stress test, the model underpredicts short-form scores by 2 points and long-form scores by 8. Choose the share of long-form cases. Then simulate missing practice sets in the long-form records, each lowering the prediction by another 5 points.",
    controls:[
      {label:"Long-form share (%)", min:0, max:100, step:10, value:20},
      {label:"Sets missing per long-form record", min:0, max:3, step:1, value:0}
    ],
    run([share, missing]) {
      const w = share/100, shortError = 2, longError = 8 + 5*missing;
      const original = (1-w)*shortError + w*8;
      const changed = (1-w)*shortError + w*longError;
      return {labels:["Short-form error","Long-form error after edit","Mix only: MAE","Mix and edit: MAE"],values:[shortError,longError,original,changed],
        explanation:"With " + share + "% long-form cases, mix alone gives " + original.toFixed(1) + " points MAE. The logging error adds " + (changed-original).toFixed(1) + " points to the average. All original errors here were underpredictions, so lowering a prediction further increases its absolute error."};
    }
  }
];
