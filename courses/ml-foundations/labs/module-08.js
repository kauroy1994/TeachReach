window.ML_LABS = [
  {
    title:"Move an activation boundary",
    prompt:"A desk flags a reading surplus when reading hours minus practice hours exceeds a cutoff. Keep practice at two hours. Change the cutoff and predict which records activate. The bars give ReLU output magnitudes.",
    controls:[{label:"Surplus cutoff (hours)",min:-2,max:2,step:0.5,value:0}],
    run([cutoff]) {
      const reading = [0,1,2,3,4];
      const raw = reading.map(r => r-2-cutoff);
      const positive = reading.filter((r,i) => raw[i]>0);
      const left = Math.max(0, cutoff);
      const right = Math.min(4, 4 + cutoff);
      const row = r => ({x:r, y:2});
      return {
        labels:reading.map(r => r+" reading h"),
        values:raw.map(v => Math.max(0,v)),
        plot:{
          title:"Which study logs cross the activation boundary?",
          xLabel:"Reading hours", yLabel:"Practice hours",
          xRange:[-0.3,4.3], yRange:[-0.3,4.3], xTicks:reading, yTicks:reading, equalScale:true,
          series:[
            {label:"Exactly at cutoff", kind:"line", points:[{x:left,y:left-cutoff},{x:right,y:right-cutoff}]},
            {label:"Positive activation", kind:"points", points:positive.map(row)},
            {label:"Zero activation", kind:"points", points:reading.filter((r,i) => raw[i]<=0).map(row)}
          ]
        },
        explanation:"The decision boundary is reading = practice + cutoff, here "+(2+cutoff).toFixed(1)+" reading hours. A strict-positive step would flag "+(positive.length ? positive.join(", ")+" reading hours" : "none of these rows")+". ReLU also measures how far a row crosses the boundary."
      };
    }
  },
  {
    title:"Trace a gradient through one hidden unit",
    prompt:"Trace x=2 hours through a=w×2, h=ReLU(a), and prediction=1.5h. The label is 2. Change w or the learning rate. Predict the sign of the gradient before comparing the losses.",
    controls:[
      {label:"Hidden weight w",min:-1,max:2,step:0.1,value:0.5},
      {label:"Learning rate η",min:0,max:1,step:0.05,value:0.1}
    ],
    run([w,rate]) {
      const a = 2*w;
      const h = Math.max(0,a);
      const prediction = 1.5*h;
      const error = prediction-2;
      const derivative = a>0 ? 1 : 0;
      const gradient = error*1.5*derivative*2;
      const updated = w-rate*gradient;
      const nextPrediction = 1.5*Math.max(0,2*updated);
      return {
        labels:["Original half-squared loss","Loss after one update"],
        values:[error**2/2,(nextPrediction-2)**2/2],
        explanation:"a="+a.toFixed(2)+", h="+h.toFixed(2)+", prediction="+prediction.toFixed(2)+". The gradient is "+error.toFixed(2)+" × 1.5 × "+derivative+" × 2 = "+gradient.toFixed(2)+". The new weight is "+updated.toFixed(3)+" and the new prediction is "+nextPrediction.toFixed(3)+". At a=0 this experiment uses PyTorch’s zero slope."
      };
    }
  }
];
