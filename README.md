# TeachReach · Kaushik Roy, University of Alabama

**One course portal, every module, available from any browser.**

Student website: https://kauroy1994.github.io/TeachReach/

## Complete Machine Learning Foundations syllabus

The TeachReach course is **Machine Learning Foundations: From Mathematics to Modern AI**. It includes **16 modules** in four stages:
- **Stage I — Mathematical Foundations (01–04):** linear algebra and tensors; probability; calculus and optimization; statistical learning and generalization.
- **Stage II — Fundamental Learning Algorithms (05–08):** regression and classification; classical ML (kNN, trees, SVMs, ensembles); unsupervised learning and PCA; neural networks and backpropagation.
- **Stage III — Foundations of Modern AI (09–13):** deep learning and representations; self-supervised learning and embeddings; sequence modeling, attention and transformers; language modeling and LLMs; generative models (VAEs, GANs, diffusion).
- **Stage IV — Intelligent and Reliable Learning (14–16):** reinforcement learning; trustworthy ML; integrated machine-learning capstone.

**Full syllabus:** `courses/ml-foundations/syllabus.html`. Stage overviews: `courses/ml-foundations/stage-01/` through `stage-04/`. Modules 01–02 are **released** and retain their original learning resources. Modules 03–16 have **dedicated, navigable syllabus-preview pages** with the same seven-section layout and transparent in-development indicators.

**Every module includes formative practice exercises when released.** Students are **graded on a different instructor-administered in-class variant at the end of each module**. The website's correct-answer feedback is not a graded score. The syllabus includes a *proposed* allocation of 16 end-of-module assessments worth 80% total plus the integrated capstone worth 20%, subject to instructor confirmation.

The complete syllabus also defines prerequisites, technical requirements, stage outcomes, 14 measurable course outcomes, academic integrity and assessment expectations. Instructor attribution throughout the site is **Kaushik Roy, University of Alabama**.

## Machine Learning Foundations

Module 01 — **Why machine learning? Tensors, data, predictions and learning**

- Kaushik Roy, University of Alabama–themed lecture deck with the Campus Study Coach example
- Interactive 1D through higher-dimensional tensor explorer
- Thirteen exercises with immediate feedback and local progress tracking
- Complete in-browser PyTorch notebook, with an optional Google Colab link
- Professor-curated FAQ office hours displaying Professor Roy's portrait
- Professor-recorded audio playback when an FAQ's audio recording exists in `assets/audio/`
- Shared question queue with student confirmation numbers after the one-time question-service deployment

The site is **static**: no Python, backend server, GPU, paid API key, or LLM account is needed for students.

## Faculty operation

- **Class question register**: [Private Google Sheet](https://docs.google.com/spreadsheets/d/1i5se-ApkNFNxh1cRSx7oI1DN8K65RaNbPb2ohesbLZI/edit). Deploy the free Google Apps Script once: [question-service/SETUP.md](question-service/SETUP.md).
- **FAQ content**: `courses/ml-foundations/module-01/assets/faq_seed.js`. Add faculty-approved explanations and change answered question status in the private Sheet.
- **Record answers**: `courses/ml-foundations/module-01/faculty-recordings.html` records your actual voice from a browser microphone. Download files using the exact FAQ ID and upload to `courses/ml-foundations/module-01/assets/audio/`.
- **Notebook source**: `courses/ml-foundations/module-01/ML_Foundations_Module1_PyTorch.ipynb`.

## Module 02 — From Predictions to Probabilities

**Module 01 → Module 02 transition:** the Module 01 overview and final lecture slide now introduce uncertainty after Ava's toy tensor prediction of 55. Module 02 opens with a recap of the feature vector, matrix, weights, and bias, then introduces random variables and probability distributions using the same running example.

- 53 teaching slides covering eight probability lessons and a synthesis.
- Five interactive browser experiments: Normal distributions, conditional probability, Bayes updates, sampling, and Gaussian likelihood.
- Sixteen graded-in-browser exercises with worked answers and local progress tracking.
- A complete 42-cell PyTorch notebook: `courses/ml-foundations/module-02/ML_Foundations_Module2_Probability.ipynb`, readable in-browser and optionally runnable in Colab.
- Twenty-four module-specific curated office-hour FAQs, using the same static professor portrait and the browser's built-in speech synthesis.
- A module-specific question registration form and public pending-question table, ready for the same free Apps Script service used by Module 01.

**Office hours content:** Module 02's FAQ records live in `courses/ml-foundations/module-02/assets/content.js` as `window.TR_M2.faq`. Module 01's established office-hours speech and UI are reused, with no new subscriptions or student API keys.

**Question inbox:** Both modules use a single faculty-controlled Google Sheet, separated by the `Module` field. When the Apps Script web app is deployed, enter the same `/exec` URL into both modules' `assets/question-config.js` files. The question-service script has been updated to accept module-01 and module-02.


## PyTorch example consistency

The same example controls appear throughout both learning modules:

- **Module 01:** all **56** classroom slides have a **Show PyTorch example** button (including the Module 02 teaser and exercise/notation slides), and all **7** interactive tensor lessons provide the same Show/Hide and Copy controls.
- **Module 02:** all **53** classroom slides have runnable, self-contained PyTorch examples; all **5** probability-lab experiments have matching Show/Hide and Copy controls with slider-aware code.
- Classroom presentation shortcuts are identical: **F** full screen, **G** slide overview, **N** speaker notes, **P** PyTorch example, and arrow keys for navigation.
- The shared styling for these controls lives in `courses/ml-foundations/assets/module-ui.css`. The module-specific code is kept in Module 01's `assets/slide_examples.js`, Module 02's `assets/content.js`, and Module 02's `assets/lab_examples.js`.
- Both modules keep faculty-curated office hours, the complete notebook, exercises, the question register, and the course/home navigation.


**UI design system:** [Course module interface specification](courses/ml-foundations/UI_DESIGN_SYSTEM.md). The November 21 harmonization uses identical overview shortcut cards, faculty portrait cards, footer navigation, 7-tab module headers, independent Full screen/Open in new tab controls, embedded Office Hours portrait layout, standalone resource headers, consistent notebook code panels, exercises, and question-form styling across Modules 01 and 02.

## Consistent interface across modules

Modules 01 and 02 share `courses/ml-foundations/assets/module-ui.css` and `module-ui.js`. Both use the same UA header, module tabs, low-data toggle, and accessible view controls. Slides, Explore labs, Notebooks, and Office Hours provide **Full screen** (in-page Fullscreen API) and **Open in new tab** as distinct controls. Standalone resources also show a consistent Full screen control and a link back to their module. On the slide decks, press **F** to enter/exit full screen, **G** for the slide navigator, **N** for speaker notes, and arrow keys to navigate. Module-specific lesson content, exercises, FAQs, and notebook source files remain separate.

## Future modules

Reuse `courses/ml-foundations/` as the course landing page. Add `module-03/` and beyond with the same student-facing navigation, course-specific notebook and FAQ. GitHub Pages automatically updates after commits to `main`.

## Publishing and Blackboard

GitHub Pages: Repository → Settings → Pages → Deploy from a branch → main / root.

In Blackboard, add https://kauroy1994.github.io/TeachReach/courses/ml-foundations/module-01/ as a web link for Module 01, or the top-level TeachReach URL for the full course portal.

**Theme:** UA Crimson Flame #9E1B32, Capstone Gray #828A8F, white. Course activities use locally stored practice progress and privacy-conscious shared question registration.
