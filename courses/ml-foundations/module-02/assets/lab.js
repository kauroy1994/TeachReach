(()=>{
"use strict";
const $=id=>document.getElementById(id);
const fmt=(x,n=3)=>Number(x).toFixed(n);
const normalPdf=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
function erf(x){const sign=x<0?-1:1;const a=Math.abs(x);const t=1/(1+.3275911*a);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-a*a);return sign*y;}
const cdf=(x,m,s)=>.5*(1+erf((x-m)/(s*Math.sqrt(2))));
function linePlot(fn,{low=20,high=90,color="#9E1B32",shadeFrom=null,shadeTo=null,title="Distribution"}={}){
 const left=40,right=620,base=242,top=20;let max=0;
 for(let j=0;j<=100;j++)max=Math.max(max,fn(low+(high-low)*j/100));
 max=Math.max(max,.001);
 const point=x=>[(left+(x-low)/(high-low)*(right-left)),base-fn(x)/max*(base-top)];
 const pts=Array.from({length:140},(_,j)=>point(low+(high-low)*j/139));
 let s='<svg class="plot" viewBox="0 0 665 296" role="img" aria-label="'+title+'"><rect x="0" y="0" width="665" height="296" rx="11" fill="#fff"/><path d="M40 14V242H620" stroke="#9baab6" stroke-width="2" fill="none"/>';
 if(shadeFrom!==null){const a=Math.max(low,shadeFrom),b=Math.min(high,shadeTo===null?high:shadeTo);if(a<b){const p=Array.from({length:100},(_,j)=>point(a+(b-a)*j/99));s+='<path d="M'+p[0][0]+','+base+' L'+p.map(x=>fmt(x[0],2)+','+fmt(x[1],2)).join(" L")+' L'+p[p.length-1][0]+','+base+' Z" fill="#e5adbd" fill-opacity=".7"/>';}}
 s+='<path d="M'+pts.map(x=>fmt(x[0],2)+','+fmt(x[1],2)).join(" L")+'" fill="none" stroke="'+color+'" stroke-width="4"/>';
 for(let k=0;k<=4;k++){const v=low+(high-low)*k/4;s+='<text x="'+fmt(left+(right-left)*k/4,1)+'" y="265" fill="#5d6977" font-size="13" text-anchor="middle">'+fmt(v,0)+'</text>';}
 s+='<text x="333" y="289" font-size="13" text-anchor="middle" fill="#566674">'+title+'</text></svg>';
 return s;
}
function slider(id){return Number($(id).value)}
function set(id,v){$(id).textContent=v}
function renderNormal(){
 const m=slider("meanSlider"),s=slider("sigmaSlider"),t=slider("thresholdSlider"),p=1-cdf(t,m,s);
 set("meanVal",m);set("sigmaVal",s);set("thresholdVal",t);
 set("normalTail",fmt(p,3));set("normalPercent",fmt(p*100,1)+"%");set("normalInterval",fmt(cdf(m+5,m,s)-cdf(m-5,m,s),3));
 $("normalPlot").innerHTML=linePlot(x=>normalPdf(x,m,s),{low:10,high:100,shadeFrom:t,title:"Score → probability density"});
 $("normalFormula").textContent="Y|x ~ Normal("+m+", "+s+"²).  P(Y>"+t+") = "+fmt(p,4)+".";
}
function renderCondition(){
 const a=slider("countA"),b=slider("countB"),c=slider("countC"),d=slider("countD");
 const n=a+b+c+d;
 [["countAval",a],["countBval",b],["countCval",c],["countDval",d],["totalCount",n]].forEach(x=>set(x[0],x[1]));
 [["cellA",a],["cellB",b],["cellC",c],["cellD",d],["rowFirst",a+b],["rowSecond",c+d],["colFirst",a+c],["colSecond",b+d],["cellN",n]].forEach(x=>set(x[0],x[1]));
 set("pOverall",n?fmt((a+c)/n,3):"—");
 set("pGroup",a+b?fmt(a/(a+b),3):"—");
 set("pReverse",a+c?fmt(a/(a+c),3):"—");
 set("pJoint",n?fmt(a/n,3):"—");
}
function renderBayes(){
 const prior=slider("priorSlider")/100,sens=slider("sensitivitySlider")/100,fp=slider("fprSlider")/100,signal=$("strongSignal").checked;
 const likePass=signal?sens:1-sens;
 const likeFail=signal?fp:1-fp;
 const numerator=prior*likePass,denom=numerator+(1-prior)*likeFail;
 const posterior=denom>0?numerator/denom:NaN;
 [["priorVal",fmt(prior*100,0)+"%"],["sensVal",fmt(sens*100,0)+"%"],["fprVal",fmt(fp*100,0)+"%"],["posteriorVal",fmt(posterior*100,1)+"%"],["evidenceVal",fmt(denom,3)]].forEach(x=>set(x[0],x[1]));
 $("posteriorBar").style.width=fmt(posterior*100,1)+"%";
 $("bayesFormula").textContent="P(Pass | "+(signal?"Strong":"Weak")+") = ["+fmt(prior,2)+" × "+fmt(likePass,2)+"] / "+fmt(denom,3)+" = "+fmt(posterior,3);
}
function rng(seed){let v=seed>>>0;return()=>{v=(1664525*v+1013904223)>>>0;return(v+.5)/4294967296;};}
const random=rng(2727),draws=Array.from({length:1200},()=>{const u=Math.max(1e-12,random()),v=random();return 55+10*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)});
function renderSampling(){
 const n=slider("sampleSlider");
 const a=draws.slice(0,n),m=a.reduce((x,y)=>x+y,0)/n;
 set("sampleN",n);set("sampleMean",fmt(m,2));set("sampleError",fmt(Math.abs(m-55),2));
 const b=Array(10).fill(0);for(const x of a){let k=Math.floor((x-15)/8);if(k>=0&&k<10)b[k]++;}
 const max=Math.max(1,...b);let svg='<svg class="plot" viewBox="0 0 665 296" role="img" aria-label="Histogram of simulated scores"><path d="M37 235H631" stroke="#9aabb8" stroke-width="2"/>';
 b.forEach((y,j)=>{let xx=44+j*57;svg+='<rect x="'+xx+'" y="'+(233-y/max*192)+'" width="42" height="'+(y/max*192)+'" rx="4" fill="'+(j===4?"#9E1B32":"#d39ba9")+'"/><text x="'+(xx+21)+'" y="258" text-anchor="middle" fill="#516273" font-size="12">'+(15+j*8)+'</text>';});
 svg+='<text x="331" y="282" fill="#5c6e79" font-size="13" text-anchor="middle">Simulated score bins · Normal(55, 10²)</text></svg>';
 $("samplePlot").innerHTML=svg;
}
function renderMLE(){
 const mu=slider("fitMeanSlider"),s=slider("fitSigmaSlider"),ys=[42,48,55,61,69],n=ys.length;
 const nll=n*Math.log(s*Math.sqrt(2*Math.PI))+ys.reduce((a,y)=>a+.5*((y-mu)/s)**2,0);
 const fitted=ys.reduce((a,y)=>a+y,0)/ys.length,variance=ys.reduce((a,y)=>a+(y-fitted)**2,0)/ys.length;
 set("fitMeanVal",mu);set("fitSigmaVal",s);set("fitNLL",fmt(nll,3));set("fitOptimal",fmt(fitted,1)+" / "+fmt(Math.sqrt(variance),2));
 const fn=x=>Math.exp(-.035*(ys.length*Math.log(s*Math.sqrt(2*Math.PI))+ys.reduce((a,y)=>a+.5*((y-x)/s)**2,0)-18));
 $("fitPlot").innerHTML=linePlot(fn,{low:35,high:75,title:"Candidate mean μ → relative likelihood",color:"#345978"});
}
function selectTab(id){
 document.querySelectorAll("[data-lab]").forEach(b=>{const active=b.dataset.lab===id;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
 document.querySelectorAll("[data-labpanel]").forEach(x=>x.hidden=x.dataset.labpanel!==id);
 try{history.replaceState(null,"",location.pathname+"#"+id)}catch{}
}
document.querySelectorAll("[data-lab]").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.lab)));
["meanSlider","sigmaSlider","thresholdSlider"].forEach(id=>$(id).addEventListener("input",renderNormal));
["countA","countB","countC","countD"].forEach(id=>$(id).addEventListener("input",renderCondition));
["priorSlider","sensitivitySlider","fprSlider"].forEach(id=>$(id).addEventListener("input",renderBayes));
["strongSignal","weakSignal"].forEach(id=>$(id).addEventListener("change",renderBayes));
$("sampleSlider").addEventListener("input",renderSampling);
["fitMeanSlider","fitSigmaSlider"].forEach(id=>$(id).addEventListener("input",renderMLE));
$("resetConditional").onclick=()=>{[["countA",36],["countB",9],["countC",22],["countD",33]].forEach(x=>$(x[0]).value=x[1]);renderCondition()};
renderNormal();renderCondition();renderBayes();renderSampling();renderMLE();
const t=location.hash.slice(1);selectTab(["normal","conditional","bayes","sampling","likelihood"].includes(t)?t:"normal");
})();