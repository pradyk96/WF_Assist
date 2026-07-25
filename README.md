# WF Telecom Voice Assist

A polished browser-based voice and chat operator interface for **WF Telecom**. It is a functional first version built from the operator behaviour and services knowledge base supplied in this project.

## Included in this version

- Voice input through the browser's Web Speech Recognition API where supported
- Spoken operator answers through the browser's Speech Synthesis API
- Chat alternative for every voice interaction
- First-line support flows for call quality, SIP registration, and general billing
- Plain-language answers for VoIP, SIP trunking, DID numbers, international calling, wholesale voice, SMS, Cloud PBX, routing, porting, ASR/ACD/PDD, CLI, fraud protection, and API integration
- Escalation wording for legal issues, payment disputes, confirmed outage reports, managers, and account-sensitive questions
- Conversational lead qualification for service enquiries and a human-support form
- In-session conversation context, including a short proposal qualification flow
- Responsive and accessible user interface with keyboard focus states and reduced-motion support

## Run it locally

This app has no runtime framework dependencies. It uses Vite only as a local development server.

```bash
npm install
npm run dev
```

Then open the local address Vite displays (normally `http://localhost:5173`).

Alternatively, the static files can be served by any web server:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Voice support

Voice input depends on the device and browser. Current Chromium-based browsers normally support it; support differs across Safari and Firefox versions. The app detects unavailable voice recognition and keeps the full chat experience available. Microphone access is requested only after the visitor presses **Speak to WF**.

Voice responses use the voice installed in the visitor's browser/device, so the exact voice cannot be guaranteed by this front end.

## Important production integration notes

This is deliberately a **front-end MVP**. It never sends a lead or account data to a third party, and it does not access telecom systems. The support form stores a draft only for the current browser session and clearly tells the visitor that it has not been submitted.

Before launch, connect it to secure server-side services for:

1. **AI responses:** replace or extend `AssistantEngine.reply()` in `app.js` with a server-side endpoint. Keep API keys off the browser and apply the WF escalation and privacy rules at the server layer.
2. **Lead submission:** replace the `sessionStorage` logic in the `leadForm` submit handler with an authenticated CRM, ticketing, or secure email endpoint. Add consent text, retention rules, and abuse protection appropriate to the operating countries.
3. **Live account/network support:** require authenticated, verified users before exposing account, invoice, provisioning, or outage information. Do not expose internal topology, routes, credentials, or other customers' data.
4. **Knowledge accuracy:** connect plans, rates, coverage, porting rules, and service status to approved live data. The assistant is intentionally written not to guess these details.
5. **Observability:** log only privacy-approved operational events, monitor handoffs, and have a human escalation path with defined response targets.

## Project files

- `index.html` — accessible page structure and dialogs
- `styles.css` — responsive visual system and voice-state animation
- `app.js` — voice controls, chat UI, telecom conversation logic, safety rules, and session context

## Verify JavaScript syntax

```bash
npm run check
```
