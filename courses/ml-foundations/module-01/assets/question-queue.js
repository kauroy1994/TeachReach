(()=>{'use strict';
const cfg=window.TEACHREACH_QUESTION_SERVICE||{}, $=id=>document.getElementById(id), localKey='teachreach-'+String(cfg.module||'module-01')+'-my-registered-questions';
let sending=false, busyTimer=null;
const localGet=()=>{try{return JSON.parse(sessionStorage.getItem(localKey)||'[]')}catch{return []}};
const localSave=items=>{try{sessionStorage.setItem(localKey,JSON.stringify(items))}catch{}};
function td(row,text){const e=document.createElement('td');e.textContent=String(text??'');row.append(e)}
function formatDate(s){const d=new Date(s);return Number.isNaN(+d)?String(s||'—'):d.toLocaleDateString()}
function ownRows(){let t=$('ownQuestionRows');if(!t)return;t.replaceChildren();let all=localGet();if(!all.length){let r=t.insertRow();let c=r.insertCell();c.colSpan=4;c.textContent='You have not registered a question from this device.';return}all.forEach(x=>{let r=t.insertRow();td(r,x.id);td(r,x.name);td(r,x.email);td(r,x.question)})}
function publicRows(rows){const b=$('questionRows');if(!b)return;b.replaceChildren();if(!rows.length){let r=b.insertRow();let c=r.insertCell();c.colSpan=5;c.textContent='No questions in the class register yet. Start the conversation!';return}rows.forEach(x=>{const r=b.insertRow();td(r,formatDate(x.date));td(r,x.student||'Student');td(r,x.question);td(r,x.lesson||String(cfg.module||'module-01'));let c=r.insertCell();let sp=document.createElement('span');sp.className='status-pending';sp.textContent=x.status||'Awaiting answer';c.append(sp)})}
function status(text){$('formStatus').textContent=text}
function queueStatus(text){$('queueStatus').textContent=text}
function loadShared(){ownRows();if(!cfg.url){publicRows([]);queueStatus('The shared class register will open after the instructor connects the question service. You can prepare your question here.');return}
const cb='teachreachQueueCallback_'+Math.random().toString(36).slice(2);
window[cb]=(data)=>{delete window[cb];if(data?.ok){publicRows(data.items||[]);queueStatus('Class register updated.')}else queueStatus('The class register could not be loaded. Refresh the page to try again.')};
let scr=document.createElement('script');scr.src=cfg.url+(cfg.url.includes('?')?'&':'?')+'action=list&module='+encodeURIComponent(cfg.module)+'&callback='+cb+'&t='+Date.now();scr.onerror=()=>{delete window[cb];queueStatus('The class register is unavailable right now. Please try again later.');scr.remove()};scr.onload=()=>scr.remove();document.head.append(scr)
}
function submit(e){e.preventDefault();if(sending)return;
if(!cfg.url){status('Your question is ready. The instructor is connecting the shared question register. Please return after it is enabled.');return}
const f=$('questionForm'),name=$('studentName').value.trim(),email=$('questionEmail').value.trim(),question=$('questionText').value.trim(),lesson=$('questionTopic').value;
if(name.length<2||question.length<8||!f.reportValidity())return;
const frameName='teachreach-question-receiver';let frame=document.getElementById(frameName);
if(!frame){frame=document.createElement('iframe');frame.name=frameName;frame.id=frameName;frame.hidden=true;frame.title='Question registration receipt';document.body.append(frame)}
const nonce='q'+Math.random().toString(36).slice(2);const form=document.createElement('form');form.method='POST';form.action=cfg.url;form.target=frameName;form.style.display='none';
const fields={name,email,question,lesson,module:cfg.module,course:cfg.course,nonce,website:''};Object.entries(fields).forEach(([k,v])=>{const i=document.createElement('input');i.name=k;i.value=v;form.append(i)});
document.body.append(form);sending=true;$('registerBtn').disabled=true;status('Registering your question…');
const handler=(ev)=>{if(!/^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)$/.test(ev.origin))return;if(ev.data?.type!=='teachreach-question-result'||ev.data.nonce!==nonce)return;cleanup();if(ev.data.ok){const id=ev.data.id;const list=localGet();list.unshift({id,name,email,question});localSave(list.slice(0,80));ownRows();f.reset();status('Registered successfully! Your confirmation number is '+id+'. Find your question in the class register below.');loadShared();}else status('We could not register your question. Please check your entries and retry.');};
function cleanup(){sending=false;$('registerBtn').disabled=false;clearTimeout(busyTimer);window.removeEventListener('message',handler);form.remove()}
window.addEventListener('message',handler);form.submit();busyTimer=setTimeout(()=>{cleanup();status('Registration has not been confirmed. Check the class register before trying again.')},17000)
}
$('questionForm')?.addEventListener('submit',submit);$('refreshQuestions')?.addEventListener('click',loadShared);loadShared();
})();