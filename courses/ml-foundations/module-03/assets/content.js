window.TR_M3 ={
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
      "section": "01 · Score a prediction",
      "title": "Ava’s prediction was 55. Suppose she scored 60.",
      "lead": "Use the rule from Module 01. Ava studied two hours and completed three sets. Her fictional exam score is now known.",
      "math": "2 × 10 + 3 × 5 + 20 = 55",
      "explain": "The inputs and observed score stay on the page. We can edit the two weights and the starting score, called the bias. First predict what would happen if only the bias increased by one.",
      "visual": [
        [
          "Hours",
          "2 × 10",
          "20 points"
        ],
        [
          "Sets",
          "3 × 5",
          "15 points"
        ],
        [
          "Bias",
          "+20",
          "55 points total"
        ]
      ],
      "check": "What would the model predict with bias 21? What would Ava’s observed score be?",
      "checkAnswer": "The prediction would rise to 56. Her observed exam score stays 60. We changed the rule, not the record.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype)\nbias = 20.\nmean = x @ w + bias\nprint(mean.item(), (x @ w + 21).item())"
    },
    {
      "section": "01 · Score a prediction",
      "title": "Which mean makes 60 more plausible?",
      "lead": "Recall the last probability lesson. Compare two Gaussian score distributions with the same spread of 10 points. Center one at 55 and one at 56.",
      "math": "Loss at 55 ≈ 3.346524      Loss at 56 ≈ 3.301524",
      "explain": "The bell centered at 56 is higher at the observed 60. Module 02 called minus the natural log of that height the negative log-likelihood, or loss. A better fit here has a smaller loss.",
      "visual": [
        [
          "Observed",
          "60",
          "same exam"
        ],
        [
          "Mean 55",
          "3.346524",
          "starting loss"
        ],
        [
          "Mean 56",
          "3.301524",
          "trial loss"
        ]
      ],
      "check": "If we shift the mean from 55 down to 54, should the loss rise or fall?",
      "checkAnswer": "It rises. At the same spread, 60 is farther from the center 54, so the density there is smaller.",
      "code": "import torch\ndef loss(mean):\n    mean = torch.tensor(mean, dtype=torch.float64)\n    model = torch.distributions.Normal(mean, 10.)\n    return -model.log_prob(mean.new_tensor(60.))\n\nfor mean in [54, 55, 56]:\n    print(mean, round(loss(mean).item(), 6))"
    },
    {
      "section": "01 · Score a prediction",
      "title": "Calculate the part of the loss that changes",
      "lead": "Keep the spread fixed. Computing the Gaussian loss gives a fixed starting amount plus a penalty for missing 60. The symbol μ names the predicted mean.",
      "math": "Penalty = (μ − 60)² ÷ (2 × 10²) = (μ − 60)² ÷ 200",
      "explain": "At 55 the signed miss is −5. Squaring gives 25, and dividing by 200 gives 0.125. Add the same fixed amount, about 3.221524, to recover the full loss. The notebook shows where both terms come from.",
      "visual": [
        [
          "Mean 55",
          "25 / 200",
          "penalty 0.125"
        ],
        [
          "Mean 56",
          "16 / 200",
          "penalty 0.080"
        ],
        [
          "Mean 60",
          "0 / 200",
          "penalty 0"
        ]
      ],
      "check": "At a mean of 58, what penalty do we add?",
      "checkAnswer": "58 − 60 = −2. Square it and divide by 200 to get 4/200 = 0.020.",
      "code": "import torch\ndef penalty(mean):\n    return (mean - 60.) ** 2 / 200.\n\nmeans = torch.tensor([55., 56., 58., 60.])\nprint(penalty(means))"
    },
    {
      "section": "02 · Measure a slope",
      "title": "A slope answers “how much per point?”",
      "lead": "Move the mean from 55 to 56. Compute the change in the penalty, then divide by the change in the mean. Use after minus before in both places.",
      "math": "Average slope = (0.080 − 0.125) / (56 − 55) = −0.045",
      "explain": "Read this as “the loss fell by 0.045 per point of mean over this move.” The fixed amount cancels in the subtraction. This calculation uses two distinct predictions.",
      "visual": [
        [
          "Change in mean",
          "+1",
          "score point"
        ],
        [
          "Change in loss",
          "−0.045",
          "loss units"
        ],
        [
          "Ratio",
          "−0.045",
          "loss units per point"
        ]
      ],
      "check": "From 55 to 57, the penalty changes from 0.125 to 0.045. What is the average slope?",
      "checkAnswer": "The change is −0.080 over two score points. Divide by 2 to get −0.040 per point.",
      "code": "import torch\ndef penalty(mean):\n    return (mean - 60.) ** 2 / 200.\n\nm = torch.tensor(55., dtype=torch.float64)\nprint((penalty(m+2) - penalty(m)) / 2)",
      "figure": {
        "src": "assets/average-slope.svg",
        "alt": "Mean increases from 55 to 56. Loss penalty drops from 0.125 to 0.080. The slope triangle shows a run of +1 and a rise of −0.045."
      }
    },
    {
      "section": "02 · Measure a slope",
      "title": "Shrink the measuring step",
      "lead": "The curve bends, so the rate across two points can differ from the rate right at 55. Start at 55 each time. Call the trial move h.",
      "math": "average slope = [penalty(55 + h) − penalty(55)] / h",
      "explain": "The values approach −0.050 as h approaches zero. This limiting slope is the derivative at 55. On a graph it is the slope of the line that follows the curve’s direction right there, called the tangent.",
      "visual": [
        [
          "h = 1",
          "−0.045",
          "one-point trial"
        ],
        [
          "h = 0.1",
          "−0.0495",
          "tenth of a point"
        ],
        [
          "h = 0.01",
          "−0.04995",
          "hundredth of a point"
        ]
      ],
      "check": "Why do we shrink h instead of setting h equal to zero in the fraction?",
      "checkAnswer": "At zero both differences are zero and division by zero is undefined. We examine the ratios for nonzero steps and see which value they approach.",
      "code": "import torch\ndef penalty(mean):\n    return (mean - 60.) ** 2 / 200.\n\nm = torch.tensor(55., dtype=torch.float64)\nfor h in [1., .1, .01]:\n    print(h, ((penalty(m+h) - penalty(m))/h).item())"
    },
    {
      "section": "02 · Measure a slope",
      "title": "Find the exact slope with ordinary multiplication",
      "lead": "At 55 the miss is −5. After a trial move h the miss is −5 + h. Multiply this expression by itself before taking the difference.",
      "math": "(−5 + h)(−5 + h) = 25 − 5h − 5h + h² = 25 − 10h + h²",
      "explain": "Subtract the old square, 25. Divide by 200h. For nonzero h, (−10h + h²)/(200h) = (−10 + h)/200. Now let h approach zero. The result is −10/200 = −0.05.",
      "visual": [
        [
          "Subtract",
          "−10h + h²",
          "change in squared miss"
        ],
        [
          "Divide",
          "(−10 + h)/200",
          "average slope"
        ],
        [
          "Shrink h",
          "−10/200",
          "exact local slope"
        ]
      ],
      "check": "Where did the two copies of −5h come from?",
      "checkAnswer": "Each factor contributes one cross product: (−5) × h and h × (−5). Together they give −10h.",
      "code": "import torch\ndef penalty(mean):\n    return (mean - 60.) ** 2 / 200.\n\nh = torch.tensor(0.1, dtype=torch.float64)\nprint(((penalty(55+h)-penalty(55))/h).item(), ((-10+h)/200).item())"
    },
    {
      "section": "02 · Measure a slope",
      "title": "Use the same reasoning anywhere on the curve",
      "lead": "Call the current signed miss r = μ − 60. Replacing −5 with r gives (r + h)² − r² = 2rh + h². Divide by 200h and shrink h.",
      "math": "dL/dμ = 2r/200 = (μ − 60)/100",
      "explain": "Read dL/dμ as “change in loss per point of predicted mean, right here.” A negative slope means a small move to the right lowers loss. At 60 the slope vanishes and the squared penalty reaches its minimum.",
      "visual": [
        [
          "At 55",
          "−0.05",
          "raise the mean"
        ],
        [
          "At 60",
          "0",
          "minimum loss"
        ],
        [
          "At 65",
          "+0.05",
          "lower the mean"
        ]
      ],
      "check": "At 58, which way should the mean move, and what is its local slope?",
      "checkAnswer": "(58 − 60)/100 = −0.02. A small increase toward 60 reduces the loss.",
      "code": "import torch\ndef penalty(mean):\n    return (mean - 60.) ** 2 / 200.\n\nmeans = torch.tensor([55., 58., 60., 65.])\nprint((means - 60)/100)"
    },
    {
      "section": "03 · Follow one weight",
      "title": "Move just one weight",
      "lead": "Return to the original model. Change the hours weight from 10 to 10.10. Leave the sets weight at 5 and bias at 20.",
      "math": "New mean = 2 × 10.10 + 3 × 5 + 20 = 55.20",
      "explain": "A weight increase of 0.10 moves the mean by 0.20 because Ava has two hours. Try the same change separately on the sets weight or on the bias. Always reset first.",
      "visual": [
        [
          "Hours weight +0.10",
          "+0.20",
          "change in mean"
        ],
        [
          "Sets weight +0.10",
          "+0.30",
          "three sets"
        ],
        [
          "Bias +0.10",
          "+0.10",
          "added once"
        ]
      ],
      "check": "If only the sets weight rose by 0.20, how far would the mean move?",
      "checkAnswer": "There are three sets, so the mean would move by 3 × 0.20 = 0.60 points, from 55 to 55.60.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype)\nbias = 20.\nmean = x @ w + bias\ntrial = w.clone()\ntrial[1] += .2\nprint((x @ trial + bias).item())"
    },
    {
      "section": "03 · Follow one weight",
      "title": "Follow the change from one weight to the loss",
      "lead": "An hours-weight change acts in two stages. It moves the mean, then the new mean changes the loss. Multiply the rates along that route. This multiplication is the chain rule.",
      "math": "(−0.05 loss per mean point) × (2 mean points per unit of hours weight) = −0.10",
      "explain": "Holding the other parameters fixed makes this a partial derivative. We write ∂L/∂w₁ for the loss slope with respect to the first weight. For a tiny increase of 0.01, expect a loss change of about −0.001.",
      "visual": [
        [
          "w₁ → mean",
          "× 2",
          "Ava’s hours"
        ],
        [
          "mean → loss",
          "× (−0.05)",
          "local slope"
        ],
        [
          "w₁ → loss",
          "−0.10",
          "multiply the rates"
        ]
      ],
      "check": "Why is −0.10 a rate, while −0.001 is a predicted change?",
      "checkAnswer": "−0.10 is loss change per unit of weight near the starting model. Multiply by the actual move, 0.01, to estimate the change in loss.",
      "code": "import torch\ndef loss(mean):\n    mean = torch.tensor(mean, dtype=torch.float64)\n    model = torch.distributions.Normal(mean, 10.)\n    return -model.log_prob(mean.new_tensor(60.))\n\nactual = loss(55 + 2 * .01) - loss(55)\nprint(\"Estimated:\", -.1 * .01, \"Actual:\", actual.item())"
    },
    {
      "section": "03 · Follow one weight",
      "title": "Collect the three partial derivatives",
      "lead": "Repeat the calculation for the sets weight and the bias. Keep the order hours weight, sets weight, bias. The ordered list of partial derivatives is the gradient.",
      "math": "gradient = [−0.05 × 2, −0.05 × 3, −0.05 × 1] = [−0.10, −0.15, −0.05]",
      "explain": "The second entry has the largest magnitude because the mean changes by three points per unit change in that weight for Ava. This comparison depends on the input and its units.",
      "visual": [
        [
          "Hours weight",
          "−0.10",
          "two hours"
        ],
        [
          "Sets weight",
          "−0.15",
          "three sets"
        ],
        [
          "Bias",
          "−0.05",
          "added once"
        ]
      ],
      "check": "If a different student had zero practice sets, what would that student’s loss slope be for the sets weight?",
      "checkAnswer": "Zero. Changing the sets weight cannot affect this student’s prediction because that weight is multiplied by zero.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype)\nbias = 20.\nmean = x @ w + bias\nd_mean = (mean - 60)/100\nprint(\"Weights:\", d_mean * x, \"Bias:\", d_mean)"
    },
    {
      "section": "04 · Update and verify",
      "title": "Turn slopes into one update",
      "lead": "The slopes tell us how loss responds. The learning rate sets the size of a training step. Choose 1 for this example. Subtract rate × slope from each starting parameter.",
      "math": "new value = old value − learning rate × partial derivative",
      "explain": "For the hours weight, 10 − 1 × (−0.10) = 10.10. Subtracting a negative raises the weight, which raises Ava’s mean toward 60. Use slopes from the same starting prediction for all three changes.",
      "visual": [
        [
          "Hours weight",
          "10 → 10.10",
          "subtract −0.10"
        ],
        [
          "Sets weight",
          "5 → 5.15",
          "subtract −0.15"
        ],
        [
          "Bias",
          "20 → 20.05",
          "subtract −0.05"
        ]
      ],
      "check": "At a rate of 0.5, what would the new hours weight be?",
      "checkAnswer": "10 − 0.5 × (−0.10) = 10.05. Halving the rate halves this parameter change.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype)\nbias = 20.\nmean = x @ w + bias\nrate = 1.\nslope = (mean - 60)/100\nprint(w - rate * slope * x, bias - rate * slope)"
    },
    {
      "section": "04 · Update and verify",
      "title": "Recompute the prediction and the loss",
      "lead": "Use Module 01’s rule again with the three updated values. Then use Module 02’s loss to check whether the update helped.",
      "math": "2 × 10.10 + 3 × 5.15 + 20.05 = 55.70",
      "explain": "The hours term adds 0.20, the sets term adds 0.45 and the bias adds 0.05. The miss shrinks from 5 to 4.30 points. The loss falls from 3.346524 to 3.313974.",
      "visual": [
        [
          "Original mean",
          "55.00",
          "missed by 5"
        ],
        [
          "Updated mean",
          "55.70",
          "missed by 4.30"
        ],
        [
          "Loss change",
          "−0.03255",
          "better fit to Ava"
        ]
      ],
      "check": "Why did the sets-weight increase of 0.15 add 0.45 to the prediction?",
      "checkAnswer": "Ava completed three sets, so a change of 0.15 points per set adds 3 × 0.15 = 0.45 points.",
      "code": "import torch\ndef loss(mean):\n    mean = torch.tensor(mean, dtype=torch.float64)\n    model = torch.distributions.Normal(mean, 10.)\n    return -model.log_prob(mean.new_tensor(60.))\n\nupdated = 2*10.10 + 3*5.15 + 20.05\nprint(updated, loss(updated).item())"
    },
    {
      "section": "04 · Update and verify",
      "title": "Show PyTorch what can change",
      "lead": "Now verify the work you did by hand. Give PyTorch the same two weights and bias. The flag requires_grad=True tells it to track how calculations depend on each parameter.",
      "math": "forward pass: weights and bias → predicted mean → loss",
      "explain": "The input vector, observed score, and spread are fixed. Run the model forward once. At the end, loss holds one number and PyTorch has recorded the operations that produced it.",
      "visual": [
        [
          "Starting values",
          "10, 5, 20",
          "track these"
        ],
        [
          "Prediction",
          "55",
          "computed from them"
        ],
        [
          "Loss",
          "3.346524",
          "computed from mean"
        ]
      ],
      "check": "Which three numerical derivatives should PyTorch produce for the starting model?",
      "checkAnswer": "In parameter order they should be −0.10, −0.15 and −0.05. Write them down before continuing.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\nmean = x @ w + b\nobserved = x.new_tensor(60.)\nloss = -torch.distributions.Normal(mean, 10.).log_prob(observed)\nprint(mean.item(), loss.item())"
    },
    {
      "section": "04 · Update and verify",
      "title": "Read the gradients before changing anything",
      "lead": "Call loss.backward() to trace the recorded operations backward using the chain rule. PyTorch stores the two weight slopes in w.grad and the bias slope in b.grad.",
      "math": "w.grad ≈ [−0.10, −0.15]     b.grad ≈ −0.05",
      "explain": "Calling backward calculates slopes. A separate subtraction changes the parameters. The notebook checks each slope against the hand calculation and verifies the updated prediction and loss.",
      "visual": [
        [
          "Compute",
          "backward()",
          "trace loss back to w and b"
        ],
        [
          "Inspect",
          "w.grad, b.grad",
          "compare with paper"
        ],
        [
          "Then update",
          "old − rate × slope",
          "recompute the loss"
        ]
      ],
      "check": "Immediately after backward(), before any subtraction, what is the hours weight?",
      "checkAnswer": "It is still 10. Its gradient is now stored as −0.10. Only the update changes the weight to 10.10.",
      "code": "import torch\nx = torch.tensor([2., 3.], dtype=torch.float64)\nw = torch.tensor([10., 5.], dtype=x.dtype, requires_grad=True)\nb = torch.tensor(20., dtype=x.dtype, requires_grad=True)\nmean = x @ w + b\nobserved = x.new_tensor(60.)\nloss = -torch.distributions.Normal(mean, 10.).log_prob(observed)\nloss.backward()\nexpected_w = x.new_tensor([-0.10, -0.15])\nexpected_b = x.new_tensor(-0.05)\ntorch.testing.assert_close(w.grad, expected_w)\ntorch.testing.assert_close(b.grad, expected_b)\nprint(w.grad.tolist(), b.grad.item())"
    },
    {
      "section": "04 · Update and verify",
      "title": "Try a smaller step and a larger one",
      "lead": "Restart at 55 each time. At rate 1 the mean gains 0.70. At rate 10 all three parameter changes are ten times as large, so the mean gains 7.00.",
      "math": "rate 1: 55 → 55.70      rate 10: 55 → 62      rate 16: 55 → 66.20",
      "explain": "Compare the final distance to 60 with the original distance of five. Crossing 60 can still help. Going all the way to 66.20 makes the miss larger.",
      "visual": [
        [
          "Rate 1",
          "4.30 away",
          "loss falls"
        ],
        [
          "Rate 10",
          "2.00 away",
          "loss falls"
        ],
        [
          "Rate 16",
          "6.20 away",
          "loss rises"
        ]
      ],
      "check": "Restart at 55 with rate 5. What is the mean after one update? Does loss fall?",
      "checkAnswer": "55 + 5 × 0.70 = 58.50. It is 1.50 points from 60, closer than before, so loss falls.",
      "code": "import torch\ndef loss(mean):\n    mean = torch.tensor(mean, dtype=torch.float64)\n    model = torch.distributions.Normal(mean, 10.)\n    return -model.log_prob(mean.new_tensor(60.))\n\nfor rate in [1, 5, 10, 16]:\n    new_mean = 55 + rate * .70\n    print(rate, new_mean, loss(new_mean).item())"
    },
    {
      "section": "END OF MODULE",
      "title": "Module 03 review questions",
      "lead": "Work through the questions on paper. Open each answer when you are ready to compare your reasoning.",
      "review": [
        [
          "At means 55 and 56 the penalties are 0.125 and 0.080. What is the average slope over this move? What would you need for the slope right at 55?",
          "(0.080 − 0.125)/(56 − 55) = −0.045 per score point. Use successively smaller moves from 55 to find the local slope. Here it approaches −0.05."
        ],
        [
          "Ava has two hours and three sets. The loss slope with respect to her predicted mean is −0.05. What slopes should PyTorch report for the two weights and the bias?",
          "An extra unit of hours weight adds 2 to the mean, an extra unit of sets weight adds 3, and an extra unit of bias adds 1. Multiply each by −0.05 to get −0.10, −0.15 and −0.05."
        ],
        [
          "Start with weights 10 and 5 and bias 20. Subtract the gradient once with learning rate 1. What does the updated rule predict, and what evidence would show whether it helps other students?",
          "The weights become 10.10 and 5.15, and the bias becomes 20.05. Ava’s new mean is 2 × 10.10 + 3 × 5.15 + 20.05 = 55.70. Compare errors on students whose scores were set aside during training."
        ]
      ],
      "code": "import torch\nx = torch.tensor([2., 3.])\nw = torch.tensor([10., 5.], requires_grad=True)\nb = torch.tensor(20., requires_grad=True)\nloss = -torch.distributions.Normal(x @ w + b, 10.).log_prob(torch.tensor(60.))\nloss.backward()\nprint(w.grad, b.grad)\nwith torch.no_grad():\n    print(x @ (w - w.grad) + (b - b.grad))"
    },
    {
      "section": "UP NEXT · MODULE 04",
      "title": "From fitting Ava to testing a model",
      "lead": "For Ava, every parameter combination that predicts 60 reaches the same lowest loss. A different student can receive a different prediction from those same models.",
      "math": "2w₁ + 3w₂ + b = 60   ⇒   ∇L = 0",
      "explain": "Both rules fit Ava exactly. Their disagreement on another student gives us a new question. Which rule predicts well on students whose scores we kept out of training? Module 04 begins there.",
      "check": "Can two models fit Ava exactly yet disagree for a student with one hour and one practice set?",
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
      "code": "import torch\nX = torch.tensor([[2., 3.], [1., 1.]])\nfor w, b in [([10., 5.], 25.), ([10., 6.], 22.)]:\n    print((X @ torch.tensor(w) + b).tolist())",
      "checkAnswer": "Yes. Weights [10, 5] with bias 25 and weights [10, 6] with bias 22 both give Ava 60. For [1, 1] they predict 40 and 38 respectively."
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
      "id": "loss-difference",
      "lesson": "loss",
      "question": "The penalty falls from 0.125 to 0.080. What is the signed change (after minus before)?",
      "type": "number",
      "options": [],
      "answer": -0.045,
      "hint": "Subtract the starting value from the ending value.",
      "explanation": "0.080 − 0.125 = −0.045. The negative sign records a decrease."
    },
    {
      "id": "average-slope",
      "lesson": "slope",
      "question": "The mean rises by 2 points and the loss changes by −0.08. What is the average change per point?",
      "type": "number",
      "options": [],
      "answer": -0.04,
      "hint": "Divide the loss change by the mean change.",
      "explanation": "−0.08/2 = −0.04 loss units per point."
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
      "id": "weight-trial",
      "lesson": "chain",
      "question": "Increase only the hours weight by 0.10. What is Ava’s new predicted mean?",
      "type": "number",
      "options": [],
      "answer": 55.2,
      "hint": "Ava studied two hours. Multiply two by the weight change.",
      "explanation": "55 + 2 × 0.10 = 55.20."
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
      "id": "fresh-update",
      "lesson": "update",
      "type": "number",
      "options": [],
      "question": "A new student has one hour and two sets. Reset the weights to [10, 5], bias to 20, and σ to 10. The observed score is 45. At rate 1, what mean does one simultaneous update produce?",
      "answer": 40.3,
      "hint": "Start at 1 × 10 + 2 × 5 + 20 = 40. Find the mean slope, multiply it by 1, 2 and 1, then subtract the three slopes.",
      "explanation": "The mean slope is (40 − 45)/100 = −0.05. The parameters become 10.05, 5.10 and 20.05. The new prediction is 10.05 + 2(5.10) + 20.05 = 40.30."
    }
  ],
  "faq": [
    {
      "id": "m3-faq-difference",
      "topic": "Slope",
      "question": "What does “per point” mean on the loss curve?",
      "answer": "It tells us how much loss changes for each point the predicted mean moves over a chosen interval. Divide the vertical change by the horizontal change.",
      "formal": "Average slope = change in loss / change in mean",
      "code": "print((0.045 - 0.125) / (57 - 55))",
      "check": "If loss falls by 0.06 over two points, what is the average slope?",
      "checkAnswer": "−0.06/2 = −0.03 per point."
    },
    {
      "id": "m3-faq-derivative",
      "topic": "Slope",
      "question": "Why do we try smaller and smaller changes?",
      "answer": "A curved line can get steeper or flatter as you move. A shorter interval measures what happens closer to your starting point. The limiting rate gives the derivative there.",
      "formal": "At 55: average slope = (−10 + h)/200",
      "code": "for h in [1, .1, .01]:\n    print((-10+h)/200)",
      "check": "As h shrinks toward zero, what number does this expression approach?",
      "checkAnswer": "−10/200 = −0.05."
    },
    {
      "id": "m3-faq-partial",
      "topic": "Slope",
      "question": "What am I holding fixed in a partial derivative?",
      "answer": "To find the slope for the hours weight, vary that weight alone. Keep the sets weight, bias, inputs, observation and spread fixed. The predicted mean and loss can change as a result.",
      "formal": "μ = 2w₁ + 3w₂ + b",
      "code": "print(2*10.1 + 3*5 + 20)",
      "check": "Why can the mean change if we vary only one weight?",
      "checkAnswer": "The mean is an output of the rule. It depends on the weight we varied."
    },
    {
      "id": "m3-faq-0",
      "question": "Why divide by 100 when the spread is 10?",
      "answer": "The Gaussian NLL divides the squared residual by twice the variance. Differentiating the square cancels the two and leaves the variance, 10² = 100.",
      "formal": "∂L/∂μ = (μ − y)/σ²",
      "code": "print((55 - 60) / 10**2)",
      "check": "If σ doubled, how would the slope change?",
      "topic": "Loss",
      "checkAnswer": "The slope would be one quarter as large because variance is the square of the spread. At σ = 20 it is −5/400 = −0.0125."
    },
    {
      "id": "m3-faq-1",
      "question": "Why do the two weights get different gradients?",
      "answer": "The same mean slope reaches both weights. Ava’s two hours multiply the first weight and her three practice sets multiply the second. Each local multiplier scales the slope.",
      "formal": "∇w L = −0.05 [2, 3]",
      "code": "print(-0.05 * torch.tensor([2., 3.]))",
      "check": "What gradient would an unused feature with value zero receive?",
      "topic": "Chain rule",
      "checkAnswer": "Zero for that weight on this example. The mean slope is multiplied by the feature value, and that value is zero."
    },
    {
      "id": "m3-faq-2",
      "question": "Why does subtracting a gradient raise the bias?",
      "answer": "The bias gradient is negative because raising the bias raises the mean toward the observation. Subtracting −0.05 adds 0.05 to the old bias at learning rate 1.",
      "formal": "b′ = 20 − 1(−0.05) = 20.05",
      "code": "print(20 - 1 * (-0.05))",
      "check": "Which way would the bias move if Ava scored 50?",
      "topic": "Update",
      "checkAnswer": "Down. The mean slope would be (55 − 50)/100 = +0.05, so a step at rate 1 would lower the bias from 20 to 19.95."
    },
    {
      "id": "m3-faq-3",
      "question": "Why can a step cross the observed score and still help?",
      "answer": "The loss depends on squared distance. Going from 55 to 62 crosses 60, yet the new prediction is only two points away. A step to 66.2 goes farther away and raises the loss.",
      "formal": "(62 − 60)² < (55 − 60)²",
      "code": "print((62-60)**2, (55-60)**2)",
      "check": "What happens when the distances before and after the step are equal?",
      "topic": "Learning rate",
      "checkAnswer": "With the same spread, equal distances give equal Gaussian loss. For example, means 55 and 65 are both five points from 60."
    },
    {
      "id": "m3-faq-4",
      "question": "Why call backward before updating the weights?",
      "answer": "All three derivatives belong to the original forward pass. PyTorch evaluates them on that graph, then the model uses them together in one descent step.",
      "formal": "θ′ = θ − η∇L(θ)",
      "code": "loss.backward()\nwith torch.no_grad():\n    w -= eta * w.grad\n    b -= eta * b.grad",
      "check": "Why should a second training step compute a fresh loss?",
      "topic": "Autograd",
      "checkAnswer": "The updated parameters give a new mean and therefore a new slope. Run another forward pass to compute the gradient at the new parameters."
    }
  ]
};
