(() => {
  window.ML_LABS = [
    {
      title:"Compare next-token decoding choices",
      prompt:"Start with weights 6, 3 and 1 for desk, door and shelf. Keep the same draw while changing temperature or top-k. Then vary the draw to see how probability becomes a sampled word.",
      controls:[
        {label:"Temperature",min:0.2,max:3,step:0.1,value:1},
        {label:"Top-k retained words",min:1,max:3,step:1,value:3},
        {label:"Draw on the unit interval",min:0,max:0.99,step:0.01,value:0.72}
      ],
      run([temperature,k,u]) {
        const words=["desk","door","shelf"];
        const mass=[6,3,1].map((w,i) => i < k ? Math.exp(Math.log(w)/temperature) : 0);
        const total=mass.reduce((a,b) => a+b,0);
        const values=mass.map(w => w/total);
        let cumulative=0;
        const selected=values.findIndex(p => {cumulative+=p;return u<cumulative;});
        return {labels:words,values,
          explanation:"Greedy chooses desk. Sampling uses adjacent intervals in word order; draw "+u.toFixed(2)+" selects "+words[selected]+". Moving the draw changes the selection while leaving all three probabilities fixed."};
      }
    },
    {
      title:"Train a two-context language model",
      prompt:"Eight desk-log pairs train two rows of logits. Each context occurs four times. Predict both rows at step zero, then train them and compare their desk probabilities with the observed fractions.",
      controls:[
        {label:"Desk targets among four open entries",min:0,max:4,step:1,value:3},
        {label:"Desk targets among four close entries",min:0,max:4,step:1,value:1},
        {label:"Gradient steps at learning rate 1",min:0,max:100,step:1,value:10}
      ],
      run([open,close,steps]) {
        const targets=[open/4,close/4];
        const probs=targets.map(target => {
          let difference=0;
          for(let i=0;i<steps;i++) {
            const p=1/(1+Math.exp(-difference));
            // Both logits change. Each context accounts for half the examples.
            difference += target - p;
          }
          return 1/(1+Math.exp(-difference));
        });
        const loss=probs.reduce((s,p,i) => s-targets[i]*Math.log(p)-(1-targets[i])*Math.log1p(-p),0)/2;
        return {labels:["Predicted after open","Observed after open","Predicted after close","Observed after close"],
          values:[probs[0],targets[0],probs[1],targets[1]],
          explanation:"Each bar is a probability or fraction for desk. Door receives the remaining probability. After "+steps+" updates the mean training cross-entropy is "+loss.toFixed(3)+" nats per token. These eight examples provide no held-out score."};
      }
    }
  ];
})();
