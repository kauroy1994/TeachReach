(()=>{
'use strict';
const $=id=>document.getElementById(id);
const seed=(window.TEACHREACH_FAQ_SEED||[]).filter(x=>x.approved!==false);
const voiceSupported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
const state={chosen:null,topic:'All',playing:false,playbackToken:0};
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ')}
function items(){const search=norm($('faqSearch').value);return seed.filter(x=>(state.topic==='All'||x.topic===state.topic)&&(!search||norm([x.question,x.topic,x.answer,(x.aliases||[]).join(' ')].join(' ')).includes(search)))}
function render(){
  const list=$('faqList');list.replaceChildren();
  const a=items();$('faqCount').textContent=a.length+' questions';
  if(!a.length)list.append(el('p','faq-empty','No matches yet. Register a question and the instructor can add a new answer.'));
  a.forEach(x=>{
    const b=el('button',x.id===state.chosen?.id?'active':'');
    b.type='button';b.append(el('span','',x.topic||'Concept'));
    b.append(document.createTextNode(x.question));b.onclick=()=>choose(x);list.append(b);
  });
}
function topics(){
  const a=['All',...new Set(seed.map(x=>x.topic||'General'))];$('topicFilters').replaceChildren();
  a.forEach(x=>{
    const b=el('button','room-topic'+(state.topic===x?' selected':''),x);
    b.type='button';b.onclick=()=>{state.topic=x;topics();render()};$('topicFilters').append(b);
  });
}
function displayStatus(message){$('voiceStatus').textContent=message}
function stop({resetStatus=true}={}){
  state.playbackToken++;
  if(voiceSupported)window.speechSynthesis.cancel();
  state.playing=false;$('stopVoice').disabled=true;
  $('avatarStage').classList.remove('speaking');
  $('voiceBtn').textContent='▶ Listen to answer';
  if(resetStatus)displayStatus(state.chosen?'Select Listen to hear this explanation.':'Choose a question to begin.');
}
function choose(x){
  stop({resetStatus:false});state.chosen=x;
  $('faqQuestion').textContent=x.question;
  $('faqAnswer').textContent=x.answer;
  $('faqFormal').textContent=x.formal||'See the matching classroom example.';
  $('faqCode').textContent=x.code||'# See the module notebook.';
  $('faqCheck').textContent=x.check||'Can you apply the idea to another example?';
  $('answerTopic').textContent=x.topic||'Topic';
  render();
  $('voiceBtn').disabled=!voiceSupported;
  displayStatus(voiceSupported?'Listen to the explanation with your device voice.':'Read the explanation below.');
}
function chooseVoice(){
  const voices=window.speechSynthesis.getVoices();
  return voices.find(v=>v.lang==='en-US'&&v.localService)
    ||voices.find(v=>v.lang==='en-US')
    ||voices.find(v=>/^en[-_]/i.test(v.lang)&&v.localService)
    ||voices.find(v=>/^en/i.test(v.lang))
    ||null;
}
function splitSpeech(text){
  const sentences=String(text||'').replace(/\\s+/g,' ').trim().match(/[^.!?]+[.!?]*|[^.!?]+$/g)||[];
  const chunks=[];
  for(const sentence of sentences){
    const s=sentence.trim();if(!s)continue;
    if(s.length<=190){chunks.push(s);continue;}
    const words=s.split(' ');let part='';
    for(const word of words){
      if(part&&(part+' '+word).length>175){chunks.push(part);part=word;}
      else part=part?part+' '+word:word;
    }
    if(part)chunks.push(part);
  }
  return chunks;
}
function startSpeaking(){
  if(!state.chosen||!voiceSupported)return;
  stop({resetStatus:false});
  const token=state.playbackToken;
  const chunks=splitSpeech(state.chosen.answer);
  if(!chunks.length){displayStatus('This explanation has no text to read.');return;}
  let index=0;
  const voice=chooseVoice();
  state.playing=true;
  $('stopVoice').disabled=false;
  $('voiceBtn').textContent='↻ Replay explanation';
  $('avatarStage').classList.add('speaking');
  displayStatus('Reading the explanation aloud.');
  function next(){
    if(token!==state.playbackToken)return;
    if(index>=chunks.length){
      state.playing=false;$('stopVoice').disabled=true;
      $('avatarStage').classList.remove('speaking');
      $('voiceBtn').textContent='▶ Listen again';
      displayStatus('Finished. Choose another question or listen again.');
      return;
    }
    const utterance=new SpeechSynthesisUtterance(chunks[index++]);
    utterance.lang='en-US';utterance.rate=0.93;utterance.pitch=1;utterance.volume=1;
    if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(token===state.playbackToken)next()};
    utterance.onerror=event=>{
      if(token!==state.playbackToken)return;
      state.playing=false;$('stopVoice').disabled=true;
      $('avatarStage').classList.remove('speaking');
      $('voiceBtn').textContent='▶ Listen to answer';
      displayStatus('Audio could not play. You can still read the explanation below.');
    };
    window.speechSynthesis.speak(utterance);
  }
  next();
}
$('faqSearch').addEventListener('input',render);
$('clearSearch').onclick=()=>{$('faqSearch').value='';render()};
$('refreshFaq').onclick=()=>location.reload();
$('faqTotal').textContent=seed.length;
$('voiceBtn').onclick=startSpeaking;
$('stopVoice').onclick=()=>stop();
$('copyFaqCode').onclick=async()=>{
  try{await navigator.clipboard.writeText($('faqCode').textContent);$('copyFaqCode').textContent='Copied ✓';setTimeout(()=>$('copyFaqCode').textContent='Copy',1500)}
  catch{$('copyFaqCode').textContent='Select to copy'}
};
$('followUpBtn').onclick=()=>{
  if(window.parent!==window)window.parent.postMessage({type:'teachreach-open-question'},location.origin);
  else location.href='index.html#question';
};
window.addEventListener('pagehide',()=>stop({resetStatus:false}));
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('room-embedded');
$('voiceBtn').disabled=true;
topics();render();if(seed.length)choose(seed[0]);
})();