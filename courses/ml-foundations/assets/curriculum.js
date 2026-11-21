(()=>{
"use strict";
const body=document.body;
const tabs=[...document.querySelectorAll(".tr-curr-tabs button[data-tab]")];
const panels=[...document.querySelectorAll("[data-section]")];
const openTab=(name,updateURL=true)=>{
 if(!panels.length)return;
 if(!panels.some(p=>p.dataset.section===name))name="overview";
 for(const p of panels)p.hidden=p.dataset.section!==name;
 for(const b of tabs){
  const active=b.dataset.tab===name;
  b.classList.toggle("active",active);
  b.setAttribute("aria-selected",String(active));
  b.setAttribute("tabindex",active?"0":"-1");
 }
 body.dataset.currentTab=name;
 if(updateURL)history.replaceState(null,"",location.pathname+"#"+name);
 document.getElementById("siteNav")?.classList.remove("open");
 const toggle=document.getElementById("menuToggle");
 if(toggle)toggle.setAttribute("aria-expanded","false");
};
for(const b of tabs){
 b.addEventListener("click",()=>openTab(b.dataset.tab));
 b.addEventListener("keydown",e=>{
  if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;
  e.preventDefault();
  const n=tabs.indexOf(b);
  const k=e.key==="Home"?0:e.key==="End"?tabs.length-1:(n+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
  tabs[k].focus();openTab(tabs[k].dataset.tab);
 });
}
for(const b of document.querySelectorAll("[data-open]")){
 b.addEventListener("click",()=>openTab(b.dataset.open));
}
if(panels.length){
 openTab(location.hash.slice(1)||"overview",false);
 addEventListener("hashchange",()=>openTab(location.hash.slice(1),false));
}
const menu=document.getElementById("menuToggle");
if(menu)menu.addEventListener("click",()=>{
 const expanded=document.getElementById("siteNav").classList.toggle("open");
 menu.setAttribute("aria-expanded",String(expanded));
});
const low=document.getElementById("lowDataToggle");
if(low){
 let value=false;try{value=localStorage.getItem("teachreach-lowdata")==="1"}catch{}
 const render=()=>{body.classList.toggle("low-data",value);low.setAttribute("aria-pressed",String(value));low.textContent=value?"Low-data: on":"Low-data mode"};
 low.addEventListener("click",()=>{value=!value;try{localStorage.setItem("teachreach-lowdata",value?"1":"0")}catch{}render()});
 render();
}
})();