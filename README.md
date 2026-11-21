# TeachReach — University of Alabama

A single GitHub Pages website for multiple courses and modules.

- Portal: `index.html`
- Course: `courses/ml-foundations/index.html`
- Module 01: `courses/ml-foundations/module-01/index.html`
- Lecture slides, interactive tensors, exercises, and professor-guided virtual office hours are inside Module 01.

## Publish with GitHub Pages

Go to repository **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root)** and save. The permanent URL is `https://kauroy1994.github.io/TeachReach/`.

## Update course content

Add subsequent modules as sibling folders under `courses/ml-foundations/`, and link them from `courses/ml-foundations/index.html`. For another course, create a new folder under `courses/` and add it to the main portal.

## Question submission

Click **Ask a new question** to compose an email to `kroy2@ua.edu`. The page works without login or LLM access. To add a reviewed FAQ answer for everyone, edit `courses/ml-foundations/module-01/assets/faq_seed.js` and, if maintaining the structured source, `content/faq.json` together. GitHub Pages publishes the updated static FAQ automatically. Do not collect sensitive student records through public GitHub Issues.

## Course accessibility

Accessible navigation, responsive layout, low-data mode, searchable 20-answer FAQ, self-check exercises, and readable formal mathematical notation. Device-local exercise progress requires no student account.
