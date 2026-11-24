(() => {
  // [name, hours, sets, score], identical to the notebook.
  const train = [["Ava",2,3,60],["Ben",4,1,70],["Cam",5,2,75],["Dee",0,1,52],["Eli",1,0,52],["Fin",3,2,66]];
  const validation = [["Ira",2,0,61],["Jo",4,3,69]];
  const test = [["Rin",1,1,58],["Sol",3,1,67],["Tay",5,3,68],["Uma",4,0,75]];
  const mean = numbers => numbers.reduce((total, x) => total+x, 0)/numbers.length;
  const center = mean(train.map(row => row[1]));
  const baseline = mean(train.map(row => row[3]));
  const products = train.map(row => (row[1]-center)*(row[3]-baseline));
  const squared = train.map(row => (row[1]-center)**2);
  const slope = mean(products)/mean(squared);
  const predict = h => baseline + slope*(h-center);
  window.ML_LABS = [
    {
      title:"Model-comparison workbench",
      prompt:"Reproduce the forecasts, then compare validation MAE before looking at the test cases. Select the split using 0 for training, 1 for validation and 2 for held-out test. Keep the original six fitting records fixed.",
      controls:[{label:"Evaluation split (0 train, 1 validation, 2 test)", min:0, max:2, step:1, value:1}],
      run([index]) {
        const rows = [train, validation, test][index];
        const forecasts = [() => baseline, (h,s) => 20 + 10*h + 5*s, h => predict(h)];
        const errors = forecasts.map(f => mean(rows.map(([,h,s,y]) => Math.abs(f(h,s)-y))));
        const title = ["Training","Validation","Held-out test"][index];
        return {labels:["Training mean","Module 01 rule","Fitted hours line"],values:errors,
          plot:{title:title+" records and score forecasts",xLabel:"Study hours",yLabel:"Exam score (points)",
            xRange:[0,5],yRange:[40,85],xTicks:[0,1,2,3,4,5],yTicks:[40,50,60,70,80],
            series:[
              {label:"Training mean",kind:"line",dashed:true,points:[{x:0,y:baseline},{x:5,y:baseline}]},
              {label:"Fitted line",kind:"line",points:[{x:0,y:predict(0)},{x:5,y:predict(5)}]},
              {label:"Observed scores",kind:"points",points:rows.map(([name,h,s,y])=>({x:h,y,label:name}))}
            ]},
          explanation:title + " MAE on " + rows.length + " students, in score points. The fitted line gives " + errors[2].toFixed(2) + " versus " + errors[0].toFixed(2) + " for the baseline. Use the validation split to choose a candidate and freeze it before reporting the test result."};
      }
    },
    {
      title:"End-to-end error analysis",
      prompt:"Inspect the four test predictions from the frozen hours model. Add a common logging offset to recorded hours and inspect which individual errors grow or shrink. A positive signed error means the model predicts too high.",
      controls:[
        {label:"Extra hours logged for each student", min:0, max:2, step:0.25, value:0},
        {label:"Error display (0 absolute, 1 signed)", min:0, max:1, step:1, value:0}
      ],
      run([offset, signed]) {
        const residuals = test.map(([,h,s,y]) => predict(h+offset)-y);
        const abs = residuals.map(Math.abs);
        const worst = abs.indexOf(Math.max(...abs));
        return {labels:test.map(row=>row[0]),values:signed ? residuals : abs,
          explanation:"The model is frozen. " + test[worst][0] + " has a largest absolute error of " + abs[worst].toFixed(2) + " points. Overall MAE is " + mean(abs).toFixed(2) + " and mean signed error is " + mean(residuals).toFixed(2) + ". Switching views preserves all four predictions."};
      }
    }
  ];
})();
