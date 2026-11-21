(()=>{
"use strict";
const $=id=>document.getElementById(id);
const body=document.body;
const module=body.dataset.trModule;
function readLowData(){try{return localStorage.getItem("teachreach-lowdata")==="1"}catch{return false}}
function writeLowData(x){try{localStorage.setItem("teachreach-lowdata",x?"1":"0")}catch{}}
function initModule02(){
  const low=$("lowDataToggle"),menu=$("menuToggle"),nav=$("siteNav");
  if(!low||!menu||!nav)return;
  let enabled=readLowData();
  function update(){body.classList.toggle("low-data",enabled);low.setAttribute("aria-pressed",String(enabled));low.textContent=enabled?"Low-data: on":"Low-data mode"}
  low.addEventListener("click",()=>{enabled=!enabled;writeLowData(enabled);update()});
  menu.addEventListener("click",()=>{
    const expanded=nav.classList.toggle("open");
    menu.setAttribute("aria-expanded",String(expanded));
  });
  document.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>{
    nav.classList.remove("open");menu.setAttribute("aria-expanded","false");
  }));
  update();
}
if(module==="02" && body.classList.contains("tr-module-02"))initModule02();
function make(tag,cls,label){
  const element=document.createElement(tag);element.className=cls;
  if(label)element.textContent=label;
  return element;
}
function markFullscreen(btn,target){
  const fullscreen=document.fullscreenElement===target;
  btn.textContent=fullscreen?"⤢ Exit full screen":"⛶ Full screen";
  btn.setAttribute("aria-pressed",String(fullscreen));
}
async function toggleFullscreen(target,button,status){
  if(document.fullscreenElement===target){
    try{await document.exitFullscreen();status.textContent=""}catch{status.textContent="Use Escape to leave full screen."}
    return;
  }
  if(typeof target.requestFullscreen!=="function"){
    status.textContent="This browser does not support full screen here. Use Open in new tab instead.";
    return;
  }
  try{
    await target.requestFullscreen();
    status.textContent="";
  }catch(err){
    status.textContent="Full screen is blocked here. Open this view in a new tab instead.";
  }
}
function initEmbedControls(){
  const frames=[...document.querySelectorAll('iframe[id][data-src]')];
  for(const frame of frames){
    const section=frame.closest(".embed-page,[data-section]");
    const header=section?.querySelector(".embed-header");
    if(!header||header.querySelector(".tr-view-controls"))continue;
    section.classList.add("tr-embedded-view");
    frame.setAttribute("allowfullscreen","");
    frame.setAttribute("allow","fullscreen");
    const src=frame.dataset.src||frame.getAttribute("src")||"";
    const path=new URL(src,location.href).pathname;
    const existingLinks=[...header.querySelectorAll('a[target="_blank"]')];
    for(const a of existingLinks){
      try{if(new URL(a.getAttribute("href"),location.href).pathname===path)a.remove()}catch{}
    }
    const holder=make("div","tr-view-controls");
    const full=make("button","tr-view-button","⛶ Full screen");
    full.type="button";full.setAttribute("aria-pressed","false");
    full.setAttribute("aria-label","Show "+(frame.title||"learning content")+" in full screen");
    const newTab=make("a","tr-view-link","↗ Open in new tab");
    const standaloneURL=new URL(src,location.href);
    // The embedded view is not the full-page view: remove its embed-only layout parameter.
    standaloneURL.searchParams.delete("embed");
    newTab.href=standaloneURL.pathname+standaloneURL.search+standaloneURL.hash;
    newTab.target="_blank";newTab.rel="noopener noreferrer";
    newTab.setAttribute("aria-label","Open "+(frame.title||"learning content")+" in a new tab");
    const message=make("span","tr-control-status");message.setAttribute("role","status");
    message.style.cssText="display:block;flex-basis:100%;font-size:11px;color:#75243a;line-height:1.3;text-align:right";
    full.addEventListener("click",()=>{
      if(!frame.getAttribute("src"))frame.src=src;
      toggleFullscreen(frame,full,message);
    });
    document.addEventListener("fullscreenchange",()=>markFullscreen(full,frame));
    holder.append(full,newTab,message);
    header.append(holder);
  }
}
function initStandalone(){
  const header=document.querySelector("header.tr-resource-header,header.top,header.topbar,header.topnav,header.room-nav");
  if(!header)return;
  const holder=make("div","tr-standalone-toolbar");
  const destination=module==="02"?"./index.html":"./index.html";
  const back=make("a","tr-standalone-return","← Module "+(module||""));
  back.href=destination;
  const full=make("button","tr-standalone-full","⛶ Full screen");
  full.type="button";full.setAttribute("aria-pressed","false");
  const status=make("span","tr-control-status");
  status.setAttribute("role","status");
  status.style.cssText="font-size:11px;color:#7d2d43";
  full.addEventListener("click",()=>toggleFullscreen(document.documentElement,full,status));
  document.addEventListener("fullscreenchange",()=>markFullscreen(full,document.documentElement));
  holder.append(back,full,status);
  header.append(holder);
}
if(body.dataset.trStandalone==="true")initStandalone();
if(body.classList.contains("tr-module-01")||body.classList.contains("tr-module-02"))initEmbedControls();
})();