(() => {
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  window.ML_LABS = [
    {
      title:"Explore a sampled VAE code",
      prompt:"An encoder represents a left-on example by a latent normal distribution. Change the mean, spread and standardized noise draw to see precisely what the decoder receives.",
      controls:[
        {label:"Encoder mean μ",min:-2,max:2,step:0.1,value:1},
        {label:"Encoder standard deviation s",min:0.1,max:2,step:0.1,value:0.5},
        {label:"Standardized noise draw ε",min:-3,max:3,step:0.1,value:-1}
      ],
      run([mu,s,eps]) {
        const z=mu+s*eps;
        const left=sigmoid(z),right=sigmoid(-z);
        const kl=(mu*mu+s*s-1-Math.log(s*s))/2;
        const nll=-Math.log(left)-Math.log(1-right);
        return {labels:["P(left on)","P(right on)"],values:[left,right],
          explanation:"The sampled code is μ + sε = "+z.toFixed(3)+". For target [1, 0], the reconstruction loss at this draw is "+nll.toFixed(3)+" and KL to N(0,1) is "+kl.toFixed(3)+". Set μ = 0 and s = 1 to explore draws from the prior."};
      }
    },
    {
      title:"Add noise and follow the reverse estimates",
      prompt:"Start with +1 in a toy population of equally likely −1 and +1 signals. Compare successive forward measurements, then apply the toy model’s reverse updates from the last one. Predict whether the estimated sign will match the start.",
      controls:[
        {label:"Forward corruption steps",min:1,max:5,step:1,value:3},
        {label:"Retained signal power per step",min:0.2,max:0.9,step:0.1,value:0.6},
        {label:"First noise draw (other draws fixed)",min:-2,max:2,step:0.1,value:-0.5}
      ],
      run([steps,a,first]) {
        const draws=[first,0.8,-0.3,-1.1,0.2];
        const labels=["Clean"],values=[1];
        let y=1;
        for(let i=0;i<steps;i++) {
          y=Math.sqrt(a)*y+Math.sqrt(1-a)*draws[i];
          labels.push("Forward "+(i+1));values.push(y);
        }
        const last=y;
        for(let t=steps;t>=1;t--) {
          const b=Math.pow(a,t),c=Math.pow(a,t-1);
          const clean=Math.tanh(Math.sqrt(b)*y/(1-b));
          const residual=(y-Math.sqrt(b)*clean)/Math.sqrt(1-b);
          y=Math.sqrt(c)*clean+Math.sqrt(1-c)*residual;
          labels.push("Reverse to "+(t-1)); values.push(y);
        }
        return {labels,values,explanation:"The final noisy input is "+last.toFixed(3)+". The reverse calculation knows the two possible clean signs and the noise schedule, but cannot see the chosen forward draws. Its final estimate is "+y.toFixed(3)+"."};
      }
    }
  ];
})();
