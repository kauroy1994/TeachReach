(()=>{
"use strict";
const $=id=>document.getElementById(id);
const number=id=>Number($(id).value);
const snippet={
normal:()=>[
"import torch",
"mu = torch.tensor("+number("meanSlider")+".0)",
"sigma = torch.tensor("+number("sigmaSlider")+".0)",
"threshold = torch.tensor("+number("thresholdSlider")+".0)",
"model = torch.distributions.Normal(mu, sigma)",
"probability = 1 - model.cdf(threshold)",
'print("P(Y > threshold):", probability.item())'
].join("\n"),
conditional:()=>[
"import torch",
"# Rows: practice >=3, practice <3. Columns: pass, fail.",
"counts = torch.tensor([["+number("countA")+".0, "+number("countB")+".0],",
"                       ["+number("countC")+".0, "+number("countD")+".0]])",
"n = counts.sum()",
"p_pass = counts[:,0].sum()/n if n>0 else float('nan')",
"group = counts[0].sum()",
"p_pass_given_practice = counts[0,0]/group if group>0 else float('nan')",
'print("P(Pass):", float(p_pass))',
'print("P(Pass | Practice>=3):", float(p_pass_given_practice))'
].join("\n"),
bayes:()=>{
  const positive=$("strongSignal").checked;
  const prior=number("priorSlider")/100;
  const lp=(positive?number("sensitivitySlider"):100-number("sensitivitySlider"))/100;
  const lf=(positive?number("fprSlider"):100-number("fprSlider"))/100;
  return [
  "import torch",
  "# Hypotheses: pass, fail. Evidence: "+(positive?"strong":"weak")+" test result.",
  "prior = torch.tensor(["+prior.toFixed(2)+", "+(1-prior).toFixed(2)+"])",
  "likelihood = torch.tensor(["+lp.toFixed(2)+", "+lf.toFixed(2)+"])",
  "weights = prior * likelihood",
  "posterior = weights / weights.sum()",
  'print("P(Pass | evidence):", posterior[0].item())'
  ].join("\n");
},
sampling:()=>[
"import torch",
"torch.manual_seed(27)",
"model = torch.distributions.Normal(55., 10.)",
"samples = model.sample(("+number("sampleSlider")+",))",
'print("Sample mean:", samples.mean().item())',
'print("Absolute error from model mean:", (samples.mean()-55.).abs().item())'
].join("\n"),
likelihood:()=>[
"import torch",
"observed = torch.tensor([42., 48., 55., 61., 69.])",
"mu = torch.tensor("+number("fitMeanSlider")+".0)",
"sigma = torch.tensor("+number("fitSigmaSlider")+".0)",
"model = torch.distributions.Normal(mu, sigma)",
"nll = -model.log_prob(observed).sum()",
'print("Negative log-likelihood:", nll.item())',
'print("Analytic MLE mean:", observed.mean().item())',
'print("Analytic MLE sigma:", observed.std(unbiased=False).item())'
].join("\n")
};
function refresh(){
 for(const section of document.querySelectorAll("[data-labpanel]")){
   const name=section.dataset.labpanel;
   const out=section.querySelector("[data-lab-code-text]");
   if(out && snippet[name])out.textContent=snippet[name]();
 }
}
for(const section of document.querySelectorAll("[data-labpanel]")){
 const button=section.querySelector("[data-lab-code-toggle]"),wrap=section.querySelector("[data-lab-code-wrap]"),copy=section.querySelector("[data-lab-code-copy]"),out=section.querySelector("[data-lab-code-text]");
 if(!button||!wrap||!copy||!out)continue;
 button.addEventListener("click",()=>{
   const show=wrap.hidden;
   wrap.hidden=!show;
   button.textContent=show?"Hide PyTorch example":"Show PyTorch example";
   button.setAttribute("aria-expanded",String(show));
 });
 copy.addEventListener("click",async()=>{
   try{await navigator.clipboard.writeText(out.textContent);copy.textContent="Copied ✓";}
   catch{copy.textContent="Select code to copy"}
 });
}
document.querySelectorAll('#meanSlider,#sigmaSlider,#thresholdSlider,#countA,#countB,#countC,#countD,#priorSlider,#sensitivitySlider,#fprSlider,#strongSignal,#weakSignal,#sampleSlider,#fitMeanSlider,#fitSigmaSlider').forEach(x=>{
  x.addEventListener("input",refresh);x.addEventListener("change",refresh);
});
refresh();
})();