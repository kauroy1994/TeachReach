(()=>{
"use strict";
const D=window.TR_M2,$=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function openTab(t){
 if(!["overview","slides","lab","practice","notebook","office","question"].includes(t))t="overview";
 document.body.dataset.currentTab=t;
 document.querySelectorAll("[data-tab]").forEach(b=>{const active=b.dataset.tab===t;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active))});
 document.querySelectorAll("[data-section]").forEach(p=>{p.hidden=p.dataset.section!==t});
 const frame=$({slides:"slidesFrame",lab:"labFrame",notebook:"notebookFrame",office:"officeFrame"}[t]);
 if(frame&&!frame.src)frame.src=frame.dataset.src;
 try{history.replaceState(null,"",location.pathname+"#"+t)}catch{}
 document.documentElement.scrollTop=0;
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.tab)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.open)));
window.addEventListener("hashchange",()=>openTab(location.hash.slice(1)));
window.addEventListener("message",e=>{if(e.origin===location.origin&&e.data?.type==="teachreach-open-question")openTab("question")});
const exercises=D.exercises;let activeExercise=0,selected=null;
const key="teachreach-m02-exercise-progress";
let solved={};try{solved=JSON.parse(localStorage.getItem(key)||"{}")}catch{solved={}}
function save(){try{localStorage.setItem(key,JSON.stringify(solved))}catch{}}
function feedback(message,type="note"){
 $("exerciseFeedback").hidden=false;$("exerciseFeedback").className=type;$("exerciseFeedback").textContent=message;
}
function renderMenu(){
 const list=$("exerciseMenu");list.replaceChildren();
 exercises.forEach((ex,j)=>{
   const b=document.createElement("button");b.type="button";
   b.className=(j===activeExercise?"active ":"")+(solved[ex.id]?"correct":"");
   b.textContent=(solved[ex.id]?"✓ ":"")+String(j+1).padStart(2,"0")+". "+ex.question;
   b.onclick=()=>choose(j);list.append(b);
 });
 const n=Object.keys(solved).filter(id=>solved[id]).length;
 $("progressText").textContent=n+" / "+exercises.length+" correct";
 $("progressBar").style.width=(n/exercises.length*100)+"%";
}
function choose(j){
 activeExercise=Math.max(0,Math.min(exercises.length-1,j));selected=null;const ex=exercises[activeExercise];
 $("exerciseNumber").textContent="EXERCISE "+(activeExercise+1)+" OF "+exercises.length+" · "+D.lessons.find(l=>l.id===ex.lesson)?.name;
 $("exerciseQuestion").textContent=ex.question;
 $("exerciseFeedback").hidden=true;
 const a=$("exerciseAnswers");a.replaceChildren();
 if(ex.type==="number"){const input=document.createElement("input");input.type="number";input.step="any";input.className="answer-number";input.id="numberResponse";input.placeholder="Enter a number";input.setAttribute("aria-label","Numerical answer");a.append(input);}
 else {a.className="answer-list";ex.options.forEach((option,k)=>{const b=document.createElement("button");b.type="button";b.textContent=String.fromCharCode(65+k)+". "+option;b.onclick=()=>{selected=k;a.querySelectorAll("button").forEach(v=>v.classList.toggle("selected",v===b))};a.append(b)})}
 if(ex.type==="number")a.className="";
 $("previousExercise").disabled=activeExercise===0;
 $("nextExercise").disabled=activeExercise===exercises.length-1;
 renderMenu();
}
$("checkExercise").onclick=()=>{
 const ex=exercises[activeExercise];let ok=false;
 if(ex.type==="number"){
   const input=$("numberResponse"),raw=input?.value?.trim();
   if(!raw){feedback("Enter a number first.");return}
   const n=Number(raw);
   ok=Number.isFinite(n)&&Math.abs(n-Number(ex.answer))<.0015;
 }else{
   if(selected===null){feedback("Choose an option before checking your answer.");return}
   ok=selected===ex.answer;
 }
 if(ok){solved[ex.id]=true;save();renderMenu();feedback("Correct! "+ex.explanation,"success")}
 else feedback("Not quite. "+ex.hint,"note");
};
$("hintExercise").onclick=()=>feedback(exercises[activeExercise].hint,"note");
$("explainExercise").onclick=()=>feedback(exercises[activeExercise].explanation,"signal");
$("previousExercise").onclick=()=>choose(activeExercise-1);
$("nextExercise").onclick=()=>choose(activeExercise+1);
choose(0);
openTab(location.hash.slice(1)||"overview");
})();