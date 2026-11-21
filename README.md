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

## New modules

Reuse `courses/ml-foundations/` as the permanent course landing page. Create `module-02/`, `module-03/`, etc. with the same student-facing navigation, course-specific notebook and FAQ. GitHub Pages automatically updates after commits to `main`.

## Publishing and Blackboard

GitHub Pages: Repository → Settings → Pages → Deploy from a branch → main / root.

In Blackboard, add https://kauroy1994.github.io/TeachReach/courses/ml-foundations/module-01/ as a web link for Module 01, or the top-level TeachReach URL for the full course portal.

**Theme:** UA Crimson Flame #9E1B32, Capstone Gray #828A8F, white. Course activities use locally stored practice progress and privacy-conscious shared question registration.
