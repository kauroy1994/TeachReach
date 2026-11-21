# Connect the TeachReach shared question register (one-time, browser-only setup)

The **public TeachReach site** stays on GitHub Pages. The **question inbox** is a private Google Sheet; a free Apps Script web app accepts submissions from the public course site and publishes an email-free list of pending questions.

## Prepared inbox

The blank question register has already been created in the connected Google account:

**[TeachReach ML Foundations Question Register](https://docs.google.com/spreadsheets/d/1i5se-ApkNFNxh1cRSx7oI1DN8K65RaNbPb2ohesbLZI/edit)**

The sheet is private to its Google account. It stores full names and email addresses; the student-facing table displays *only first name + last initial*, question, lesson, and status. Students also see their own full submitted details on their own device.

## Deploy without Python or Codespaces

1. Open the Sheet. Choose **Extensions → Apps Script**.
2. Open `Code.gs` and replace the default text with the complete source from [Code.gs](Code.gs) in this repository. Save.
3. Select **Deploy → New deployment → Web app**. Choose **Execute as: Me** and **Who has access: Anyone**. Grant the required Google Sheet access as the owner.
4. Copy the resulting URL, which ends with `/exec`.
5. In GitHub, open `assets/question-config.js` in each released module directory (01, 02, and 03). Edit the `url` string in each to your `/exec` URL, then commit the changes. Refresh the public TeachReach site.

If you already deployed the earlier Module 01-only Apps Script, **replace it with the updated `Code.gs` and create a new version of the web-app deployment**. The current script routes question submissions and public listings by `module-01`, `module-02`, or `module-03` in a shared faculty Sheet.

The student question form now submits to the Sheet and receives a registration number. The class register refreshes by reading only public, pseudonymized fields. No student needs a Google account, GitHub account, local Python installation, or API key.

## Faculty workflow

- Review the pending questions in the module’s on-page table. Open the private Google Sheet to see question ID, full student name, email, lesson, text and status.
- Keep a question in **pending** while it awaits a response.
- When you approve an FAQ answer, add it to the appropriate module's curated FAQ data: Module 01 uses `courses/ml-foundations/module-01/assets/faq_seed.js`; Modules 02 and 03 each use their own `assets/content.js` FAQ array. Change the question's status in the private Sheet to **answered** (or delete that row). It disappears from the public pending table after refresh.
- The public site never exposes email fields or the private faculty notes column.

## Access and data handling

The Google account owning the Sheet is responsible for student-data access. Use an institution-approved Google Workspace account or other approved storage if your course's privacy requirements call for it. Avoid entering grades, identifiable academic records, or private student information inside question text; review that queue regularly. Public questions appear immediately under the submitted name abbreviation.

## Optional extension

The existing shared Sheet stores all three modules, differentiated by the Course and Module columns. Future modules can be added explicitly to the server-side allowed module list; they should never silently write into Module 01's queue.
