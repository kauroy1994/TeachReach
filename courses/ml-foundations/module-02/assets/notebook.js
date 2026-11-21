(()=>{
"use strict";
const $=id=>document.getElementById(id);
function escape(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function inline(s){
 return escape(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\x60([^\x60]+)\x60/g,"<code>$1</code>");
}
function renderMarkdown(source){
 const lines=source.replace(/\r/g,"").split("\n");let html="",list=false,table=[];
 function endList(){if(list){html+="</ul>";list=false}}
 function endTable(){
  if(!table.length)return;
  const rows=table.filter(l=>! /^\s*\|[\s:\-|]+\|\s*$/.test(l)).map(l=>l.trim().replace(/^\||\|$/g,"").split("|").map(x=>x.trim()));
  if(rows.length){html+='<div class="table-wrap"><table><thead><tr>'+rows[0].map(x=>"<th>"+inline(x)+"</th>").join("")+"</tr></thead><tbody>"+rows.slice(1).map(row=>"<tr>"+row.map(x=>"<td>"+inline(x)+"</td>").join("")+"</tr>").join("")+"</tbody></table></div>";}
  table=[];
 }
 for(const raw of lines){const line=raw.trim();
  if(line.startsWith("|")){endList();table.push(line);continue;}else endTable();
  if(!line){endList();continue}
  if(line.startsWith("### ")){endList();html+="<h3>"+inline(line.slice(4))+"</h3>"}
  else if(line.startsWith("## ")){endList();html+="<h2>"+inline(line.slice(3))+"</h2>"}
  else if(line.startsWith("# ")){endList();html+="<h1>"+inline(line.slice(2))+"</h1>"}
  else if(/^[-*] /.test(line)){if(!list){html+="<ul>";list=true}html+="<li>"+inline(line.slice(2))+"</li>"}
  else if(line==="\\["||line==="\\]"){endList();html+='<p class="formula">'+escape(line)+"</p>"}
  else {endList();html+="<p>"+inline(line)+"</p>"}
 }
 endList();endTable();return html;
}
async function showNotebook(){
 try{
  const r=await fetch("./ML_Foundations_Module2_Probability.ipynb",{cache:"no-cache"});
  if(!r.ok)throw Error("Notebook request failed: "+r.status);
  const nb=await r.json();if(!Array.isArray(nb.cells))throw Error("Notebook format not recognized");
  $("cellCount").textContent=nb.cells.length+" notebook cells";
  const frag=document.createDocumentFragment();
  nb.cells.forEach((cell,i)=>{
   const source=Array.isArray(cell.source)?cell.source.join(""):String(cell.source||"");
   const wrap=document.createElement("section");wrap.className="nb-cell "+(cell.cell_type==="code"?"code":"markdown");
   if(cell.cell_type==="code"){
      const header=document.createElement("div");header.className="nb-label";header.textContent="PYTHON · CELL "+(i+1);
      const pre=document.createElement("pre");pre.textContent=source;wrap.append(header,pre);
   }else{wrap.innerHTML=renderMarkdown(source)}
   frag.append(wrap);
  });
  $("notebookBody").replaceChildren(frag);
  $("loadStatus").textContent="The full notebook is available below. Run it in Colab to execute the code.";
  if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise();
 }catch(err){$("loadStatus").textContent="The notebook could not be loaded in this browser. Open the source notebook or Colab using the links above.";}
}
showNotebook();
})();