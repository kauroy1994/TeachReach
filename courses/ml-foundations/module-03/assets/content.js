window.TR_M3 = {
  "lessons": [
    {
      "id": "loss",
      "name": "Gaussian loss"
    },
    {
      "id": "slope",
      "name": "Mean slope"
    },
    {
      "id": "chain",
      "name": "Chain rule"
    },
    {
      "id": "update",
      "name": "One update"
    },
    {
      "id": "rate",
      "name": "Learning rate"
    }
  ],
  "slides": [
    {
      "section": "01 · The observation",
      "title": "Ava’s model predicted 55. She scored 60.",
      "lead": "Suppose 60 is her observed score on a fictional exam. Which weight should move farther, and how could we tell?",
      "math": "μ = 2(10) + 3(5) + 20 = 55",
      "explain": "The inputs are two study hours and three practice sets. Keep the inputs and observed score fixed as you adjust the model.",
      "check": "What can change after we observe the score?",
      "note": "Have students identify both weights and the bias before introducing a derivative.",
      "visual": [
        [
          "Prediction",
          "55",
          "points"
        ],
        [
          "Observation",
          "60",
          "points"
        ],
        [
          "Residual",
          "−5",
          "prediction minus observation"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\nprint(mu.item(), y.item())"
    },
    {
      "section": "01 · The observation",
      "title": "Give the prediction a loss",
      "lead": "Keep the Gaussian spread from Module 02 fixed at σ = 10. Evaluate its density at the observed score and take the negative natural logarithm.",
      "math": "L = −log p(y | μ, σ) = log(σ√(2π)) + (μ − y)²/(2σ²)",
      "explain": "At μ = 55, the constant is about 3.221524. The five-point miss adds 25/200 = 0.125. Moving the mean closer to 60 increases the density there and reduces the loss.",
      "check": "What part of L varies as we move the mean?",
      "note": "Distinguish a density at 60 from the probability of observing exactly 60.",
      "visual": [
        [
          "Spread",
          "10",
          "standard deviation"
        ],
        [
          "Variance",
          "100",
          "squared points"
        ],
        [
          "NLL",
          "3.346524",
          "at μ = 55"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\ndef nll(mean):\n    return -torch.distributions.Normal(mean, sigma).log_prob(y)\n\nloss = nll(mu)\nprint(loss.item())"
    },
    {
      "section": "02 · Differentiate",
      "title": "Measure the slope at 55",
      "lead": "A derivative measures how fast the loss changes as we move the mean a little. Differentiate while holding y and σ fixed.",
      "math": "∂L/∂μ = 0 + 2(μ − y)·1/(2σ²) = (55 − 60)/100 = −0.05",
      "explain": "The constant drops out. The square contributes 2(μ − y), and μ − y has derivative 1. Near 55, increasing μ by 0.01 point lowers the loss by about 0.0005.",
      "check": "At which mean does the slope vanish? Why is that point a minimum?",
      "note": "The second derivative is 1/100, positive everywhere. Ask students to compare signs on opposite sides of 60.",
      "visual": [
        [
          "μ = 55",
          "−0.05",
          "loss slopes down"
        ],
        [
          "μ = 60",
          "0",
          "minimum"
        ],
        [
          "μ = 65",
          "+0.05",
          "loss slopes up"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\ndef nll(mean):\n    return -torch.distributions.Normal(mean, sigma).log_prob(y)\n\nloss = nll(mu)\nh = 0.01\nprint(((nll(mu+h)-nll(mu-h))/(2*h)).item())"
    },
    {
      "section": "02 · Differentiate",
      "title": "Trace the slope back to each parameter",
      "lead": "Increasing the first weight by one unit adds two points to Ava’s mean. Increasing the second by one adds three. Increasing the bias by one adds one.",
      "math": "∂L/∂wⱼ = (∂L/∂μ)xⱼ     ∂L/∂b = (∂L/∂μ)·1",
      "explain": "A partial derivative varies one parameter while the others stay fixed. The gradient collects those partial derivatives in parameter order.",
      "check": "Why does the second weight have the largest gradient magnitude?",
      "note": "Ask for the local slopes 2, 3 and 1 before multiplying by −0.05.",
      "visual": [
        [
          "w₁",
          "−0.10",
          "−0.05 × 2"
        ],
        [
          "w₂",
          "−0.15",
          "−0.05 × 3"
        ],
        [
          "b",
          "−0.05",
          "−0.05 × 1"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\nslope = (mu.detach() - y) / sigma.square()\ndw = slope * x\ndb = slope\nprint(\"Mean, weight and bias slopes:\", slope.item(), dw.tolist(), db.item())"
    },
    {
      "section": "03 · Update",
      "title": "Take one step and predict again",
      "lead": "Use all three gradients from the original parameters. Choose a learning rate η = 1 for this worked example.",
      "math": "θ′ = θ − η∇L     μ′ = 2(10.10) + 3(5.15) + 20.05 = 55.70",
      "explain": "Subtracting negative gradients raises the parameters. The mean gains 0.20 points from hours, 0.45 from sets, and 0.05 from the bias. NLL falls from 3.346524 to 3.313974.",
      "check": "Why does the model move only 0.70 points when the original gap was five?",
      "note": "Have students add the three contributions. A gradient gives a local slope. The learning rate determines step size.",
      "visual": [
        [
          "w₁′",
          "10.10",
          "10 − (−0.10)"
        ],
        [
          "w₂′",
          "5.15",
          "5 − (−0.15)"
        ],
        [
          "b′",
          "20.05",
          "20 − (−0.05)"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\nslope = (mu.detach() - y) / sigma.square()\ndw = slope * x\ndb = slope\nprint(\"Mean, weight and bias slopes:\", slope.item(), dw.tolist(), db.item())\nwith torch.no_grad():\n    print((x @ (w - dw) + b - db).item())"
    },
    {
      "section": "03 · Update",
      "title": "Ask PyTorch to check the arithmetic",
      "lead": "Run the forward computation, call backward() on the scalar NLL, then compare the stored gradients with the hand calculation.",
      "math": "loss.backward()     w.grad = [−0.10, −0.15]     b.grad = −0.05",
      "explain": "Set requires_grad on the parameters before computing μ. Use retain_grad() to inspect the intermediate mean. Compare both components and the bias before changing any parameters.",
      "check": "What goes wrong if you detach the mean before constructing the Normal distribution?",
      "note": "The graph from the loss to the parameters is disconnected. Keep the actual forward path differentiable.",
      "visual": [
        [
          "Forward",
          "μ → L",
          "evaluate the model"
        ],
        [
          "Backward",
          "L → μ",
          "differentiate loss"
        ],
        [
          "Compare",
          "μ → w, b",
          "check each partial"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\ny = x.new_tensor(60.)\nsigma = x.new_tensor(10.)\nmu = x @ w + b\n\ndef nll(mean):\n    return -torch.distributions.Normal(mean, sigma).log_prob(y)\n\nloss = nll(mu)\n\nslope = (mu.detach() - y) / sigma.square()\ndw = slope * x\ndb = slope\nprint(\"Mean, weight and bias slopes:\", slope.item(), dw.tolist(), db.item())\n\nmu.retain_grad()  # Keep the intermediate slope so we can inspect it.\nloss.backward()\ntorch.testing.assert_close(mu.grad, slope)\ntorch.testing.assert_close(w.grad, dw)\ntorch.testing.assert_close(b.grad, db)\nprint(\"Autograd:\", mu.grad.item(), w.grad.tolist(), b.grad.item())\n\neta = 1.0\nwith torch.no_grad():\n    w -= eta * w.grad\n    b -= eta * b.grad\n    updated_mean = x @ w + b\n    updated_loss = nll(updated_mean)\n\nprint(\"New weights and bias:\", w.tolist(), b.item())\nprint(f\"Mean: {mu.item():.2f} -> {updated_mean.item():.2f}\")\nprint(f\"NLL: {loss.item():.6f} -> {updated_loss.item():.6f}\")\ntorch.testing.assert_close(updated_mean, x.new_tensor(55.7))\nassert updated_loss < loss"
    },
    {
      "section": "04 · Learning rates",
      "title": "When does a larger step help?",
      "lead": "Write e = μ − 60. Each simultaneous update multiplies this error by the same factor for Ava’s fixed features and variance.",
      "math": "e′ = (1 − η(2² + 3² + 1)/100)e = (1 − 0.14η)e",
      "explain": "At η = 1 the error shrinks to 86% of its size. At η = 10 it reverses sign and shrinks. At η = 16 it reverses sign and grows. The lab lets you compare these cases.",
      "check": "Could the new mean cross 60 and still improve the loss?",
      "note": "Yes. At η = 10, 55 becomes 62. Its distance from 60 falls from 5 to 2.",
      "visual": [
        [
          "η = 1",
          "55.7",
          "closer"
        ],
        [
          "η = 10",
          "62",
          "closer, across 60"
        ],
        [
          "η = 16",
          "66.2",
          "farther away"
        ]
      ],
      "code": "import torch\n\nx = torch.tensor([2., 3.], dtype=torch.float64)\ny = x.new_tensor(60.)\nfor eta in [0., 1., 100/14, 10., 100/7, 16.]:\n    trial_w = x.new_tensor([10., 5.], requires_grad=True)\n    trial_b = x.new_tensor(20., requires_grad=True)\n    errors = []\n    for _ in range(3):\n        mean = x @ trial_w + trial_b\n        trial_loss = -torch.distributions.Normal(mean, 10.).log_prob(y)\n        dw, db = torch.autograd.grad(trial_loss, (trial_w, trial_b))\n        with torch.no_grad():\n            trial_w -= eta * dw\n            trial_b -= eta * db\n            errors.append(round((x @ trial_w + trial_b - y).item(), 3))\n    print(f\"Rate {eta:.3f}: errors after three steps {errors}\")"
    },
    {
      "section": "04 · Learning rates",
      "title": "What did one observation teach us?",
      "lead": "For Ava, every parameter combination that predicts 60 reaches the same lowest loss. A different student can receive a different prediction from those same models.",
      "math": "2w₁ + 3w₂ + b = 60   ⇒   ∇L = 0",
      "explain": "In Module 04 we will ask whether a rule fitted to training examples predicts held-out observations well. For the in-class variant, explain one update with unfamiliar values.",
      "check": "Can two models fit Ava exactly yet disagree for a student with one hour and one practice set?",
      "note": "Compare [10, 5], bias 25 with [10, 6], bias 22. Both give 60 for Ava. For [1,1] they give 40 and 38.",
      "visual": [
        [
          "Model A",
          "60",
          "on Ava"
        ],
        [
          "Model B",
          "60",
          "on Ava"
        ],
        [
          "New input",
          "40 or 38",
          "one hour, one set"
        ]
      ],
      "code": "import torch\nX = torch.tensor([[2., 3.], [1., 1.]])\nfor w, b in [([10., 5.], 25.), ([10., 6.], 22.)]:\n    print((X @ torch.tensor(w) + b).tolist())"
    }
  ],
  "exercises": [
    {
      "id": "ex0",
      "lesson": "loss",
      "question": "What is μ − y when Ava’s mean is 55 and the observation is 60?",
      "type": "number",
      "options": [],
      "answer": -5,
      "hint": "Subtract the observation from the prediction.",
      "explanation": "55 − 60 = −5 points."
    },
    {
      "id": "ex1",
      "lesson": "loss",
      "question": "How much does the squared-residual term add to the NLL when σ = 10?",
      "type": "number",
      "options": [],
      "answer": 0.125,
      "hint": "Use the variance in the denominator.",
      "explanation": "25/(2 × 100) = 0.125."
    },
    {
      "id": "ex2",
      "lesson": "slope",
      "question": "At μ = 55, y = 60 and σ = 10, what is ∂L/∂μ?",
      "type": "number",
      "options": [],
      "answer": -0.05,
      "hint": "Divide the signed residual by σ².",
      "explanation": "−5/100 = −0.05. Raising this mean a little lowers the loss."
    },
    {
      "id": "ex3",
      "lesson": "chain",
      "question": "Ava completed three sets. What is the loss gradient for the practice-set weight?",
      "type": "number",
      "options": [],
      "answer": -0.15,
      "hint": "Multiply the mean slope by the sets feature.",
      "explanation": "−0.05 × 3 = −0.15."
    },
    {
      "id": "ex4",
      "lesson": "chain",
      "question": "After one step at rate 1, what is the new bias?",
      "type": "number",
      "options": [],
      "answer": 20.05,
      "hint": "The local derivative of μ with respect to b is 1.",
      "explanation": "20 − 1(−0.05) = 20.05."
    },
    {
      "id": "ex5",
      "lesson": "update",
      "question": "After updating all three parameters with rate 1, what mean does Ava receive?",
      "type": "number",
      "options": [],
      "answer": 55.7,
      "hint": "Use the updated weights and bias together.",
      "explanation": "2(10.10) + 3(5.15) + 20.05 = 55.70."
    },
    {
      "id": "ex6",
      "lesson": "update",
      "question": "Reset the model. If y = 50 and η = 1, what is the new mean?",
      "type": "number",
      "options": [],
      "answer": 54.3,
      "hint": "The signed residual is now positive.",
      "explanation": "The mean falls by (2² + 3² + 1) × 0.05 = 0.70 points."
    },
    {
      "id": "ex7",
      "lesson": "rate",
      "question": "At rate 10, does this update from 55 to 62 improve the NLL?",
      "type": "choice",
      "options": [
        "Yes, it reduces the squared residual.",
        "No, any step across 60 increases the loss."
      ],
      "answer": 0,
      "hint": "Compare distances to 60.",
      "explanation": "The distance falls from five points to two, so the squared residual decreases."
    }
  ],
  "faq": [
    {
      "id": "m3-faq-0",
      "question": "Why divide by 100 when the spread is 10?",
      "answer": "The Gaussian NLL divides the squared residual by twice the variance. Differentiating the square cancels the two and leaves the variance, 10² = 100.",
      "formal": "∂L/∂μ = (μ − y)/σ²",
      "code": "print((55 - 60) / 10**2)",
      "check": "If σ doubled, how would the slope change?",
      "topic": "Loss"
    },
    {
      "id": "m3-faq-1",
      "question": "Why do the two weights get different gradients?",
      "answer": "The same mean slope reaches both weights. Ava’s two hours multiply the first weight and her three practice sets multiply the second. Each local multiplier scales the slope.",
      "formal": "∇w L = −0.05 [2, 3]",
      "code": "print(-0.05 * torch.tensor([2., 3.]))",
      "check": "What gradient would an unused feature with value zero receive?",
      "topic": "Chain rule"
    },
    {
      "id": "m3-faq-2",
      "question": "Why does subtracting a gradient raise the bias?",
      "answer": "The bias gradient is negative because raising the bias raises the mean toward the observation. Subtracting −0.05 adds 0.05 to the old bias at learning rate 1.",
      "formal": "b′ = 20 − 1(−0.05) = 20.05",
      "code": "print(20 - 1 * (-0.05))",
      "check": "Which way would the bias move if Ava scored 50?",
      "topic": "Update"
    },
    {
      "id": "m3-faq-3",
      "question": "Why can a step cross the observed score and still help?",
      "answer": "The loss depends on squared distance. Going from 55 to 62 crosses 60, yet the new prediction is only two points away. A step to 66.2 goes farther away and raises the loss.",
      "formal": "(62 − 60)² < (55 − 60)²",
      "code": "print((62-60)**2, (55-60)**2)",
      "check": "What happens when the distances before and after the step are equal?",
      "topic": "Learning rate"
    },
    {
      "id": "m3-faq-4",
      "question": "Why call backward before updating the weights?",
      "answer": "All three derivatives belong to the original forward pass. PyTorch evaluates them on that graph, then the model uses them together in one descent step.",
      "formal": "θ′ = θ − η∇L(θ)",
      "code": "loss.backward()\nwith torch.no_grad():\n    w -= eta * w.grad\n    b -= eta * b.grad",
      "check": "Why should a second training step compute a fresh loss?",
      "topic": "Autograd"
    }
  ]
};
