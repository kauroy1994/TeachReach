const aliases = {
  kg: ["knowledge", "graph"], fol: ["logic", "predicate"], llm: ["language", "model"],
  gradients: ["gradient"], tensors: ["tensor"], overfit: ["overfitting"], overfits: ["overfitting"],
  matrices: ["matrix"], embeddings: ["embedding"], shapes: ["shape"], probabilistic: ["probability"]
};

export function retrieve(docs, postings, module, question, history) {
  const scores = new Map();
  function add(text, weight) {
    const terms = new Set(text.toLowerCase().match(/[a-z0-9]+/g) || []);
    const expanded = new Map();
    for (const term of terms) {
      expanded.set(term, 1);
      for (const alias of Object.hasOwn(aliases, term) ? aliases[term] : []) {
        if (!terms.has(alias)) expanded.set(alias, 0.65);
      }
    }
    for (const [term, factor] of expanded) {
      if (!Object.hasOwn(postings, term)) continue;
      const list = postings[term];
      for (let j = 0; j < list.length; j += 2) {
        const id = list[j];
        scores.set(id, (scores.get(id) || 0) + weight * factor * list[j + 1]);
      }
    }
  }
  add(question, 1);
  if (history.length && /\b(it|that|this|those|these|above|again|example|previous|more|they|same)\b/i.test(question)) {
    add(history.at(-1), 0.45);
    if (history.length > 1) add(history[0], 0.15);
  }
  const course = module.split("/")[0];
  const ranked = Array.from(scores, ([i, score]) => {
    const scope = docs[i].module;
    return [i, score * (scope === module ? 1.5 : scope?.startsWith(course + "/") ? 1.12 : 1)];
  }).sort((a,b) => b[1] - a[1] || a[0] - b[0]);
  const seen = new Set(), selected = [];
  for (const [i] of ranked) {
    const doc = docs[i];
    const key = doc.text.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({title: doc.title, url: doc.url, module: doc.module, text: key.slice(0, 2400),
      question: doc.question, answer: doc.answer});
    if (selected.length === 10) break;
  }
  return selected;
}
