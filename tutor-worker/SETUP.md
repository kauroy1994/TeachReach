# Activate the TeachReach office-hours tutor

The chat box is built into every module. It can answer published practice and office-hours questions directly from the site. For a question in a student's own words, it calls your existing Cloudflare Worker. The following steps replace that Worker's “Hello World!” response with the tutor. You can do everything in your browser.

## 1. Create the browser check

1. Sign in to your [Cloudflare dashboard](https://dash.cloudflare.com/). From the account dashboard, search for **Turnstile** and open it.
2. Select **Add widget**. Enter **TeachReach office hours** for the name.
3. Add the hostname **kauroy1994.github.io**. Choose **Managed** mode and create the widget.
4. Leave this tab open. It shows a **site key** and a **secret key**. You will copy each directly into Cloudflare in the next step.

## 2. Save the two Turnstile keys in the existing Worker

1. In another dashboard tab, open **Workers & Pages** and select **teachreach-office-hours**.
2. Open **Settings** and find **Variables and Secrets**. Add the two entries below to **Production**. Copy both values from the Turnstile tab.
3. Save the changes using the dashboard's **Deploy** or **Save** button. Keep your existing **OPENAI_API_KEY** secret. All three names are case-sensitive.

| Name | Type | Value |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Text | Site key |
| `TURNSTILE_SECRET_KEY` | Secret | Secret key |

## 3. Deploy the tutor from GitHub

1. On the same Worker, open **Settings → Builds → Connect**. If this Worker already has a repository, check that it matches the settings below.
2. Choose **GitHub** and authorize access to **kauroy1994/TeachReach**. Select that repository.
3. Use production branch **main** and the repository root for the root directory (usually prefilled as **/**). Leave **Build command** empty. Set **Deploy command** to `npx wrangler@4 deploy`.
4. Connect the repository and start the production build. If connecting does not start one, use the production build's **Run build** or **Retry build** control. Wait for the production deployment to finish. The repository configuration builds the public course index and creates the usage-limit bindings.
5. Open the [Worker status page](https://teachreach-office-hours.kauroy1994.workers.dev/). Look for **"configured":true**. **Hello World!** means the original code is still serving. **"configured":false** means a setting or binding is missing. This status checks for settings, while the student test below checks the connection to OpenAI.

## 4. Try the student experience

Open [CS 483/583, Module 1 office hours](https://kauroy1994.github.io/TeachReach/courses/ml-foundations/module-01/index.html#office).

- **Existing question.** Ask “What could an inbox filter predict about a new message?” Open reference [1] or expand **View source passage** to see the supporting material.
- **New wording.** Ask “In the inbox example, how would previously labeled emails help a machine learning model make a prediction?” A successful live answer has a numbered reference to published TeachReach material. Follow a link and check the explanation against that passage.
- **Outside the course.** Ask “Who won last night's Seattle Mariners game, and what was the final score?” The tutor should invite you to register a new question.
- **If the tutor says the service is unavailable.** Confirm that the Worker status is configured, check the last production deployment, and confirm that the OpenAI API project associated with your secret has billing and model access. A service error leaves the student's draft in the box. A repeated browser-verification failure can indicate that the widget hostname or one of its keys needs correction.

## What gets sent and how usage is limited

Prepared answers run in the browser. For live answers, Cloudflare verifies a Turnstile token and OpenAI receives the question, up to two recently answered questions from this chat, and excerpts from published TeachReach material. The tutor checks the answer against the cited passages before displaying it. The instructor registration form or email draft is a separate action initiated by the student.

The initial limit is 100 live questions across the site per UTC day. Each admitted question can use up to two OpenAI requests, one for the answer and one to check the evidence. OpenAI bills your API project for usage. A short-term limit of 30 submissions per minute per IP also applies. Prepared answers consume no OpenAI requests. To change the site-wide daily limit, add a Worker **Text** variable named `DAILY_QUESTIONS` with an integer from 1 through 10000.

[Cloudflare Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/) · [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) · [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
