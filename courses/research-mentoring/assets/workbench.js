/* Independent fictional examples for the eight mentoring investigations. */
(() => {
  "use strict";

  const section = document.getElementById("workbench");
  if (!section) return;
  const host = section.querySelector("[data-lab]");
  const moduleNumber = Number(section.dataset.module);
  const source = section.dataset.source;

  // The controlled ledger contains no quoted or multiline fields.
  function readRows(csv) {
    return csv.trim().split(/\r?\n/).slice(1).map(line => {
      const [id, kind, subject, field, value, unit] = line.split(",");
      return {id, kind, subject, field, value, unit};
    });
  }

  const changes = {
    unchanged: "Same field definition",
    restricted_scope: "Narrower definition",
    unit_change: "Different reporting unit"
  };
  const originalFields = {site_name: "site_name", reusable_container_count: "container_count", sample_mass: "sample_mass"};
  const models = [
    ["rule", "Bounded queue rule"],
    ["omit", "Omit arriving folders"],
    ["unbounded", "Skip lower bound"],
    ["guarded", "Abstain above logged capacity"]
  ];
  const cartMethods = [["pair", "Paired readings"], ["end", "End reading only"]];
  const metrics = [["label", "Answer label"], ["joint", "Answer and exact evidence IDs"]];
  const words = field => field.replace(/_/g, " ");
  const fraction = (n, total) => n + " / " + total;
  const format = value => Number(value.toFixed(2)).toString();

  function filingProposal(target, source) {
    if (source.field !== target.field) {
      const narrower = target.value === "restricted_scope" && source.field === originalFields[target.field];
      return {
        proposal: "Leave open",
        reason: narrower ? "The old total includes containers outside the new definition. Ask the reviewer for a scoped count." : "The selected record describes a different quantity. Ask the reviewer for evidence of this field."
      };
    }
    if (source.unit === "kg" && target.unit === "g") {
      return {proposal: Number(source.value) * 1000 + " g", reason: "Multiply kilograms by 1,000. Preserve both the source value and the conversion for review."};
    }
    const value = source.unit === "text" ? source.value : source.value + " " + source.unit;
    return {proposal: value, reason: "The field and unit match. Send the proposed value and its source ID to the reviewer for sign-off."};
  }

  function queueInputs(defaults, reference) {
    const inputs = {...defaults};
    if (reference.field !== "baseline") {
      const [field, value] = reference.field.split("=");
      inputs[field] = Number(value);
    }
    return inputs;
  }

  function simulate(inputs, model, loggedCapacity) {
    const {opening, arrivals, capacity} = inputs;
    if (model === "guarded" && capacity > loggedCapacity) return null;
    const available = opening + (model === "omit" ? 0 : arrivals);
    const remaining = available - capacity;
    return model === "unbounded" ? remaining : Math.max(0, remaining);
  }

  function inputText(inputs) {
    return inputs.opening + " opening + " + inputs.arrivals + " arriving, capacity " + inputs.capacity;
  }

  function samplePair(samples, trace, interval) {
    const times = interval.split("-");
    return times.map(time => samples.find(r => r.subject === trace && r.field === "second_" + time));
  }

  function cartAnswer(pair, method) {
    const bits = pair.map(r => r.value.split("|")[1]);
    if (method === "end") {
      const label = {"0":"No", "1":"Yes", "?":"Unknown"}[bits[1]];
      return {label, ids: [pair[1].id]};
    }
    let label = "Unknown";
    if (!bits.includes("?")) label = bits[0] === "0" && bits[1] === "1" ? "Yes" : "No";
    return {label, ids: pair.map(r => r.id)};
  }

  function node(tag, content = "") {
    const element = document.createElement(tag);
    if (content !== "") element.textContent = content;
    return element;
  }

  function table(caption, headings, rows) {
    const el = node("table");
    el.className = "wb-table";
    el.append(node("caption", caption));
    const head = el.createTHead().insertRow();
    for (const label of headings) {
      const cell = node("th", label);
      cell.scope = "col";
      head.append(cell);
    }
    const body = el.createTBody();
    for (const values of rows) {
      const row = body.insertRow();
      values.forEach((value, index) => {
        const cell = node(index === 0 ? "th" : "td", String(value));
        if (index === 0) cell.scope = "row";
        row.append(cell);
      });
    }
    const wrapper = node("div");
    wrapper.className = "wb-table-wrap";
    wrapper.append(el);
    return wrapper;
  }

  function settings(label, options) {
    return {label, options: options.map(option => Array.isArray(option) ? option : [option, option])};
  }

  function setup(rows) {
    const ofKind = kind => rows.filter(r => r.kind === kind);
    const byId = id => rows.find(r => r.id === id);
    const fields = ofKind("filing_rule");
    const sources = ofKind("filing_source");
    const defaults = Object.fromEntries(ofKind("queue_setting").map(r => [r.field, Number(r.value)]));
    const logged = ofKind("queue_log")[0];
    const cases = ofKind("queue_reference");
    const samples = ofKind("cart_sample");
    const references = ofKind("cart_reference");
    const fieldChoices = fields.map(r => [r.id, words(r.field)]);
    const caseChoices = cases.map(r => [r.id, r.id + " · " + r.subject]);
    const traces = [...new Set(samples.map(r => r.subject))];
    const intervals = [["0-1", "0 to 1 s"], ["1-2", "1 to 2 s"], ["2-3", "2 to 3 s"]];
    const investigations = {
      1: {
        question: "A fictional filing form has been revised. Which old values can a reviewer reuse, and which need a conversion or fresh evidence?",
        controls: [settings("Revised field to inspect", fieldChoices)],
        evaluate(id) {
          const target = byId(id);
          const prior = sources.find(r => r.field === originalFields[target.field]);
          const result = filingProposal(target, prior);
          return {
            caption: "Alignment between the prior filing and the revised form",
            headers: ["Item", "Record"],
            body: [
              ["Prior field", prior.id + " · " + words(prior.field)],
              ["Prior value", prior.value + (prior.unit === "text" ? "" : " " + prior.unit)],
              ["Revised field", target.id + " · " + words(target.field)],
              ["Change", changes[target.value]],
              ["Proposed value", result.proposal]
            ],
            note: "For " + words(target.field) + ", the proposal is “" + result.proposal + "”. " + result.reason
          };
        }
      },
      2: {
        question: "Choose a source for a revised field. Would its scope and unit justify sending this proposed value to a human reviewer?",
        controls: [
          settings("Revised field", fieldChoices),
          settings("Candidate source", sources.map(r => [r.id, r.id + " · " + words(r.field)]))
        ],
        evaluate(targetId, sourceId) {
          const target = byId(targetId);
          const source = byId(sourceId);
          const result = filingProposal(target, source);
          return {
            caption: "Evidence packet for one proposed entry",
            headers: ["Item", "Review record"],
            body: [
              ["Target", target.id + " · " + words(target.field)],
              ["Source document", source.id + " · " + source.subject],
              ["Source field", words(source.field)],
              ["Source value and unit", source.value + " · " + source.unit],
              ["Proposed entry", result.proposal]
            ],
            note: source.id + " → " + target.id + " gives “" + result.proposal + "”. " + result.reason
          };
        }
      },
      3: {
        question: "Five folders are waiting at a fictional museum. New folders arrive before scanning begins. What can one shift finish if you change intake or scanning capacity?",
        controls: [
          settings("Arrivals before scanning (folders)", ["2", "0", "5"]),
          settings("Capacity for this shift (folders)", ["3", "0", "6", "9"])
        ],
        evaluate(arrivals, capacity) {
          const inputs = {...defaults, arrivals: Number(arrivals), capacity: Number(capacity)};
          const available = inputs.opening + inputs.arrivals;
          const remaining = simulate(inputs, "rule", defaults.capacity);
          return {
            caption: "One shift of the documented digitization process",
            headers: ["Step", "Folders"],
            body: [
              ["Opening queue", inputs.opening],
              ["Arrivals", inputs.arrivals],
              ["Ready for scanning", available],
              ["Scanned", available - remaining],
              ["Remaining after shift", remaining]
            ],
            note: "The queue ends with " + remaining + " folders. Scanning uses the smaller of the ready count and the capacity. The museum log records only the original shift."
          };
        }
      },
      4: {
        question: "Can retrieving the recorded shift answer a question about a different shift? Compare both methods on one intervention against a separately tabulated reference.",
        controls: [settings("Intervention to compare", caseChoices)],
        evaluate(id) {
          const reference = byId(id);
          const inputs = queueInputs(defaults, reference);
          const actual = Number(reference.value);
          const retrieved = Number(logged.value);
          const executed = simulate(inputs, "rule", defaults.capacity);
          return {
            caption: id + " · " + inputText(inputs) + " folders",
            headers: ["Method", "End queue (folders)", "Absolute error (folders)"],
            body: [
              ["Reference " + reference.id, actual, "—"],
              ["Retrieve the log " + logged.id, retrieved, Math.abs(retrieved - actual)],
              ["Execute the queue rule", executed, Math.abs(executed - actual)]
            ],
            note: id + " has a reference of " + actual + " folders. Retrieval echoes the observed " + retrieved + " from " + logged.id + ". Execution applies this case’s inputs and returns " + executed + ". One case alone cannot establish performance on other interventions."
          };
        }
      },
      5: {
        question: "Treat each short routine as a candidate generated simulator. Which intervention would expose a missing step, an impossible value, or a refusal to answer?",
        controls: [settings("Candidate routine", models), settings("Fixed intervention case", caseChoices)],
        evaluate(model, id) {
          const reference = byId(id);
          const inputs = queueInputs(defaults, reference);
          const answer = simulate(inputs, model, defaults.capacity);
          const truth = Number(reference.value);
          let verdict = "Abstained";
          if (answer !== null) verdict = answer === truth ? "Exact" : "Incorrect";
          const predicted = answer === null ? "No prediction" : answer;
          return {
            caption: "One candidate against a fixed reference",
            headers: ["Item", "Result"],
            body: [
              ["Case and inputs", id + " · " + inputText(inputs)],
              ["Reference queue (folders)", truth],
              ["Candidate queue (folders)", predicted],
              ["Absolute error (folders)", answer === null ? "Undefined" : Math.abs(answer - truth)],
              ["Test outcome", verdict]
            ],
            note: "For " + id + " this routine receives “" + verdict + "”. " + (answer === null ? "Its capacity guard skips this case. Keep the abstention in the coverage denominator." : answer < 0 ? "A negative queue violates the lower bound even before comparison with the reference." : "Keep this input and reference fixed when you switch routines. Agreement on one case can hide a missing step.")
          };
        }
      },
      6: {
        question: "Could a routine appear exact by skipping difficult cases? Count unanswered cases separately, then compare the result on a chosen intervention family.",
        controls: [
          settings("Candidate routine", models),
          settings("Test set", [["all", "All six cases"], ["intake", "Intake interventions"], ["capacity", "Capacity interventions"]])
        ],
        evaluate(model, family) {
          const prefix = family === "intake" ? "arrivals=" : "capacity=";
          const selected = family === "all" ? cases : cases.filter(r => r.field.startsWith(prefix));
          const errors = [];
          for (const reference of selected) {
            const answer = simulate(queueInputs(defaults, reference), model, defaults.capacity);
            if (answer !== null) errors.push(Math.abs(answer - Number(reference.value)));
          }
          const exact = errors.filter(error => error === 0).length;
          const total = selected.length;
          const mae = errors.length ? format(errors.reduce((sum, error) => sum + error, 0) / errors.length) : "Undefined";
          return {
            caption: "Performance on " + selected.map(r => r.id).join(", "),
            headers: ["Metric", "Result"],
            body: [
              ["Coverage (answered / eligible)", fraction(errors.length, total)],
              ["Exact among answered", errors.length ? fraction(exact, errors.length) : "Undefined"],
              ["Exact among all eligible", fraction(exact, total)],
              ["MAE among answered (folders)", mae]
            ],
            note: "The routine answers " + errors.length + " of " + total + " cases and gets " + exact + " exactly right. The logged baseline case belongs only to the full set. Report the denominators when comparing intervention families."
          };
        }
      },
      7: {
        question: "A virtual parcel cart logs position and a bumper switch once per second. Did the switch rise in the selected interval, or was it already on?",
        controls: [settings("Virtual cart trace", traces), settings("Observation interval", intervals)],
        evaluate(trace, interval) {
          const pair = samplePair(samples, trace, interval);
          const answer = cartAnswer(pair, "pair");
          const positions = pair.map(r => Number(r.value.split("|")[0]));
          const displacement = positions[1] - positions[0];
          return {
            caption: trace + " · source samples for " + interval + " seconds",
            headers: ["Sample ID", "Time (s)", "Position (m)", "Switch bit"],
            body: pair.map(r => [r.id, r.field.slice(7), ...r.value.split("|")]),
            note: "The sampled switch-rise label is “" + answer.label + "”. Compare the two cited rows, " + answer.ids.join(" and ") + ". A rise requires 0 followed by 1. A missing bit (?) gives Unknown under the annotation rule. Signed displacement between these samples is " + displacement + " m."
          };
        }
      },
      8: {
        question: "Can an annotator answer correctly while citing insufficient evidence? Reproduce a claim using six fixed interval questions and either scoring rule.",
        controls: [settings("Annotation method", cartMethods), settings("Success criterion", metrics)],
        evaluate(method, metric) {
          let passed = 0;
          const body = references.map(reference => {
            const pair = samplePair(samples, reference.subject, reference.field);
            const answer = cartAnswer(pair, method);
            const required = pair.map(r => r.id);
            const match = answer.label === reference.value;
            const exactIds = answer.ids.join("|") === required.join("|");
            const pass = match && (metric === "label" || exactIds);
            if (pass) passed++;
            return [
              reference.id + " · " + reference.subject + " " + reference.field + " s",
              reference.value,
              answer.label + " · " + answer.ids.join(" + "),
              pass ? "Pass" : "Miss"
            ];
          });
          return {
            caption: "Scoring the switch event · " + metrics.find(([key]) => key === metric)[1],
            headers: ["Case and interval", "Reference", "Answer and cited IDs", "Score"],
            body,
            note: "The method passes " + fraction(passed, references.length) + " fixed questions. Reuse G1–G6 in CSV order. The end-only method calls a final 1 Yes, a final 0 No and a missing bit Unknown. The paired method requires a 0-to-1 change and abstains on a missing bit. Joint credit requires both sample IDs, including for Unknown."
          };
        }
      }
    };
    const activity = investigations[moduleNumber];
    if (!activity) return;
    host.replaceChildren();
    host.append(node("p", activity.question));
    const form = node("div");
    form.className = "wb-controls";
    const inputs = activity.controls.map((control, index) => {
      const group = node("div");
      const id = "wb-m" + moduleNumber + "-input-" + index;
      const label = node("label", control.label);
      label.htmlFor = id;
      const select = node("select");
      select.id = id;
      for (const [value, labelText] of control.options) {
        const option = node("option", labelText);
        option.value = value;
        select.append(option);
      }
      group.append(label, select);
      form.append(group);
      return select;
    });
    const output = node("div");
    output.className = "wb-results";
    const note = node("p");
    note.className = "wb-note";
    note.setAttribute("role", "status");
    function render() {
      const result = activity.evaluate(...inputs.map(input => input.value));
      output.replaceChildren(table(result.caption, result.headers, result.body));
      note.textContent = result.note;
    }
    host.append(form, output, note);
    inputs.forEach(input => input.addEventListener("change", render));
    render();
  }

  if (host && source) {
    fetch(source).then(response => {
      if (!response.ok) throw new Error("Could not read the study records");
      return response.text();
    }).then(csv => setup(readRows(csv))).catch(() => {
      host.replaceChildren(node("p", "The fictional study records could not be loaded. Open the CSV to inspect the records directly."));
    });
  }
})();
