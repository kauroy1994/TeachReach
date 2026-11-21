# TeachReach · University of Alabama

**One course portal, every module, available from any browser.**

Student website: https://kauroy1994.github.io/TeachReach/

## Machine Learning Foundations

Module 01 — **Why machine learning? Tensors, data, predictions and learning**

- University of Alabama–themed lecture deck with the Campus Study Coach example
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


## Consistent interface across modules

Modules 01 and 02 share `courses/ml-foundations/assets/module-ui.css` and `module-ui.js`. Both use the same UA header, module tabs, low-data toggle, and accessible view controls. Slides, Explore labs, Notebooks, and Office Hours provide **Full screen** (in-page Fullscreen API) and **Open in new tab** as distinct controls. Standalone resources also show a consistent Full screen control and a link back to their module. On the slide decks, press **F** to enter/exit full screen, **G** for the slide navigator, **N** for speaker notes, and arrow keys to navigate. Module-specific lesson content, exercises, FAQs, and notebook source files remain separate.

## Future modules

Reuse `courses/ml-foundations/` as the course landing page. Add `module-03/` and beyond with the same student-facing navigation, course-specific notebook and FAQ. GitHub Pages automatically updates after commits to `main`.

## Publishing and Blackboard

GitHub Pages: Repository → Settings → Pages → Deploy from a branch → main / root.

In Blackboard, add https://kauroy1994.github.io/TeachReach/courses/ml-foundations/module-01/ as a web link for Module 01, or the top-level TeachReach URL for the full course portal.

**Theme:** UA Crimson Flame #9E1B32, Capstone Gray #828A8F, white. Course activities use locally stored practice progress and privacy-conscious shared question registration.
