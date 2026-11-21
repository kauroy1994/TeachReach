# TeachReach — Common course-module interface
University of Alabama · Machine Learning Foundations

This document is the reusable UI contract for Modules 01, 02, and later modules.
Teaching content differs by module, but navigation and instructional controls should not.

## Shared assets
- `courses/ml-foundations/assets/module-ui.css`: header, overview shortcuts, resource controls, slide typography, notebook cells, practice areas, question forms, and responsive patterns.
- `courses/ml-foundations/assets/module-ui.js`: iframe Full screen/Open in new tab, standalone Full screen, and common module UI behavior.
- Each module retains its topic-specific diagrams, lesson data, examples, notebook, and FAQs.

## Module portal structure (same in both modules)
1. Same University of Alabama TeachReach header and seven student tabs: Module overview, Class slides, Explore, Exercises, Notebook, Office hours, Ask a question. An additional Home link remains visible.
2. A full-width crimson introductory hero only on the Overview tab. Module-specific graphics may differ.
3. Exactly five illustrated shortcut cards: slides, explore, exercises, notebook, office hours.
4. A faculty portrait and a direct link to module-specific office hours.
5. A consistent footer with Home, Course modules, and a cross-module link.
6. Inline embedded slides, lab, notebook, and office-hours views with the same Full screen and Open in new tab controls.
7. The fullscreen button uses the browser Fullscreen API on the embedded frame, if supported. The separate new-tab action opens the standalone resource. An embedded-only office-hours query parameter must not carry over into that standalone URL.

## Standalone resources
- Classroom slide decks use the same top bar and bottom row: All slides, Virtual office hours, Speaker notes, Full screen, Back, Next.
- Keyboard shortcuts on both slide decks: G overview, N notes, F full screen, P PyTorch examples, arrow keys for slides.
- Every slide includes a Show/Hide PyTorch example control plus Copy code.
- Interactive labs have matching code controls; Module 2 probability-lab snippets update to reflect slider changes.
- Notebook pages share a crimson introductory banner, white resource toolbar, white markdown lesson cards, dark code cells, and Copy code controls.
- Office hours in both modules display the same static faculty photograph, offer browser narration, and display module-specific curated FAQ answers.
- Full-page resources have the same TeachReach header, module navigation, fullscreen toolbar, and course footer.


## Slide scrolling and overlap prevention (critical)
- The presentation header and footer are fixed-height/flex-shrink-zero structural regions. The central slide stage is the **only** independently scrollable region on both modules: `overflow-y:auto; min-height:0; flex:1 1 auto`.
- Module 01 must not use `display:grid; align-items:center; flex:1` on `.slide-content`. That combination compresses long teaching slides and can visually overlap content with the footer. The shared CSS overrides it with normal block layout and allows the parent slide stage to scroll.
- Long PyTorch examples scroll within their code block; they must not push or overlap subsequent diagrams. The slide itself remains scrollable for the content below.
- Module 01's Full screen control must remain visible on small screens; older local CSS hides the last control at 600px and must be overridden.
- Responsive slide footers can wrap into two rows on phone widths, retaining All slides, Office hours, Speaker notes, Full screen, Back and Next.
- Advancing to a new slide resets the slide scroll position to the top.
- Audit both collapsed and expanded PyTorch examples, long exercises, diagrams, end-of-deck slides, and horizontal overflow at desktop, tablet and phone widths.

## Responsive behavior
- Desktop: horizontal header and navigation; wide slide/lab content.
- Tablet: wrapping layout and simplified geometry.
- Mobile: collapsible module menu, full-width learning content, stacked shortcut cards where appropriate, readable buttons, and portrait-preserving office hours.
- Favor adequate color contrast and explicit labels over icon-only controls.

## Checklist before future changes
- Inspect both module portals on desktop and mobile after a styling change.
- Open each tab and each embedded view.
- Open each resource in a separate tab; confirm no embedded-only layout persists.
- Test both Full screen and Escape / Exit full screen.
- Test slides, keyboard shortcuts, example Show/Hide, and Copy code.
- Test lab sliders and updated code snippets.
- Test office-hours question selection, portrait visibility, Listen and Stop.
- Check notebook cell readability and Colab/download links.
- Check exercise choices, numeric answers, hints, and stored progress.
- Check question-form states; shared submissions require the separately deployed Apps Script service.
- Verify local links and that no duplicate element IDs exist.
- Check GitHub Pages build/deploy status after publishing.
- Compare screenshots at desktop, tablet and phone sizes when browser-based visual review is available.

Site resources remain static and free to students. This design system does not require a permanent Codespace, AI account, or paid API.
