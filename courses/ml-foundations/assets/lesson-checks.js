// Each question keeps its own answer closed until the learner opens it.
window.renderLessonChecks = function (heading, questions) {
  const section = document.createElement('section');
  section.className = 'lesson-checks';
  const title = document.createElement('h2');
  title.textContent = heading;
  section.append(title);
  for (const [question, answer] of questions) {
    const item = document.createElement('div');
    const prompt = document.createElement('p');
    prompt.textContent = question;
    const details = document.createElement('details');
    details.className = 'tr-check-solution';
    details.innerHTML = '<summary><span class="tr-show-answer">Reveal answer</span><span class="tr-hide-answer">Hide answer</span></summary>';
    const explanation = document.createElement('p');
    explanation.textContent = answer;
    details.append(explanation);
    item.append(prompt, details);
    section.append(item);
  }
  return section;
};
