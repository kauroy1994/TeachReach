(()=>{'use strict';const M=window.TEACHREACH_MODULE,$=id=>document.getElementById(id),s=M.story,ex=Object.fromEntries(M.exercises.map(e=>[e.id,e]));let idx=0,revealed=false,codeVisible=false;const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S=[
{kind:'ml-welcome',tag:'KAUSHIK ROY, UNIVERSITY OF ALABAMA · MACHINE LEARNING FOUNDATIONS',title:'How do machines learn from examples?',sub:'Start with a problem. Build a prediction. Discover the tensor operations that make it work.',minutes:3},
{kind:'ml-why',tag:'START WITH A REASON',title:'Every day, we make decisions using patterns.',sub:'Your inbox filters spam. A music app recommends songs. A practice coach estimates how you might perform.',minutes:3},
{kind:'ml-difference',tag:'WHAT MAKES MACHINE LEARNING DIFFERENT?',title:'Instead of writing every rule, learn useful parameters from examples.',sub:'A programmer describes the model structure. Data and a learning procedure determine the parameter values.',minutes:3},
{kind:'ml-scenario',tag:'OUR CLASSROOM CHALLENGE',title:'Can study patterns help predict a practice score?',sub:'Meet the Campus Study Coach. We will record study hours and completed practice sets, make predictions, and improve a simple model.',minutes:3},
{kind:'ml-cast',tag:'MEET THE DATA',title:'Three examples give us something to work with.',sub:'Start with Ava, Ben, and Cam. First record their study activity; later compare model predictions with example targets.',minutes:3},
{kind:'ml-loop',tag:'THE COMPLETE MACHINE LEARNING JOURNEY',title:'Collect → Represent → Predict → Compare → Improve.',sub:'We will complete this entire loop today and translate every stage into mathematical notation and PyTorch.',minutes:3},
{kind:'ml-bridge',code:"import torch\nhours = torch.tensor(2)\nsets = torch.tensor(3)\nscore = 10 * hours + 5 * sets + 20\nprint(score.item())",tag:'THE KEY CONNECTION',title:'Give each number a name before writing code.',sub:'Ava’s two hours and three sets are inputs. The rule returns one prediction. A tensor stores numbers in an order we choose, so the computer can repeat the calculation.',minutes:2},
{kind:'cover',tag:'MODULE 01 · MACHINE LEARNING FOUNDATIONS',title:'Now turn our story into a computation.',sub:'We will represent one example, combine a dataset, apply a function, and train parameters.',minutes:2},
{kind:'goals',tag:'TODAY’S ROUTE',title:'By the end, you can follow the entire computation.',sub:'We are not learning tensor jargon in isolation. We are building a tiny machine-learning system.',minutes:2},
{kind:'story',tag:'ONE RUNNING EXAMPLE',title:'Return to the Campus Study Coach.',sub:'Keep the same examples as we introduce each tensor dimension and operation.',minutes:2},
{kind:'question',tag:'START WITH A CONCRETE PROBLEM',title:'What information do we need to make one prediction?',sub:'Ava studied 2 hours and completed 3 practice sets. We want to apply the same rule to everyone.',prompt:'Two measurements describe Ava. How should a computer store them together?',minutes:2},
{kind:'vector',tag:'1D TENSOR',title:'Start with a list: one student, two numbers.',sub:'Ava’s measurements become a single row of two values. Every position has a meaning.',minutes:3},
{kind:'exercise',id:'ex1',tag:'QUICK CHECK · 30 SECONDS',title:'Count measurements, not students.',minutes:2},
{kind:'dataset',tag:'2D TENSOR',title:'Stack several students into one table.',sub:'Rows are students. Columns are the two measured features.',minutes:3},
{kind:'index',tag:'TENSOR INDEXING',title:'Ask for one row—or just one column.',sub:'An operation can select the study hours for everyone without copying the data into a different format.',minutes:2},
{kind:'exercise',id:'ex2',tag:'QUICK CHECK · 45 SECONDS',title:'Translate a classroom into a shape.',minutes:2},
{kind:'rule',tag:'PARAMETERIZED FUNCTION',title:'A rule turns measurements into a predicted score.',sub:'Our example rule gives 10 points per study hour, 5 per practice set, plus 20 starting points.',minutes:3},
{kind:'score',tag:'WORKED EXAMPLE',title:'Let’s calculate Ava’s prediction together.',sub:'Multiply each measurement by its weight, add the results, then add the starting score.',minutes:3},
{kind:'batch',tag:'VECTORIZE THE SAME RULE',title:'One operation scores all three students.',sub:'The dataset, model weights, and predictions are all tensors.',minutes:3},
{kind:'exercise',id:'ex3',tag:'YOU DO IT · 60 SECONDS',title:'Predict a fourth student.',minutes:2},
{kind:'transform',tag:'CHANGE THE DATA',title:'Tensor operations transform the measurements.',sub:'Convert the hours column to minutes. The values change; the number of students and features does not.',minutes:3},
{kind:'exercise',id:'ex4',tag:'QUICK CHECK',title:'Does changing units change shape?',minutes:2},
{kind:'broadcast',tag:'A SUBTLE OPERATION',title:'Add the same starting score to every student.',sub:'One scalar is applied to all three predictions through broadcasting.',minutes:2},
{kind:'shift',tag:'WHY GO BEYOND 2D?',title:'What if observations arrive every day?',sub:'Students now generate repeated measurements, not just one pair of numbers.',minutes:2},
{kind:'sequence',tag:'3D TENSOR',title:'Add a day axis. You now have a stack of tables.',sub:'Two students, three days, two measurements per day.',minutes:3},
{kind:'reduce',tag:'AGGREGATE THE TIME AXIS',title:'Average across the three days.',sub:'Keep each student and feature, but remove the day axis.',minutes:3},
{kind:'exercise',id:'ex5',tag:'QUICK CHECK',title:'Where did the day axis go?',minutes:2},
{kind:'photo',tag:'4D TENSOR',title:'What if data is a picture?',sub:'Now students submit images of their written practice. Even a tiny grayscale image has height and width.',minutes:3},
{kind:'flatten',tag:'RESHAPE IMAGE DATA',title:'Turn each picture into a row of pixel measurements.',sub:'Two images, nine pixels each. No pixels disappear, but the spatial layout is no longer explicit.',minutes:3},
{kind:'exercise',id:'ex6',tag:'YOU DO IT',title:'What shape will flattening produce?',minutes:2},
{kind:'video',tag:'5D AND BEYOND',title:'Add more independent axes as the data demands.',sub:'Two students × two days × one channel × three rows × three columns.',minutes:2},
{kind:'ladder',tag:'CHECKPOINT',title:'Rank tells you how many axes—not how much data.',sub:'The same machine-learning problem can use different tensor ranks depending on what we measure.',minutes:3},
{kind:'training',tag:'WHAT MAKES IT MACHINE LEARNING?',title:'So far the parameters were chosen by hand.',sub:'Learning begins when we compare predictions with examples of desired outputs and adjust the rule.',minutes:2},
{kind:'loss',tag:'ONE LOSS VALUE',title:'Our initial predictions miss their targets.',sub:'Compute the error for each student, square it, and take the mean.',minutes:3},
{kind:'exercise',id:'ex7',tag:'LAST NUMERICAL CHECK',title:'Calculate the average squared error.',minutes:2},
{kind:'gradient',tag:'HOW A MODEL LEARNS',title:'Gradients show which direction should change.',sub:'PyTorch can track the tensor operations and calculate how the loss changes with the parameters.',minutes:3},
{kind:'code',tag:'ACTUAL PYTORCH CODE',title:'This entire model is only a few lines of PyTorch.',sub:'Inputs, weights, predictions, loss, and gradients all remain tensors.',minutes:3},
{kind:'exercise',id:'ex8',tag:'DEBUG THE SHAPE',title:'Why does this matrix multiplication fail?',minutes:2},
{kind:'summary',tag:'PUT IT ALL TOGETHER',title:'Machine learning is a pipeline of tensor operations.',sub:'Data → representation → transformation → parameterized computation → prediction → loss → parameter update.',minutes:2},
{kind:'office',tag:'AFTER CLASS',title:'Keep learning with Virtual Office Hours.',sub:'Search the module FAQ or register a question for Professor Roy.',minutes:2},
{kind:'exit',tag:'EXIT TICKET',title:'Module 01 review questions',sub:'Try each question on your own, then compare your reasoning with the worked answer.',minutes:2}
 ];

// Module 02 continuity: the final slide opens the next mathematical foundation.
S.push({kind:'m2-teaser',tag:'UP NEXT · MODULE 02',title:'From tensors to probability',sub:'Ava has x = [2, 3], and our toy tensor model predicts 55. But what is the probability that she actually scores above 60?',minutes:3});
// Notation-and-code examples are inserted immediately after
// the real-world examples they explain (not collected as a detached appendix).
for (const bridge of (window.TEACHREACH_BRIDGES || [])) {
  const where = S.findIndex(item => item.kind === bridge.after);
  if (where >= 0) {
    let offset=1;
    while (S[where+offset]?.kind === 'bridge') offset++;
    S.splice(where+offset,0,bridge);
  }
}
// Every slide, including formative exercises and notation bridges, has an
// independent PyTorch example. Example lookup never depends on a prior slide.
const PYTORCH=window.TEACHREACH_M1_EXAMPLES||{};
for(const slide of S){
  if(!String(slide.code||"").trim()){
    slide.code=PYTORCH.byTitle?.[slide.title]||PYTORCH.byExercise?.[slide.id]||
      PYTORCH.byKind?.[slide.kind]||"";
  }
}
const checks = {
  "ml-welcome": [
    "A music app predicts which song you will play next. What could it learn from your past listening?",
    "Which songs you played, skipped or replayed give it examples of your preferences."
  ],
  "ml-why": [
    "What could an inbox filter predict about a new message?",
    "It could predict whether the message is spam. Examples of messages already marked as spam give it something to learn from."
  ],
  "ml-difference": [
    "Our score rule gives 10 points per hour. What would make that number a learned weight?",
    "Use past study records and scores to adjust the number according to how well the rule predicts."
  ],
  "ml-scenario": [
    "Which two facts about Ava are available before the quiz? What do we want to predict?",
    "We know her study hours and completed practice sets. Her quiz score is the outcome we want to predict."
  ],
  "ml-cast": [
    "Ava completes a fourth practice set. Which entry in her record changes?",
    "Her practice-set entry goes from 3 to 4. Her hours remain 2, so her new row is [2, 4]."
  ],
  "ml-loop": [
    "Which step first requires the actual quiz scores?",
    "Comparison. To measure a prediction error, we need both the prediction and the score that was observed."
  ],
  "ml-bridge": [
    "Keep the three sets and change hours from 2 to 3. What will print?",
    "65. One additional hour adds 10 points to the original 55."
  ],
  "cover": [
    "Two students have identical recorded inputs. What does the same fixed rule predict for them?",
    "The same score. The calculation receives exactly the same numbers for both."
  ],
  "goals": [
    "What would you compare to find out whether the score rule works on a new student?",
    "Compute the prediction from the study record, then compare it with that student’s observed score."
  ],
  "story": [
    "Ava is one example. Name a feature and give its value for her.",
    "Study hours is a feature, and its value is 2. Completed practice sets is another, with value 3."
  ],
  "question": [
    "How could you store Ava’s two measurements so another person knows which is which?",
    "Use an ordered list [2, 3] and record the order as [hours, sets]. Reversing the labels changes what the numbers mean."
  ],
  "vector": [
    "If we record sleep hours as a third feature, what is the shape of Ava’s list?",
    "It becomes (3,). There is still one axis, now with three entries."
  ],
  "dataset": [
    "A fourth student joins the table. Which dimension grows?",
    "The row count increases from 3 to 4. With the same two features the shape becomes (4, 2)."
  ],
  "index": [
    "In X[:, 0], whose hours do we get?",
    "All three students’ hours. The colon selects every row and 0 selects the first column."
  ],
  "rule": [
    "What score does the rule predict for zero hours and zero sets?",
    "20. Both weighted measurements contribute zero, leaving the starting score or bias."
  ],
  "score": [
    "Which contributes more to Ava’s prediction, her hours or her sets?",
    "Hours contribute 2 × 10 = 20 points. Sets contribute 3 × 5 = 15 points."
  ],
  "batch": [
    "If X has eight rows and two columns, how many scores does X @ w + b return?",
    "Eight. The same two weights combine the two entries in each row into one score."
  ],
  "transform": [
    "After converting hours to minutes, what weight per minute preserves the score?",
    "10/60 points per minute. Multiplying 120 minutes by 10/60 gives the same 20 points as two hours at 10."
  ],
  "broadcast": [
    "If the bias rises from 20 to 22, which predictions change?",
    "Each prediction rises by 2 because the same bias is added to every row."
  ],
  "shift": [
    "What detail would disappear if we recorded only each student’s total weekly study hours?",
    "We could no longer tell which day the study happened. A day axis preserves that information."
  ],
  "sequence": [
    "In a tensor ordered as student, day, feature, what remains after selecting one student and one day?",
    "One list of two features, the hours and practice sets for that student on that day."
  ],
  "reduce": [
    "Ava studies 1, 2 and 3 hours on three days. What single value replaces those hours after averaging?",
    "2 hours per day, since (1 + 2 + 3)/3 = 2. The practice-set values are averaged separately."
  ],
  "photo": [
    "What changes in (2, 1, 3, 3) if each picture has three color channels?",
    "The channel count changes from 1 to 3, giving (2, 3, 3, 3). There are still two pictures."
  ],
  "flatten": [
    "If each of two images has one channel, two rows and four columns, what is the flattened batch shape?",
    "Each image supplies 1 × 2 × 4 = 8 values. Keeping the two images separate gives (2, 8)."
  ],
  "video": [
    "A third day is added for both students. Which length changes in (2, 2, 1, 3, 3)?",
    "The second length counts days. The new shape is (2, 3, 1, 3, 3)."
  ],
  "ladder": [
    "Which has more axes, a list with 100 entries or a table with two rows and two columns?",
    "The table has two axes. The list has one axis even though it contains more entries."
  ],
  "training": [
    "Ava scores 60 after the rule predicts 55. Which numbers can training adjust?",
    "The weights and bias in the rule. Her recorded study activity and observed score supply the example used to judge the rule."
  ],
  "loss": [
    "What squared error comes from predicting 65 when the observed score is 60?",
    "The signed miss is 5. Squaring gives 25, the same penalty as a five-point miss in the other direction."
  ],
  "gradient": [
    "After a small parameter update, the same batch’s loss changes from 25 to about 24.42. What can we conclude?",
    "The updated rule fits these three examples better according to this loss. We need fresh examples to assess performance on other students."
  ],
  "code": [
    "What value is available after the prediction line but before loss.backward() runs?",
    "The predicted scores already exist. The backward call computes how the loss changes with each trainable parameter."
  ],
  "summary": [
    "Where in the sequence do the measured quiz scores first enter?",
    "They enter when we compare predictions with targets to calculate the loss."
  ],
  "office": [
    "You can compute an average, but your result has the wrong shape. What details would make a useful question?",
    "Include the input shape, what each axis counts, which axis you averaged, and the shape you obtained. Those details locate the step that needs explaining."
  ],
  "m2-teaser": [
    "A rule gives every student in a group a prediction of 55. Can you tell from that number alone what fraction will score above 60?",
    "No. The rule supplies a point prediction. To estimate the fraction above 60, we need information about how actual scores vary around it."
  ]
};
const reviewQuestions = [
  [
    "Eight students each report hours and practice sets. What is the table shape, and what does one row mean?",
    "(8, 2). A row holds both measurements for one student."
  ],
  [
    "Why does a batch of grayscale pictures have four axes in our layout?",
    "The axes count images, channels, pixel rows and pixel columns. Grayscale needs one channel, so the channel axis has length 1."
  ],
  [
    "A rule predicts 55 and Ava scores 60. What changes during a training update?",
    "The observed score and the inputs stay fixed. We adjust the weights and bias using the loss to judge whether the predictions improve."
  ]
];
const interpretation = {
  vector: 'x holds two real numbers. Position 0 holds hours and position 1 holds sets.',
  dataset: 'A capital X is a whole table. The first index chooses a student; the second chooses a measurement.',
  rule: 'Multiply each feature by its own weight, add those products, then add the starting score.',
  score: 'The hat on y means predicted score. A plain y names the recorded score.',
  batch: 'Each of three rows gives one prediction. The feature dimension disappears when its products are added.',
  transform: 'The prime mark means the value after a change. Here only the hours column is converted to minutes.',
  broadcast: 'Repeat the same scalar addition for every student.',
  sequence: 'Choose a student, then a day, then a measurement. Each choice names one axis.',
  reduce: 'The large sigma means add. Add the three days and divide by three, keeping student and feature.',
  photo: 'Read the shape from left to right: number of images, colors, rows, columns.',
  flatten: 'Keep the image index. Arrange its pixel values into one list in a consistent order.',
  video: 'Choose a student, then a time, then a color, row and column.',
  loss: 'For each prediction, subtract its target and square the result. Average those squares.',
  gradient: 'Preview of Module 03. A slope tells us which way loss changes. Here, inspect the loss before and after one small update.'
};
const FORMAL = {
  vector:'x ∈ ℝ²; x = [2,3]ᵀ; shape(x) = (2,)',
  dataset:'X ∈ ℝ³ˣ²; Xᵢⱼ = measurement j for student i',
  rule:'f(x;w,b) = wᵀx + b; weights w ∈ ℝ², bias b ∈ ℝ',
  score:'ŷ = 2(10) + 3(5) + 20 = 55',
  batch:'ŷ = X @ w + b; (3, 2) @ (2,) → (3,)',
  transform:'X′ᵢ₀ = 60Xᵢ₀, X′ᵢ₁ = Xᵢ₁',
  broadcast:'ŷᵢ = (Xw)ᵢ + b, for each example i',
  sequence:'L ∈ ℝ²ˣ³ˣ²; axes = (student, day, feature)',
  reduce:'Aᵢⱼ = (1/3) Σₜ₌₁³ Lᵢₜⱼ',
  photo:'I ∈ ℝᴺˣᶜˣᴴˣᵂ; (N,C,H,W)=(2,1,3,3)',
  flatten:'ℝ²ˣ¹ˣ³ˣ³ → ℝ²ˣ⁹, reshape only',
  video:'V ∈ ℝ²ˣ²ˣ¹ˣ³ˣ³; time is the new axis',
  loss:'L = (1/n) Σᵢ (ŷᵢ − yᵢ)² = 25',
  gradient:'θ ← θ − η∇θ L; η = 0.01'
};
function iconFeature(label,value){return `<div class="metric"><div class="lab">${label}</div><div class="val">${value}</div></div>`}
function students(){return s.students.map((p,i)=>`<div class="story-person"><div class="round-avatar">${p.name[0]}</div><div><b>${p.name}</b><p>${p.hours} study hours · ${p.sets} practice sets</p></div></div>`).join('')}
function matrix(){return `<div class="big-matrix">${s.students.flatMap(x=>[x.hours,x.sets]).map(v=>`<span>${v}</span>`).join('')}</div>`}
function pixel(vals){return `<div class="pixels-big">${vals.flat().map(v=>`<span class="${v?'on':''}"></span>`).join('')}</div>`}
const A=[[0,1,0],[1,1,1],[0,1,0]],B=[[1,0,1],[0,1,0],[1,0,1]];
function body(sl){switch(sl.kind){
case 'm2-teaser':return `<div class="two-col"><div class="big-card" style="background:#fff2f4;border:1px solid #e3b4c0;border-radius:17px;padding:25px"><div class="eyebrow">WHAT WE CAN COMPUTE</div><div style="font-size:70px;font-weight:900;color:#9E1B32;margin:15px 0">55</div><p>Ava studied <b>2 hours</b> and completed <b>3 practice sets</b>.</p><div style="font-family:Georgia,serif;font-size:22px;color:#63243b">xᵀw + b = 55</div></div><div class="big-card" style="background:#eff5f7;border:1px solid #bed0da;border-radius:17px;padding:25px"><div class="eyebrow">WHAT WE CANNOT YET ANSWER</div><div style="font-size:37px;font-weight:850;color:#345978;margin:19px 0">P(Y &gt; 60 | x) = ?</div><p>Similar students may receive different scores. We now need <b>probability, evidence, and distributions</b>.</p></div></div>`;

case 'ml-welcome':return `<div class="intro-stage intro-welcome"><div class="intro-main"><div class="intro-kicker">FOUNDATIONS · MODULE 01</div><div class="intro-hero">Learn patterns.<br><span>Make predictions.</span><br>Improve with data.</div><div class="intro-pill">From familiar questions to formal machine learning</div></div><div class="intro-rings"><div class="ring ring-one"></div><div class="ring ring-two"></div><div class="ring ring-three"></div><div class="ring-dot dot-one">DATA</div><div class="ring-dot dot-two">MODEL</div><div class="ring-dot dot-three">LEARN</div></div></div>`;
case 'ml-why':return `<div class="intro-tiles">${[['✉','Inbox','Which messages look like spam?'],['♫','Music','What might you enjoy next?'],['◎','Practice','What score might follow this study pattern?']].map((c,i)=>`<div class="intro-tile" style="--delay:${i*140}ms"><div class="intro-icon">${c[0]}</div><div class="intro-label">${c[1]}</div><p>${c[2]}</p><div class="intro-micro">examples → prediction</div></div>`).join('')}</div><div class="intro-banner">A useful model discovers relationships between inputs and outcomes.</div>`;
case 'ml-difference':return `<div class="intro-compare"><div class="intro-card"><div class="intro-label">HAND-WRITTEN RULES</div><div class="intro-rule">IF hours &gt; 3<br>THEN predict 70</div><div class="intro-micro">A person chooses each rule.</div></div><div class="intro-transfer">→</div><div class="intro-card strong"><div class="intro-label">LEARNED MODEL</div><div class="intro-rule">examples <span>→</span> model <span>→</span> prediction</div><div class="intro-micro">Training adjusts numerical parameters.</div></div></div><div class="intro-banner">Machine learning means using data to fit a model that can make predictions about new inputs.</div>`;
case 'ml-scenario':return `<div class="intro-scene"><div class="intro-bubble">How much could I score on my next practice quiz?</div><div class="intro-learner"><div class="intro-person-head"></div><div class="intro-person-body"></div><div class="intro-desk"></div></div><div class="intro-coach"><div class="intro-graphic-head">CAMPUS STUDY COACH</div><div class="intro-feature">⏱ Study hours</div><div class="intro-feature">✓ Practice sets</div><div class="intro-arrow">↓</div><div class="intro-outcome">Predicted practice score <b>?</b></div></div></div>`;
case 'ml-cast':return `<div class="intro-students">${s.students.map((p,i)=>`<div class="intro-person-card" style="--delay:${i*100}ms"><div class="intro-face">${p.name.slice(0,1)}</div><h3>${p.name}</h3><div class="intro-observation"><b>${p.hours}</b><span>hours</span></div><div class="intro-observation"><b>${p.sets}</b><span>practice sets</span></div></div>`).join('')}</div><div class="intro-banner">Every student gives us one example. Each example contains the same two measurements.</div>`;
case 'ml-loop':return `<div class="intro-loop">${[['1','COLLECT','Study records'],['2','REPRESENT','Tensors'],['3','PREDICT','Model outputs'],['4','COMPARE','Prediction errors'],['5','IMPROVE','New parameters']].map((v,i)=>`<div class="intro-loop-unit" style="--delay:${i*110}ms"><span class="intro-loop-n">${v[0]}</span><strong>${v[1]}</strong><small>${v[2]}</small></div>${i<4?'<span class="intro-loop-arrow">→</span>':''}`).join('')}</div><div class="intro-banner">Today you will implement each stage with numbers, notation, and PyTorch.</div>`;
case 'ml-bridge':return `<div class="two-col"><div class="big-card"><div class="eyebrow">ON PAPER</div><p>Two hours at 10 points each. Three sets at 5 points each. Add the starting 20.</p><div class="deck-large">20 + 15 + 20 = 55</div></div><div class="big-card"><div class="eyebrow">IN PYTHON</div><pre class="big-code">hours = 2
sets = 3
score = 10 * hours + 5 * sets + 20
print(score)</pre><p>The equals sign stores a value under a name. The star means multiply. Predict the output before running the code.</p></div></div>`;
case 'writing':return `<div class="writing-layout"><div class="writing-story"><span class="bridge-label">WRITE THIS IN A PAPER</span><p>${safe(sl.example)}</p><span class="bridge-label">Check your understanding</span><p class="writing-task">${safe(sl.question)}</p><button class="btn" id="revealBtn">${revealed?'Hide answer':'Reveal answer'}</button></div><div class="writing-answer"><span class="bridge-label">A REPRODUCIBLE FORMAL STATEMENT</span>${revealed?`<p class="writing-formal">${safe(sl.formal)}</p><span class="bridge-label">LATEX SOURCE FOR A PAPER</span><pre class="writing-latex">${safe(sl.latex)}</pre><p class="writing-tip">A good method section defines every symbol and states exactly which dimensions correspond to data and parameters.</p>`:`<div class="writing-placeholder"><div>✎</div>Explain what each symbol means before writing the formula.</div>`}</div></div>`;
case 'bridge':return `<div class="tr-bridge-summary"><div class="bridge-example"><span class="bridge-label">START WITH THE EXAMPLE</span><p>${safe(sl.example)}</p></div><div class="bridge-formal"><span class="bridge-label">NOW READ THE FORMALISM</span><strong>${safe(sl.formal)}</strong><p>${safe(sl.translate)}</p></div><div class="bridge-out"><span class="bridge-label">EXPECTED OUTPUT · SAME TOY DATA</span><pre>${safe(sl.output)}</pre></div></div>`;

case 'cover':return `<div class="two-col wide-left"><div class="big-card" style="background:#1d2b3c;color:white;border:0;display:flex;flex-direction:column;justify-content:center;min-height:290px"><div class="eyebrow" style="color:#f4aab8">ONE STORY · SEVEN IDEAS · REAL PYTORCH</div><div style="font-size:clamp(33px,4.5vw,65px);font-weight:900;letter-spacing:-.06em;line-height:1.07;margin:19px 0">What can a computer do with <span style="color:#ffafc0">two numbers?</span></div><div style="color:#d0dce5;font-size:18px">It can represent data, apply a model, calculate errors, and learn.</div></div><div class="big-card" style="display:grid;justify-items:center;align-content:center;text-align:center;gap:16px"><div class="big-vector"><div class="v"><b>2</b><span>hours</span></div><div class="v"><b>3</b><span>sets</span></div></div><span class="pill cran">One student becomes a model input</span></div></div>`;
case 'goals':return `<div class="deck-grid4">${M.objectives.map((o,i)=>`<div class="big-card" style="min-height:250px"><div class="eyebrow">GOAL 0${i+1}</div><div style="font-size:36px;margin:18px 0">${['▦','▤','↗','◎'][i]}</div><div class="deck-small" style="font-weight:750;color:#33465a">${o}</div></div>`).join('')}</div>`;
case 'story':return `<div class="two-col"><div class="student-story">${students()}</div><div class="big-card"><div class="eyebrow">WHAT WE WANT TO LEARN</div><p class="deck-large">Can study activity help us estimate a practice-test score?</p><div class="callout" style="font-size:16px">We will follow these three study records throughout the lesson.</div><div class="tiny-note" style="margin-top:18px">Three example records · One calculation we can inspect.</div></div></div>`;
case 'question':return `<div class="two-col"><div class="big-card"><div class="eyebrow">AVA’S RECORDED INFORMATION</div><div class="big-vector"><div class="v"><b>2</b><span>study hours</span></div><div class="v"><b>3</b><span>practice sets</span></div></div></div><div class="callquote">Which entry should come first in the record?</div></div>`;
case 'vector':return `<div class="two-col"><div class="big-card"><div class="big-vector"><div class="v"><b>2</b><span>hours</span></div><div class="v"><b>3</b><span>sets</span></div></div><div class="chip-row" style="justify-content:center"><span class="pill blue">1 axis</span><span class="pill blue">2 entries</span><span class="pill green">shape (2,)</span></div></div><div class="big-card"><div class="eyebrow">PLAIN ENGLISH</div><p class="deck-large">A single ordered list of measurements.</p><p class="deck-small">That is a 1D tensor. A model's weights can also be a 1D tensor.</p><pre class="code-box" style="font-size:clamp(13px,1.5vw,18px)">torch.tensor([2., 3.])</pre></div></div>`;
case 'dataset':return `<div class="two-col"><div class="big-card"><div class="chip-row" style="justify-content:center"><span class="pill blue">3 student rows</span><span class="pill blue">2 feature columns</span></div>${matrix()}<div style="text-align:center"><span class="pill green">Shape (3, 2)</span></div></div><div class="big-card"><div class="student-story">${students()}</div></div></div>`;
case 'index':return `<div class="two-col"><div class="big-card">${matrix()}</div><div class="big-card"><div class="eyebrow">TWO USEFUL QUESTIONS</div><div class="slide-step"><div class="num">1</div><div><b>What did Ava do?</b><small>First row: [2, 3] → <code>X[0]</code></small></div></div><div style="height:13px"></div><div class="slide-step"><div class="num">2</div><div><b>How long did everyone study?</b><small>First column: [2, 4, 5] → <code>X[:, 0]</code></small></div></div></div></div>`;
case 'rule':return `<div class="deck-grid3">${iconFeature('POINTS PER HOUR','10')}${iconFeature('POINTS PER PRACTICE SET','5')}${iconFeature('STARTING SCORE','20')}</div><div class="big-card" style="margin-top:20px;text-align:center"><div class="deck-large">Each student gets the <span style="color:var(--crimson)">same rule</span>, but a different result.</div><div class="tiny-note">The parameters are hand-picked. We have not trained this model.</div></div>`;
case 'score':return `<div class="big-card"><div class="eyebrow" style="text-align:center">AVA: 2 HOURS · 3 PRACTICE SETS</div><div class="equation-chips" style="margin:24px 0"><div class="eq-chip">2 × 10<small>hours contribution</small></div><span class="eq-plus">+</span><div class="eq-chip">3 × 5<small>practice contribution</small></div><span class="eq-plus">+</span><div class="eq-chip">20<small>starting points</small></div><span class="eq-plus">=</span><div class="eq-chip answer">55<small>toy prediction</small></div></div><p class="deck-small" style="text-align:center">Multiply each measurement by its matching weight. Add everything together.</p></div>`;
case 'batch':return `<div class="two-col wide-left"><div class="big-card"><div class="eyebrow">ONE TABLE · ONE WEIGHT VECTOR</div>${matrix()}<div class="equation-chips"><div class="eq-chip" style="font-size:17px;padding:12px">× [10, 5]</div><span class="eq-plus">+</span><div class="eq-chip" style="font-size:17px;padding:12px">20</div></div></div><div class="big-card"><div class="eyebrow">THREE PREDICTIONS AT ONCE</div><div class="deck-large" style="color:var(--green)">55 · 65 · 80</div><div class="deck-small">Ava · Ben · Cam</div><hr class="hline"><p class="deck-small">Tensor shapes: dataset <b>(3,2)</b>, weights <b>(2,)</b>, predictions <b>(3,)</b>.</p><pre class="code-box">predictions = X @ weights + 20</pre></div></div>`;
case 'transform':return `<div class="two-col"><div class="big-card"><div class="eyebrow">BEFORE: HOURS</div><div class="big-matrix">${[2,3,4,1,5,2].map(v=>`<span>${v}</span>`).join('')}</div><span class="pill blue">(3, 2)</span></div><div class="big-card"><div class="eyebrow">AFTER: MINUTES</div><div class="big-matrix">${[120,3,240,1,300,2].map(v=>`<span>${v}</span>`).join('')}</div><span class="pill green">Still (3, 2)</span></div></div><div class="notice" style="margin-top:13px">The weight “10 points per hour” cannot be reused unchanged on minutes.</div>`;
case 'broadcast':return `<div class="two-col"><div class="big-card"><div class="eyebrow">BEFORE ADDING THE BIAS</div><div class="deck-grid3">${[35,45,60].map(v=>`<div class="metric"><div class="val">${v}</div></div>`).join('')}</div></div><div class="big-card"><div class="eyebrow">AFTER ADDING 20 TO EACH</div><div class="deck-grid3">${[55,65,80].map(v=>`<div class="metric green"><div class="val">${v}</div></div>`).join('')}</div></div></div><div class="big-card" style="margin-top:16px"><div class="deck-large" style="text-align:center">The scalar <span style="color:var(--crimson)">20</span> is broadcast across the prediction vector.</div></div>`;
case 'shift':return `<div class="two-col"><div class="big-card"><div class="eyebrow">YESTERDAY</div><p class="deck-large">One row per student.</p><div class="big-vector"><div class="v"><b>2</b><span>hours</span></div><div class="v"><b>3</b><span>sets</span></div></div></div><div class="big-card"><div class="eyebrow">NOW</div><p class="deck-large">Each student has three days of measurements.</p><div class="student-story">${['Day 1 · [1, 2]','Day 2 · [2, 3]','Day 3 · [3, 4]'].map((t,i)=>`<div class="slide-step"><div class="num">${i+1}</div><b>${t}</b></div>`).join('')}</div></div></div>`;
case 'sequence':return `<div class="two-col"><div class="big-card"><div class="eyebrow">AVA · DAYS × FEATURES</div><div class="big-matrix">${[1,2,2,3,3,4].map(v=>`<span>${v}</span>`).join('')}</div></div><div class="big-card"><div class="eyebrow">BEN · DAYS × FEATURES</div><div class="big-matrix">${[2,0,4,2,6,4].map(v=>`<span>${v}</span>`).join('')}</div></div></div><div class="big-card" style="margin-top:14px;text-align:center"><div class="deck-large">2 students × 3 days × 2 features = <span style="color:var(--crimson)">3 axes</span></div><span class="pill blue">Shape (2, 3, 2)</span></div>`;
case 'reduce':return `<div class="two-col"><div class="big-card"><div class="eyebrow">BEFORE AVERAGING</div><div class="deck-large">2 students × 3 days × 2 features</div><div class="chip-row"><span class="chip">Ava: [1,2], [2,3], [3,4]</span><span class="chip">Ben: [2,0], [4,2], [6,4]</span></div><div style="font-size:30px;color:var(--crimson);margin-top:15px;font-weight:800">Shape (2, 3, 2)</div></div><div class="big-card"><div class="eyebrow">AFTER AVERAGING DAYS</div><div class="deck-large">Ava: [2, 3]<br>Ben: [4, 2]</div><div style="font-size:30px;color:var(--green);margin-top:15px;font-weight:800">Shape (2, 2)</div><pre class="code-box">weekly_avg = logs.mean(dim=1)</pre></div></div>`;
case 'photo':return `<div class="two-col"><div class="big-card" style="text-align:center"><div class="eyebrow">AVA’S TOY GRAYSCALE IMAGE</div>${pixel(A)}<div style="margin-top:14px" class="pill blue">1 channel · 3 rows · 3 columns</div></div><div class="big-card" style="text-align:center"><div class="eyebrow">BEN’S TOY GRAYSCALE IMAGE</div>${pixel(B)}<div style="margin-top:14px" class="pill blue">1 channel · 3 rows · 3 columns</div></div></div><div class="big-card" style="margin-top:12px;text-align:center"><div class="deck-large">2 images × 1 channel × 3 rows × 3 columns</div><span class="pill green">Shape (2, 1, 3, 3)</span></div>`;
case 'flatten':return `<div class="two-col"><div class="big-card" style="text-align:center"><div class="eyebrow">IMAGE AS A GRID</div>${pixel(A)}<div class="deck-large" style="margin-top:13px">1 × 3 × 3 = 9 pixels</div></div><div class="big-card"><div class="eyebrow">SAME PIXELS AS ONE ROW</div><div class="chip-row" style="gap:5px">${A.flat().map(v=>`<span class="chip" style="min-width:34px;text-align:center;background:${v?'#d0e4f7':'#f1f3f5'}">${v}</span>`).join('')}</div><p class="deck-small">With two images, flattening creates a (2,9) table of pixel features.</p><div class="notice">The spatial grid is no longer explicit after flattening.</div></div></div>`;
case 'video':return `<div class="shape-ladder">${[['Students','2'],['Days','2'],['Channels','1'],['Pixel rows','3'],['Pixel columns','3']].map((v,i)=>`<div class="shape-step"><b>${v[1]}</b><strong>${v[0]}</strong><small>Axis ${i+1}</small></div>`).join('')}</div><div class="big-card" style="margin-top:18px;text-align:center"><div class="deck-large">Shape (2, 2, 1, 3, 3) is a 5D tensor.</div><p class="deck-small">The rank describes the number of axes—not the size of the values inside them.</p></div>`;
case 'ladder':return `<div class="shape-ladder">${[['1D','(2,)','one student'],['2D','(3, 2)','dataset'],['3D','(2, 3, 2)','daily logs'],['4D','(2, 1, 3, 3)','images'],['5D','(2, 2, 1, 3, 3)','daily images']].map(x=>`<div class="shape-step"><b>${x[0]}</b><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('')}</div><div class="callquote" style="margin-top:18px">Every axis must answer a real-world question.</div>`;
case 'training':return `<div class="two-col"><div class="big-card"><div class="eyebrow">HAND-CHOSEN PARAMETERS</div><div class="deck-large">10 per hour<br>5 per practice set<br>+ 20 starting points</div><p class="deck-small">We will learn parameter values in the next step.</p></div><div class="big-card"><div class="eyebrow">LEARNING CHANGES PARAMETERS</div><div class="student-story">${[['1','Make predictions'],['2','Measure errors'],['3','Calculate gradients'],['4','Update parameters']].map(x=>`<div class="slide-step"><div class="num">${x[0]}</div><b>${x[1]}</b></div>`).join('')}</div></div></div>`;
case 'loss':return `<div class="big-card"><div class="loss-table-scroll" tabindex="0" role="region" aria-label="Prediction errors by student"><table class="data-table" style="font-size:clamp(15px,1.5vw,21px)"><thead><tr><th>Student</th><th>Prediction</th><th>Example target</th><th>Error</th><th>Squared error</th></tr></thead><tbody>${s.students.map((p,i)=>`<tr><td>${p.name}</td><td>${s.predictions[i]}</td><td>${p.target}</td><td>${s.predictions[i]-p.target}</td><td>${Math.pow(s.predictions[i]-p.target,2)}</td></tr>`).join('')}</tbody></table></div><div class="equation-chips" style="margin-top:18px"><div class="eq-chip">25 + 25 + 25</div><span class="eq-plus">÷ 3 →</span><div class="eq-chip answer">25<small>mean squared error</small></div></div></div>`;
case 'gradient':return `<div class="deck-grid3">${iconFeature('CURRENT LOSS','25.00')}${iconFeature('GRADIENTS','∂ loss')}${iconFeature('LOSS AFTER ONE UPDATE','24.42')}</div><div class="big-card" style="margin-top:15px"><div class="slide-step"><div class="num">1</div><div><b>Autograd tracks operations.</b><small>It computes how loss changes with model parameters.</small></div></div><div style="height:8px"></div><div class="slide-step"><div class="num">2</div><div><b>An update nudges the parameters.</b><small>This toy batch’s loss falls after one small step. Other problems may behave differently.</small></div></div></div>`;
case 'code':return `<div class="two-col wide-left"><pre class="big-code">import torch
X = torch.tensor([[2.,3.],
                  [4.,1.],
                  [5.,2.]])
y = torch.tensor([60.,70.,75.])
w = torch.tensor([10.,5.],
                 requires_grad=True)
b = torch.tensor(20.,
                 requires_grad=True)
pred = X @ w + b
loss = ((pred - y)**2).mean()
loss.backward()</pre><div class="big-card"><div class="eyebrow">WHAT EACH LINE DOES</div>${[['X','represents students and features'],['w and b','store model parameters'],['pred','computes outputs'],['loss','measures error'],['backward()','computes parameter gradients']].map((x,i)=>`<div class="slide-step" style="margin-bottom:9px"><div class="num">${i+1}</div><div><b>${x[0]}</b><small>${x[1]}</small></div></div>`).join('')}</div></div>`;
case 'summary':return `<div class="shape-ladder">${[['1','Data'],['2','Tensors'],['3','Transforms'],['4','Predictions'],['5','Loss'],['6','Updates']].map(x=>`<div class="shape-step"><b>${x[0]}</b><strong>${x[1]}</strong></div>`).join('')}</div><div class="callquote" style="margin-top:22px">The same tensor operations connect data representation, model computation, and learning.</div>`;
case 'office':return `<div class="two-col"><div class="mock-chat"><div class="chat-avatar"><img src="./assets/professor_portrait.png" alt="Professor portrait"><div><b style="font-size:20px">Virtual Office Hours</b><div class="tiny-note">TeachReach · Course AI office hours</div></div></div><div class="chat-line" style="background:#fbe5ea;color:#922d45"><b>Student:</b> Why does a third axis appear when we record daily activity?</div><div class="chat-line"><b>TeachReach:</b> We need to keep track of <em>who</em>, <em>which day</em>, and <em>which measurement</em>. Let’s point to each axis in Ava’s daily table.</div></div><div class="big-card"><div class="eyebrow">THE SAME MODULE CONTINUES</div><p class="deck-large">Find the FAQ on axes and shapes. Compare its example with your own tensor.</p><p class="deck-small">If the FAQ leaves a question open, submit it through the module’s question form.</p><a class="btn" style="display:inline-block;text-decoration:none;margin-top:12px" href="./office.html" target="_blank" rel="noopener">Open FAQ Virtual Office Hours ↗</a></div></div>`;
case 'exit':return '';
case 'exercise':{let e=ex[sl.id];return `<div class="big-card"><h2>Check your understanding</h2><div class="exercise-prompt">${safe(e.question)}</div>${e.type==='choice'?`<div class="exercise-choices">${e.choices.map((c,i)=>`<div class="exercise-choice"><b>${'ABCD'[i]}.</b>${safe(c)}</div>`).join('')}</div>`:'<div class="callquote">Calculate a number. Show the computation on paper.</div>'}<div style="margin-top:20px"><button class="btn" id="revealBtn">${revealed?'Hide':'Reveal'} answer</button></div>${revealed?`<div class="slide-reveal"><b>Answer: ${safe(e.answer)}</b><br>${safe(e.explanation)}</div>`:''}</div>`}
}}
function render(){const sl=S[idx];document.title=(idx+1)+' / '+S.length+' — '+sl.title+' · CS 483/583 · ML Foundations';$('progress').style.width=((idx+1)/S.length*100)+'%';$('count').textContent=(idx+1)+' / '+S.length;$('prev').disabled=idx===0;$('next').hidden=idx===S.length-1;$('continueModule').hidden=idx!==S.length-1;$('slide').innerHTML=`<div class="slide-head"><div><div class="eyebrow">${sl.tag}</div><h1>${sl.title}</h1>${sl.sub?`<p class="subtitle">${sl.sub}</p>`:''}</div><div class="slide-top-right"><span class="corner-num">${String(idx+1).padStart(2,'0')}</span></div></div><div class="tr-code-example"><div class="tr-code-bar"><button type="button" class="tr-code-toggle" id="trCodeToggle" aria-controls="trCodeWrap" aria-expanded="${codeVisible?'true':'false'}">${codeVisible?'Hide PyTorch example':'Show PyTorch example'}</button><span class="tr-code-hint">Standalone example for this concept</span></div><div class="tr-code-wrap" id="trCodeWrap" ${codeVisible?'':'hidden'}><div class="tr-code-actions"><button type="button" class="tr-code-copy" id="trCodeCopy">Copy code</button></div><pre id="trCodeText">${safe(sl.code)}</pre></div></div><div class="slide-content">${body(sl)}</div>${FORMAL[sl.kind] ? `<div class="slide-formal"><span>What the notation means</span><p>${safe(interpretation[sl.kind])}</p><details><summary>See the notation</summary><strong>${safe(FORMAL[sl.kind])}</strong></details></div>` : ''}`;
  const container = $('slide');
  if (sl.kind === 'exit') {
    container.append(renderLessonChecks('End-of-module questions', reviewQuestions));
  } else if (!['exercise', 'writing'].includes(sl.kind)) {
    const pair = sl.kind === 'bridge' ? [sl.check, sl.checkAnswer] : checks[sl.kind];
    container.append(renderLessonChecks('Check your understanding', [pair]));
  }
if($('trCodeToggle'))$('trCodeToggle').onclick=()=>{codeVisible=!codeVisible;$('trCodeWrap').hidden=!codeVisible;$('trCodeToggle').textContent=codeVisible?'Hide PyTorch example':'Show PyTorch example';$('trCodeToggle').setAttribute('aria-expanded',String(codeVisible));};if($('trCodeCopy'))$('trCodeCopy').onclick=async()=>{try{await navigator.clipboard.writeText(sl.code);$('trCodeCopy').textContent='Copied ✓';}catch{$('trCodeCopy').textContent='Select code to copy';}};if($('revealBtn'))$('revealBtn').onclick=()=>{revealed=!revealed;render()};if ($('copyBridge')) $('copyBridge').onclick=async()=>{try{await navigator.clipboard.writeText(sl.code);$('copyBridge').textContent='Copied ✓';}catch{$('copyBridge').textContent='Select code to copy';}};const h='#'+(idx+1);try{history.replaceState(null,'',location.pathname+location.search+h)}catch{};}
function jump(n){idx=Math.max(0,Math.min(S.length-1,n));revealed=false;codeVisible=false;render();$('slide').scrollTop=0;$('overview').classList.add('hidden')}
$('next').onclick=()=>jump(idx+1);$('prev').onclick=()=>jump(idx-1);$('fullBtn').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();$('outlineBtn').onclick=()=>{let el=$('overview');el.classList.toggle('hidden');if(!el.classList.contains('hidden')){el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><h2>Classroom slide navigator · '+S.length+' slides</h2><button class="nav" id="closeOverview">Close ×</button></div><div class="overview-grid">'+S.map((sl,i)=>`<button class="overview-card" data-slide="${i}"><span class="eyebrow">${String(i+1).padStart(2,'0')} · ${safe(sl.tag)}</span><b>${safe(sl.title)}</b></button>`).join('')+'</div>';$('closeOverview').onclick=()=>el.classList.add('hidden');el.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>jump(+b.dataset.slide))}};document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const key=e.key.toLowerCase();if(key===' ' && e.target.closest('summary,button,a'))return;if(key==='arrowright'||key===' '||key==='pagedown'){e.preventDefault();jump(idx+1)}if(key==='arrowleft'||key==='pageup'){e.preventDefault();jump(idx-1)}if(key==='g')$('outlineBtn').click();if(key==='f')$('fullBtn').click();if(key==='p')$('trCodeToggle')?.click();if(key==='r'&&S[idx].kind==='exercise'){revealed=!revealed;render()}if(key==='escape'){$('overview').classList.add('hidden')}});window.addEventListener('hashchange',()=>{const n=parseInt(location.hash.slice(1),10);if(n>=1&&n<=S.length&&n!==idx+1)jump(n-1)});const start=parseInt(location.hash.slice(1),10);const focus=new URLSearchParams(location.search).get('focus');const focusIndex=focus?S.findIndex(sl=>sl.kind===focus):-1;idx=(start>=1&&start<=S.length)?start-1:(focusIndex>=0?focusIndex:0);render();})();
