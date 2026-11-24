/* Stage-wide experiments for the CS 691 Explore pages. */
(() => {
  "use strict";

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function checkbox(name, label, checked) {
    const control = element("input");
    control.type = "checkbox";
    control.name = name;
    control.checked = checked;
    const wrapper = element("label");
    wrapper.append(control, document.createTextNode(label));
    return wrapper;
  }

  function select(name, label, options, selected) {
    const control = element("select");
    control.name = name;
    for (const [value, caption] of options) {
      const option = element("option", caption);
      option.value = value;
      option.selected = value === selected;
      control.append(option);
    }
    const wrapper = element("label", label, "nsy-choice");
    wrapper.append(control);
    return wrapper;
  }

  function steps(items) {
    const list = element("ol", "", "nsy-trace");
    for (const [heading, body] of items) {
      const item = element("li");
      item.append(element("strong", heading), element("span", body));
      list.append(item);
    }
    return list;
  }

  function question(prompt, answer) {
    const block = element("div");
    const solution = element("details");
    solution.append(element("summary", "Reveal answer"), element("p", answer));
    block.append(element("p", prompt), solution);
    return block;
  }

  function rulesLab() {
    return {
      title: "When is Ava’s request ready for desk review?",
      intro: "Use two rules at a fictional lending desk. A recorded camera orientation makes a student eligible. An eligible student’s request for an available camera is ready for desk review. Each checked box adds one named fact to the desk’s file. Clearing a box removes that record.",
      legend: "Facts in Ava’s file",
      controls: [
        checkbox("request", "Ava requested camera C1", true),
        checkbox("orientation", "Ava completed camera orientation", true),
        checkbox("available", "Camera C1 is available", true),
      ],
      update({ request, orientation, available }) {
        const availableFacts = [
          [request, "Requested(Ava, C1)"],
          [orientation, "Oriented(Ava)"],
          [available, "Available(C1)"],
        ].filter(([present]) => present).map(([, fact]) => fact);
        const missing = [
          [!request, "a request from Ava for C1"],
          [!orientation, "Ava’s eligibility"],
          [!available, "a record of C1’s availability"],
        ].filter(([absent]) => absent).map(([, premise]) => premise);
        const trace = steps([
          ["Facts on file", availableFacts.join(" · ") || "The file contains none of the three observations."],
          ["Rule 1 · Check the person", orientation ? "Oriented(Ava) supports Eligible(Ava)." : "Ava’s eligibility has no proof from this file."],
          ["Rule 2 · Check the request", missing.length ? "The rule still needs " + missing.join(" and ") + "." : "The request, eligibility and availability all have support."],
        ]);
        const decision = missing.length
          ? "The file leaves readiness open. The desk can ask for the missing record."
          : "Ready(Ava, C1) follows. A staff member can now review the request.";
        return [trace, decision];
      },
      check: ["Clear only the availability record. Which conclusion can you still justify?", "Ava’s orientation still proves her eligibility. To prove this request is ready, the second rule needs evidence that C1 is available. C1’s actual availability remains unknown."],
    };
  }

  // Records describe the same Monday snapshot; identifiers are local to this experiment.
  const inventory = [
    { id: "R1", item: "C1", key: "available", value: "yes", caption: "C1 is available" },
    { id: "R2", item: "C1", key: "pickup", value: "West", caption: "C1 pickup is at West Desk" },
    { id: "R3", item: "C2", key: "pickup", value: "East", caption: "C2 pickup is at East Desk" },
    { id: "R4", item: "C1", key: "available", value: "no", caption: "C1 is unavailable" },
  ];

  function verdict(records, key, target) {
    const match = records.filter(r => r.key === key && r.value === target);
    const oppose = records.filter(r => r.key === key && r.value !== target);
    const ids = rows => rows.map(r => r.id).join(", ");
    if (match.length && oppose.length) return ["Conflict", ids(match) + " supports the claim and " + ids(oppose) + " contradicts it. Ask the desk to reconcile the records."];
    if (match.length) return ["Supported", ids(match) + " directly supports this claim."];
    if (oppose.length) return ["Contradicted", ids(oppose) + " gives a different value for the same property."];
    return ["Unknown", "The retrieved records do not settle this claim."];
  }

  function evidenceLab() {
    return {
      title: "Which parts of the answer can you cite?",
      intro: "A draft answer claims that a camera is available and its pickup desk is West. This fictional inventory assigns each camera one pickup desk and one availability status at the same instant on Monday. Choose a camera and change the records the checker can consult.",
      legend: "Camera and records to search",
      controls: [
        select("item", "Camera in the question", [["C1", "C1"], ["C2", "C2"]], "C1"),
        ...inventory.map(r => checkbox(r.id, r.id + " · " + r.caption, r.id !== "R4")),
      ],
      update(state) {
        const retrieved = inventory.filter(r => state[r.id] && r.item === state.item);
        const availability = verdict(retrieved, "available", "yes");
        const pickup = verdict(retrieved, "pickup", "West");
        const trace = steps([
          ["Retrieve records for " + state.item, retrieved.map(r => r.id + " · " + r.caption).join(". ") || "No matching record."],
          [state.item + " is available · " + availability[0], availability[1]],
          [state.item + " pickup is at West Desk · " + pickup[0], pickup[1]],
        ]);
        const supported = [availability, pickup].filter(v => v[0] === "Supported").length;
        return [trace, supported + " of 2 draft claims have support without conflicting evidence. Cite those claims and flag any gaps or conflicts."];
      },
      check: ["With all four records selected for C1, can the checker still tell Ava where to go?", "Yes. R2 supports West Desk. R1 and R4 disagree about availability, so the desk address can be given with R2 while availability needs a fresh check."],
    };
  }

  function hybridLab() {
    return {
      title: "Can a photo score trigger a pickup review?",
      intro: "A fictional desk uses a photo of camera C1 to suggest whether its lens cap is present. A model gives a visible rim 0.6 points and a dark center 0.3 points, subtracts 0.1, then replaces any negative total with zero. These are the example model’s weights. The desk uses the score to decide whether to consider C1 a candidate for review.",
      legend: "Photo, cutoff and reservation",
      controls: [
        checkbox("rim", "The photo shows a rim", true),
        checkbox("center", "The photo shows a dark center", true),
        select("cutoff", "Minimum candidate score", [
          ["20", "0.20"], ["50", "0.50"], ["75", "0.75"], ["80", "0.80"], ["85", "0.85"],
        ], "75"),
        select("reservation", "Ava’s recorded reservation", [
          ["C1", "Camera C1"], ["C2", "Camera C2"], ["none", "No reservation on file"],
        ], "C1"),
      ],
      update({ rim, center, cutoff, reservation }) {
        // Integer hundredths preserve equality at each selectable cutoff.
        const rimPoints = rim ? 60 : 0;
        const centerPoints = center ? 30 : 0;
        const total = rimPoints + centerPoints - 10;
        const score = Math.max(0, total);
        const candidate = score >= Number(cutoff);
        const sameItem = reservation === "C1";
        const format = value => (value / 100).toFixed(2);
        const trace = steps([
          ["Compute the photo score", format(rimPoints) + " + " + format(centerPoints) + " − 0.10 = " + format(total) + ". After applying the floor of zero, the score is " + format(score) + "."],
          ["Apply the cutoff", format(score) + (candidate ? " ≥ " : " < ") + format(Number(cutoff)) + (candidate ? ". Add CapCandidate(C1)." : ". Send the photo for inspection.")],
          ["Match the reservation", sameItem ? "Ava’s reservation names C1, the camera in the photo." : reservation === "C2" ? "Ava’s reservation names C2. The photo describes C1." : "The rule lacks a reservation for Ava and C1."],
        ]);
        const decision = candidate && sameItem
          ? "SuggestPickupReview(Ava, C1) follows. The desk can inspect the camera before making a handoff."
          : "The records do not support a pickup review for Ava and C1 under this rule.";
        return [trace, decision];
      },
      check: ["Leave both cues checked and choose C2 for Ava’s reservation. Would lowering the cutoff allow a review for Ava and C1?", "No. Both photo cues give C1 a score of 0.80. A lower cutoff can change which photos become candidates, but the desk rule also requires a reservation for the very same camera."],
    };
  }

  function checkOrder(idCheck, handoff) {
    if (idCheck === "" || handoff === "") return "Missing event";
    if (Number(idCheck) === Number(handoff)) return "Order unknown";
    return Number(idCheck) < Number(handoff) ? "In order" : "Reversed";
  }

  function clock(value) {
    return "10:" + String(value).padStart(2, "0");
  }

  function clockChoice(name, label, initial) {
    const minuteOptions = ["05", "10", "15", "20", "25"].map(value => [value, clock(value)]);
    return select(name, label, [["", "No record"], ...minuteOptions], initial);
  }

  function processLab() {
    return {
      title: "Did the ID check happen before the handoff?",
      intro: "The fictional desk requires an ID check before handing over camera C1 on request R7. A simple baseline marks a log in order whenever both events appear. A second checker compares their times. It reports a missing event or a tie when the log leaves the sequence unsettled.",
      legend: "Times on request R7, on the same day",
      controls: [
        clockChoice("idCheck", "ID check", "05"),
        clockChoice("handoff", "Camera handoff", "15"),
      ],
      update({ idCheck, handoff }) {
        const baseline = idCheck && handoff ? "In order" : "Missing event";
        const order = checkOrder(idCheck, handoff);
        let comparison = "Both events are needed for a comparison.";
        if (order === "Order unknown") comparison = "Both events have the same recorded minute. Their order within it is unknown.";
        if (order === "In order") comparison = clock(idCheck) + " comes before " + clock(handoff) + ".";
        if (order === "Reversed") comparison = "The handoff at " + clock(handoff) + " precedes the ID check at " + clock(idCheck) + ".";
        const trace = steps([
          ["Read the two events", "ID check · " + (idCheck ? clock(idCheck) : "no record") + ". Handoff · " + (handoff ? clock(handoff) : "no record") + "."],
          ["Presence-only baseline · " + baseline, idCheck && handoff ? "Both event names appear in the file." : "The file lacks one or both event names."],
          ["Time-aware rule · " + order, comparison],
        ]);
        const decision = order === baseline
          ? "The two checkers agree on this input. Try putting both events at the same minute."
          : "The checkers disagree. The baseline discards the timing information that the desk’s rule requires.";
        return [trace, decision];
      },
      check: ["Compare against one independently reviewed example. An observer marked a 10:10 handoff followed by a 10:20 ID check as reversed. Enter those two times. Which checker matches the observer?", "The time-aware rule returns Reversed because 10:20 is later than 10:10. The baseline returns In order because it finds both event names. This case exposes one specific error. Measuring how often it occurs would require more reviewed cases."],
    };
  }

  function mount(container, definition, stageNumber) {
    const lab = definition();
    const card = element("section", "", "nsy-sandbox");
    card.append(element("span", "Stage " + stageNumber + " experiment", "nsy-stage"), element("h2", lab.title), element("p", lab.intro));
    const group = element("fieldset");
    group.append(element("legend", lab.legend), ...lab.controls);
    const traceContainer = element("div");
    const summary = element("p", "", "nsy-result");
    summary.setAttribute("role", "status");
    const controls = Array.from(group.querySelectorAll("input, select"));
    function update() {
      const values = Object.fromEntries(controls.map(control => [
        control.name, control.type === "checkbox" ? control.checked : control.value,
      ]));
      const [trace, result] = lab.update(values);
      traceContainer.replaceChildren(trace);
      summary.textContent = result;
    }
    group.addEventListener("change", update);
    card.append(group, traceContainer, summary, question(...lab.check));
    container.replaceChildren(card);
    update();
  }

  const experiments = { "1": rulesLab, "2": hybridLab, "3": evidenceLab, "4": processLab };
  document.querySelectorAll("[data-stage-lab]").forEach(container => {
    const stageNumber = container.dataset.stageLab;
    if (experiments[stageNumber]) mount(container, experiments[stageNumber], stageNumber);
  });
})();
