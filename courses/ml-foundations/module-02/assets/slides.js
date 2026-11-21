(()=>{
"use strict";
const all=window.TR_M2.slides;
const $=id=>document.getElementById(id);
const esc=s=>String(s===undefined?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let i=0,codeVisible=false;
function svgCurve(kind){
  const compareSpread=["normal","spread","variance","means"].includes(kind);
  const pdf=(x,mu=55,s=10)=>Math.exp(-.5*((x-mu)/s)**2)/(s*Math.sqrt(2*Math.PI));
  const scale=205/pdf(55,55,compareSpread?5:10);
  const xs=Array.from({length:131},(_,j)=>20+j*.5);
  const curve=(s,stroke,fill)=>{let pts=xs.map(x=>[(x-20)/65*590+16,225-pdf(x,55,s)*scale]);let path="M"+pts.map(p=>p.map(y=>y.toFixed(1)).join(",")).join(" L");return '<path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="3.5"/>'};
  const shade=xs.filter(x=>x>=60).map(x=>[(x-20)/65*590+16,225-pdf(x)*scale]);
  let html='<svg viewBox="0 0 620 270" role="img" aria-label="A probability density curve for possible scores, centered at fifty five."><defs><linearGradient id="g"><stop stop-color="#dfa8b6"/><stop offset="1" stop-color="#9e1b32"/></linearGradient></defs><path d="M16 225H610" stroke="#9fb0bd" stroke-width="2"/>';
  if(["threshold","interval","cdf","density","distribution"].includes(kind)){const pts=(kind==="interval"?xs.filter(x=>x>=50&&x<=60).map(x=>[(x-20)/65*590+16,225-pdf(x)*scale]):kind==="cdf"?xs.filter(x=>x<=60).map(x=>[(x-20)/65*590+16,225-pdf(x)*scale]):shade);html+='<path d="M'+pts[0][0].toFixed(1)+',225 L'+pts.map(p=>p.map(y=>y.toFixed(1)).join(",")).join(" L")+' L'+pts[pts.length-1][0].toFixed(1)+',225 Z" fill="#e1aebc" opacity=".65"/>';}
  html+=curve(10,"#9E1B32");
  if(compareSpread){html+=curve(5,"#345978")+curve(15,"#b77e42")+'<text x="400" y="36" font-size="13" fill="#345978">σ = 5</text><text x="400" y="54" font-size="13" fill="#b77e42">σ = 15</text><text x="400" y="72" font-size="13" fill="#9E1B32">σ = 10</text>';}
  html+='<line x1="'+(16+(55-20)/65*590)+'" y1="22" x2="'+(16+(55-20)/65*590)+'" y2="228" stroke="#9e1b32" stroke-dasharray="5 5"/><text x="328" y="247" fill="#762339" font-size="12">55</text><text x="12" y="248" fill="#6c7b83" font-size="12">20</text><text x="585" y="248" fill="#6c7b83" font-size="12">85</text><text x="245" y="264" fill="#596b78" font-size="12">Possible exam score</text></svg>';
  return html;
}
function cards(rows){
  return '<div class="probability-cards">'+rows.map((r,j)=>'<div style="background:'+(j%2?"#f0f4f7":"#f9edf0")+';border:1px solid #dce4e9;border-radius:13px;padding:18px;min-height:120px"><div style="font-size:11px;color:#687787;font-weight:800;margin-bottom:8px">'+esc(r[0])+'</div><div style="font-size:clamp(20px,2.3vw,28px);font-weight:900;color:#7f243d">'+esc(r[1])+'</div><div style="font-size:11px;color:#586a77">'+esc(r[2]||"")+'</div></div>').join("")+'</div>';
}
function diagram(key){
  if(["normal","density","distribution","threshold","interval","cdf","spread","variance","means"].includes(key))return svgCurve(key);
  if(["table","conditional","independence"].includes(key))return '<div style="padding:14px"><table class="viz-table"><thead><tr><th></th><th>Passed</th><th>Did not pass</th><th>Row total</th></tr></thead><tbody><tr><th>≥3 practice sets</th><td style="background:#e6f2eb;font-weight:900">36</td><td>9</td><td>45</td></tr><tr><th>&lt;3 practice sets</th><td>22</td><td>33</td><td>55</td></tr><tr><th>Column total</th><td>58</td><td>42</td><td>100</td></tr></tbody></table><p class="minor">Illustrative data for 100 students · not evidence of causality</p></div>';
  if(key==="posterior")return cards([["Prior","60%","P(Pass)"],["Weak signal","28.6%","P(Pass | Weak)"],["Strong signal","82.8%","P(Pass | Strong)"]]);
  if(key==="categories")return cards([["Low","20%","P(low)"],["Medium","50%","P(medium)"],["High","30%","P(high)"]]);
  if(["bayes","prior","test-likelihood"].includes(key))return cards([["Before the test","60%","P(Pass)"],["Strong test","80% / 25%","P(Strong|Pass) / P(Strong|Fail)"],["After strong result","82.8%","P(Pass|Strong)"]]);
  if(["bridge","matrix","pipeline","learning"].includes(key))return '<svg viewBox="0 0 620 250" role="img" aria-label="The Campus Study Coach transforms student measurements to a tensor prediction and then a probability distribution"><rect x="12" y="55" width="146" height="116" rx="16" fill="#f5dfe5"/><text x="85" y="85" fill="#70233a" font-size="16" font-weight="800" text-anchor="middle">Ava</text><text x="85" y="117" fill="#70233a" font-size="15" text-anchor="middle">2 hours</text><text x="85" y="142" fill="#70233a" font-size="15" text-anchor="middle">3 sets</text><path d="M162 114H222" stroke="#5a7384" stroke-width="3"/><path d="M212 107L223 114L212 121" stroke="#5a7384" fill="none" stroke-width="3"/><rect x="226" y="55" width="146" height="116" rx="16" fill="#e2ebf1"/><text x="299" y="85" fill="#244a66" font-size="15" font-weight="800" text-anchor="middle">Tensor model</text><text x="299" y="121" fill="#244a66" font-size="28" font-weight="800" text-anchor="middle">55</text><text x="299" y="143" fill="#244a66" font-size="12" text-anchor="middle">x·w + b</text><path d="M376 114H425" stroke="#5a7384" stroke-width="3"/><path d="M416 107L427 114L416 121" stroke="#5a7384" fill="none" stroke-width="3"/><rect x="430" y="55" width="175" height="116" rx="16" fill="#f9e9dd"/><path d="M445 145 Q460 135 471 112 T506 96 T544 107 T591 145" fill="none" stroke="#a84662" stroke-width="4"/><text x="518" y="78" fill="#7d3647" font-size="13" font-weight="800" text-anchor="middle">Possible outcomes</text><text x="308" y="219" fill="#5d6d79" font-size="14" font-weight="700" text-anchor="middle">What changes when we add uncertainty?</text></svg>';
  if(["binary","binomial","families"].includes(key))return cards([["One binary trial","0 or 1","Bernoulli"],["Count successes","0 … n","Binomial"],["Numerical score","Real value","Gaussian model"]]);
  if(["data","mle","loglik","likelihood","nll"].includes(key))return cards([["Observed scores","42, 48, 55","… 61, 69"],["Estimated mean","55","Average of scores"],["MLE variance","90","Divide by n = 5"]]);
  if(["sigmoid","calibration"].includes(key))return cards([["Linear score","z = xᵀw+b","Unbounded"],["Sigmoid","1 / (1+e⁻ᶻ)","Maps to (0,1)"],["Evaluation","NLL + calibration","Held-out cases"]]);
  if(["sampling","outcomes","sample","frequency","weighted","evidence"].includes(key))return cards([["Outcome 1","42","Possible score"],["Outcome 2","55","Possible score"],["Outcome 3","69","Possible score"]]);
  return cards([["Input vector","x = [2,3]","Measured features"],["Point prediction","55","Tensor operations"],["Probabilistic view","Y | x","Possible scores"]]);
}
function render(){
  const s=all[i];
  $('slideNum').textContent=String(i+1).padStart(2,"0");
  $('slideCount').textContent=(i+1)+" / "+all.length;
  $('progressBar').style.width=((i+1)/all.length*100).toFixed(1)+"%";
  $('previous').disabled=i===0;$('next').disabled=i===all.length-1;
  $('sectionLabel').textContent=s.section;
  $('slideTitle').textContent=s.title;
  $('slideLead').textContent=s.lead;
  $('mathBlock').textContent=s.math;
  $('explainText').textContent=s.explain||"Connect this representation to the same Campus Study Coach model introduced in Module 1.";
  $('visualArea').innerHTML=diagram(s.visual);
  $('checkText').textContent=s.check||"Explain the connection to Module 1.";
  $('codeWrap').hidden=!codeVisible;
  $('codeToggle').disabled=!Boolean(s.code?.trim());
  $('codeToggle').hidden=false;
  $('codeToggle').textContent=codeVisible?"Hide PyTorch example":"Show PyTorch example";
  $('codeToggle').setAttribute("aria-expanded",String(codeVisible));
  $('codeContent').textContent=s.code||"";
  $('noteContent').textContent=s.note||"Ask students to explain the diagram and formal notation.";
  $('notes').hidden=true;
  document.title=(i+1)+" / "+all.length+" · "+s.title+" · Module 02";
  try{history.replaceState(null,"",location.pathname+"#"+(i+1))}catch{}
}
function jump(j){i=clamp(j,0,all.length-1);codeVisible=false;render();$('slide').scrollTop=0;$('outline').hidden=true}
$('previous').onclick=()=>jump(i-1);
function toggleDeckFullscreen(){
 const root=document.documentElement;
 if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{})}
 else if(root.requestFullscreen){root.requestFullscreen().catch(()=>{})}
}
$('m2FullBtn').onclick=toggleDeckFullscreen;
document.addEventListener('fullscreenchange',()=>{$('m2FullBtn').textContent=document.fullscreenElement?'⤢ Exit full screen (F)':'⛶ Full screen (F)'});
$('next').onclick=()=>jump(i+1);
$('notesToggle').onclick=()=>{$('notes').hidden=!$('notes').hidden};
$('codeToggle').onclick=()=>{
  codeVisible=!codeVisible;
  $('codeWrap').hidden=!codeVisible;
  $('codeToggle').textContent=codeVisible?"Hide PyTorch example":"Show PyTorch example";
  $('codeToggle').setAttribute("aria-expanded",String(codeVisible));
};
$('codeCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText(all[i].code);$('codeCopy').textContent="Copied ✓";}
  catch{$('codeCopy').textContent="Select code to copy";}
};
$('outlineToggle').onclick=()=>{
  $('outline').hidden=!$('outline').hidden;
  if($('outline').hidden)return;
  $('outlineBody').replaceChildren();
  all.forEach((s,j)=>{
    const b=document.createElement("button");b.type="button";b.className=j===i?"active":"";
    b.textContent=String(j+1).padStart(2,"0")+". "+s.title;
    b.onclick=()=>jump(j);$('outlineBody').append(b);
  });
};
$('outlineClose').onclick=()=>{$('outline').hidden=true};
$('notesClose').onclick=()=>{$('notes').hidden=true};
document.addEventListener("keydown",e=>{
  if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();jump(i+1)}
  if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();jump(i-1)}
  if(e.key.toLowerCase()==="n")$('notesToggle').click();
  if(e.key.toLowerCase()==="g")$('outlineToggle').click();
  if(e.key.toLowerCase()==="f"){$("m2FullBtn").click()}
  if(e.key.toLowerCase()==="p"){$("codeToggle").click()}
  if(e.key==="Escape"){$('outline').hidden=true;$('notes').hidden=true}
});
const requested=Number(location.hash.replace("#",""));
i=Number.isInteger(requested)&&requested>0&&requested<=all.length?requested-1:0;
render();
})();