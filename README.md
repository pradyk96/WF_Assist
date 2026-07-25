# WF Assist

**WF Assist** is an embeddable, voice-enabled AI portfolio widget for [Wings Forever](https://wingsforever.pro/), the creative portfolio of freelance visual and motion designer **Pratyaksh Kumar**.

It is designed to feel like a compact GPT/Copilot-style conversation: visitors can open a floating widget, type or speak a question, hear a reply, discover relevant projects, understand services, and begin a project enquiry.

![WF Assist is a floating, dark-theme portfolio voice widget with a chat and microphone control.](https://wingsforever.pro/wp-content/uploads/2026/05/new-WF-2048x2048.png)

## What this version does

- **Floating website widget** — isolated in a Shadow DOM so a WordPress theme cannot accidentally restyle it.
- **Voice and chat** — browser speech recognition for microphone input and speech synthesis for replies, with graceful typed-chat fallback.
- **AI answers** — a server-side OpenAI integration when `OPENAI_API_KEY` is set. The browser never receives the secret.
- **Portfolio grounding** — approved information about WF’s motion design, visual design, 3D concepts, creative process, portfolio structure, selected projects, and public contact links is included in the server instructions.
- **Safe fallback** — without an AI key, it still provides concise, portfolio-specific answers for common questions; it does not pretend to be GPT or invent details.
- **Project enquiries** — a conversational lead flow collects name, company, work email, country/time zone, project description, and preferred timeline. It submits only when a `LEAD_WEBHOOK_URL` has been configured.
- **Privacy and brand safeguards** — no fabricated pricing, deadlines, availability, client claims, or guarantees; no account/payment data requests; no user data is sent to an AI provider during the dedicated lead-capture flow.

## Local preview

### Prerequisites

- Node.js **20+**
- An OpenAI API key only if you want live GPT-powered answers

### Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Select **Try WF Assist** in the demo page or use the floating WF button in the lower-right corner.

> `localhost` works only on the same computer where the command is running. An Arena sandbox URL is not a public website deployment.

### Enable live AI answers locally

**macOS/Linux**

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_MODEL="gpt-4.1-mini"
npm run dev
```

**Windows PowerShell**

```powershell
$env:OPENAI_API_KEY="your_key_here"
$env:OPENAI_MODEL="gpt-4.1-mini"
npm run dev
```

`OPENAI_MODEL` is optional; it defaults to `gpt-4.1-mini`. Use a model available to your OpenAI account. Never put an API key in the WordPress page, widget script tag, Git repository, or browser code.

## Add WF Assist to wingsforever.pro

A real GPT-level widget needs a secure server because its AI key must remain private. Deploy this small Node app to a host that supports environment variables (for example, a managed Node host or a server you control), then add this **single script tag** once to the site footer.

```html
<script
  src="https://assist.your-domain.com/wf-assist-widget.js"
  data-wf-api="https://assist.your-domain.com/api/wf-assist"
  data-wf-lead-api="https://assist.your-domain.com/api/wf-lead"
  data-wf-title="WF Assist"
  data-wf-site-url="https://wingsforever.pro/"
></script>
```

### WordPress installation

1. Deploy this app first and set its production environment variables (below).
2. In WordPress, add the script tag **once** using the theme’s footer-code field, a trusted header/footer injection plugin, or an Elementor/WordPress custom-code location set to **Footer**.
3. Replace `https://assist.your-domain.com` with the deployed assistant domain.
4. Clear any page/cache/CDN cache and test on desktop and mobile.
5. In the deployed app, set `ALLOWED_ORIGINS` to your real website origins. Do not use a wildcard in production.

Do not paste `wf-assist-widget.js` into a page editor that strips `<script>` tags. The JavaScript file must be served from a trusted HTTPS domain.

## Production environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for live AI | Secret server-side key used to call the Responses API. Without it, the safe portfolio-guide fallback runs. |
| `OPENAI_MODEL` | No | AI model name. Defaults to `gpt-4.1-mini`; set this to a model enabled on your account. |
| `ALLOWED_ORIGINS` | Yes in production | Comma-separated origins allowed to call the API, e.g. `https://wingsforever.pro,https://www.wingsforever.pro`. |
| `LEAD_WEBHOOK_URL` | Yes for automatic lead delivery | HTTPS webhook for your CRM, Zapier/Make scenario, ticket tool, or secure server endpoint. Without it, WF Assist transparently asks visitors to email instead of falsely claiming an enquiry was sent. |
| `PORT` | No | Server port; defaults to `5173`. |

### Lead webhook contract

When configured, WF Assist `POST`s this JSON to `LEAD_WEBHOOK_URL`:

```json
{
  "name": "Visitor name",
  "company": "Company or personal",
  "email": "visitor@example.com",
  "country": "Country or time zone",
  "project": "Project description",
  "timeline": "Preferred timing",
  "source": "WF Assist website widget",
  "receivedAt": "ISO-8601 timestamp"
}
```

Use a secure endpoint that validates the request, protects lead data, and complies with the privacy requirements that apply to the website. The included server checks the basic form shape and forwards it; it does not store leads itself.

## How answers are kept on-brand

`server.mjs` contains a deliberately bounded system instruction and a verified portfolio context based on the public Wings Forever site, including:

- Freelance visual/motion design positioning and remote collaboration
- Motion Design Lab, Visual Design Archive, Wings Projects, and Wings Blogs
- Relevant creative capabilities and workflow tools
- Selected projects such as **Through the Eyes of Football**, **The Dream Pursuit**, **Global Race**, **Gone Wild**, and **Kinsmen Second Class**
- Public portfolio and contact links

Update `portfolioContext` in `server.mjs` whenever portfolio pages, services, contact details, availability, or policies change. This is essential—AI answers are only as current as their approved source material.

## Project structure

- `wf-assist-widget.js` — self-contained Shadow DOM widget; this is the file embedded on the website.
- `server.mjs` — static server, protected AI endpoint, rate limiting, CORS allow-list, portfolio instructions, and optional lead webhook.
- `index.html` / `styles.css` — local preview page for testing the widget.

## Verify the code

```bash
npm run check
```

## Before going live

- Set the API key and allowed origins only in the host’s secret/environment-variable settings.
- Use HTTPS for the widget and API. Microphone access generally requires it in production.
- Verify every service description, project reference, link, and public contact detail.
- Test the voice experience in Chrome and Edge; browser speech recognition varies by device and browser.
- Test the enquiry webhook end-to-end, including failed delivery and privacy notices.
- Add a link to the site privacy policy near the widget if visitor details will be collected.
- Monitor usage and costs, and maintain a human follow-up process for project enquiries.
