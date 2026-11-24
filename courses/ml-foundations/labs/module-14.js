window.ML_LABS = [
  {
    title: "Gridworld reward and policy explorer",
    prompt: "Start in the northwest square of this two-by-two grid. Moving east finishes for 2 points. South attempts the bridge for 0 points; failure ends the trip off the grid. From the southwest bridge, move east to deliver. Predict the best first move, then read the expected remaining points in each grid square.",
    controls: [
      {label:"Delivery reward (points)", min:0, max:8, step:1, value:4},
      {label:"Discount γ", min:0, max:1, step:0.05, value:0.75},
      {label:"Crossing success probability", min:0, max:1, step:0.05, value:1}
    ],
    run([reward, gamma, crossing]) {
      const east = 2;
      const south = crossing * gamma * reward;
      const best = Math.abs(south - east) < 1e-9 ? "Both routes tie" : south > east ? "South wins" : "East wins";
      return {labels:["East: finish now","South: attempt bridge"],values:[east,south],
        matrix:[[Math.max(east,south),0],[reward,0]],rowLabels:["North","South"],columnLabels:["West","East (terminals)"],
        explanation:best + ". East returns 2 immediately. South returns " + crossing.toFixed(2) + " × " + gamma.toFixed(2) + " × " + reward + " = " + south.toFixed(2) + " expected discounted points. A failed crossing contributes 0."};
    }
  },
  {
    title:"Value iteration and Q-learning",
    prompt:"Return to the deterministic grid with delivery reward 4 and discount 0.75. Start all estimates at zero. Each round applies one simultaneous model-based sweep and two sample updates in the order Start→Bridge, Bridge→Done. Examine how the delayed reward moves backward.",
    controls:[
      {label:"Completed rounds", min:0, max:12, step:1, value:2},
      {label:"Q-learning step size α", min:0.1, max:1, step:0.1, value:0.5}
    ],
    run([rounds, alpha]) {
      let modelBridge = 0, modelStart = 0, qDetour = 0, qBridge = 0;
      for (let i = 0; i < rounds; i++) {
        modelStart = Math.max(2, 0.75 * modelBridge);
        modelBridge = 4;
        qDetour += alpha * (0.75 * qBridge - qDetour);
        qBridge += alpha * (4 - qBridge);
      }
      return {labels:["V(Start), best action","V(Bridge)","Q(Start, Detour)","Q(Bridge, Deliver)"], values:[modelStart,modelBridge,qDetour,qBridge],
        explanation:"The first pair uses the complete model and compares both choices at Start. The last pair learns only from the two named sample transitions. After " + rounds + " rounds, Detour’s learned estimate is " + qDetour.toFixed(3) + " versus its exact return of 3. Compare α = 1 to α = 0.5."};
    }
  }
];
