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
  const models = [
    {name:"Training mean", forecast:() => baseline},
    {name:"Module 01 rule", forecast:(h,s) => 20 + 10*h + 5*s},
    {name:"Fitted hours line", forecast:h => predict(h)}
  ];
  const mae = (model, rows) => mean(rows.map(([,h,s,y]) => Math.abs(model.forecast(h,s)-y)));
  // Keep the earlier candidate on ties, following the predeclared selection rule.
  const selected = models.reduce((best, model) => mae(model, validation) < mae(best, validation) ? model : best);
  window.ML_LABS = [
    {
      title:"Model-comparison workbench",
      prompt:"Reproduce the forecasts, then compare validation MAE before opening the test split. The training and validation views show all three candidates. The test view compares the validation winner with the predeclared baseline. The plot displays the forecasts that depend only on hours alongside the observed scores.",
      controls:[{label:"Evaluation split (0 train, 1 validation, 2 test)", min:0, max:2, step:1, value:1}],
      run([index]) {
        const rows = [train, validation, test][index];
        const shown = index === 2 ? [models[0], selected] : models;
        const errors = shown.map(model => mae(model, rows));
        const title = ["Training","Validation","Held-out test"][index];
        return {labels:shown.map(model => model.name),values:errors,
          plot:{title:title+" records and score forecasts",xLabel:"Study hours",yLabel:"Exam score (points)",
            xRange:[0,5],yRange:[40,85],xTicks:[0,1,2,3,4,5],yTicks:[40,50,60,70,80],
            series:[
              {label:"Training mean",kind:"line",dashed:true,points:[{x:0,y:baseline},{x:5,y:baseline}]},
              {label:"Fitted line",kind:"line",points:[{x:0,y:predict(0)},{x:5,y:predict(5)}]},
              {label:"Observed scores",kind:"points",points:rows.map(([name,h,s,y])=>({x:h,y,label:name}))}
            ]},
          explanation:title + " MAE on " + rows.length + " students, in score points. " + selected.name + " gives " + mae(selected, rows).toFixed(2) + " versus " + errors[0].toFixed(2) + " for the baseline. The validation ranking determines which rule enters the test comparison."};
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
