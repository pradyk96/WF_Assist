/* WF Assist — embeddable voice and chat widget for wingsforever.pro
 *
 * Add this file to a trusted host and include it once per page:
 * <script src="https://assist.example.com/wf-assist-widget.js"
 *   data-wf-api="https://assist.example.com/api/wf-assist"
 *   data-wf-lead-api="https://assist.example.com/api/wf-lead"></script>
 */
(() => {
  "use strict";

  if (window.__wfAssistLoaded) return;
  window.__wfAssistLoaded = true;

  const currentScript = document.currentScript || [...document.scripts].find((script) => script.src.includes("wf-assist-widget"));
  const scriptUrl = currentScript?.src ? new URL(currentScript.src, window.location.href) : new URL(window.location.href);
  const localApi = new URL("/api/wf-assist", scriptUrl.origin).href;
  const localLeadApi = new URL("/api/wf-lead", scriptUrl.origin).href;
  const config = {
    api: currentScript?.dataset.wfApi || localApi,
    leadApi: currentScript?.dataset.wfLeadApi || localLeadApi,
    title: currentScript?.dataset.wfTitle || "WF Assist",
    siteUrl: currentScript?.dataset.wfSiteUrl || "https://wingsforever.pro/",
    autoSpeak: currentScript?.dataset.wfAutoSpeak !== "false",
  };

  const text = {
    greeting: "Hello — I’m WF Assist. I can help you explore Pratyaksh Kumar’s motion design and visual design work, understand creative services, or start a project enquiry. What are you looking to create?",
    unavailable: "I’m having trouble connecting right now. I can still help you explore the portfolio or you can contact Pratyaksh directly at pratyakshkumar095@gmail.com.",
    voiceUnavailable: "Voice input is not available in this browser. You can still type your question below.",
  };

  const host = document.createElement("div");
  host.id = "wf-assist-root";
  host.setAttribute("aria-live", "polite");
  const root = host.attachShadow({ mode: "open" });
  document.body.append(host);

  root.innerHTML = `
    <style>
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      button, textarea { font: inherit; }
      button { cursor: pointer; }
      button:focus-visible, textarea:focus-visible { outline: 2px solid #96ffec; outline-offset: 3px; }
      .wf-wrap { --wf-ink: #f0f7fc; --wf-muted: #93a6bb; --wf-line: rgba(177,211,238,.17); --wf-teal: #67e5cf; --wf-teal-bright: #9bfff1; --wf-panel: #0b1a2d; --wf-deep: #06111f; position: fixed; z-index: 2147483000; right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--wf-ink); }
      .wf-launcher { width: 62px; height: 62px; display: grid; place-items: center; padding: 0; color: #03272a; background: linear-gradient(145deg, #a2ffef, #4cd5c2); border: 1px solid rgba(208,255,248,.85); border-radius: 50%; box-shadow: 0 16px 38px rgba(0,0,0,.38), 0 0 0 7px rgba(102,229,207,.1); transition: transform .2s ease, box-shadow .2s ease; }
      .wf-launcher:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 19px 42px rgba(0,0,0,.44), 0 0 0 10px rgba(102,229,207,.13); }
      .wf-launcher svg { width: 30px; height: 30px; fill: currentColor; }
      .wf-launcher .wf-close-icon { display: none; }
      .wf-wrap.is-open .wf-launcher { background: #142d47; color: #e9f6ff; border-color: rgba(178,224,250,.28); }
      .wf-wrap.is-open .wf-launcher .wf-orb-icon { display: none; }.wf-wrap.is-open .wf-launcher .wf-close-icon { display: block; }
      .wf-panel { position: absolute; right: 0; bottom: 78px; width: min(390px, calc(100vw - 32px)); height: min(638px, calc(100vh - 112px)); min-height: 485px; display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; visibility: hidden; opacity: 0; transform: translateY(14px) scale(.97); pointer-events: none; border: 1px solid rgba(158,204,239,.25); border-radius: 19px; background: linear-gradient(160deg, #102a46 0%, #09192c 48%, #071525 100%); box-shadow: 0 30px 90px rgba(0,0,0,.52), inset 0 1px 0 rgba(255,255,255,.06); transition: opacity .2s ease, transform .2s ease, visibility .2s; }
      .wf-panel::before { content: ""; position: absolute; z-index: 0; width: 260px; height: 260px; top: -145px; left: -90px; border-radius: 50%; background: rgba(73,222,202,.16); filter: blur(4px); pointer-events: none; }
      .wf-wrap.is-open .wf-panel { visibility: visible; opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .wf-header, .wf-body, .wf-composer-wrap { position: relative; z-index: 1; }
      .wf-header { display: flex; align-items: center; gap: 10px; padding: 17px 17px 15px; border-bottom: 1px solid var(--wf-line); }
      .wf-avatar { position: relative; width: 36px; height: 36px; display: grid; place-items: center; flex: 0 0 auto; overflow: hidden; color: #052c30; background: radial-gradient(circle at 38% 30%, #b7fff4, #57d6c3 63%, #329b9b); border: 1px solid rgba(208,255,248,.7); border-radius: 11px; box-shadow: 0 0 22px rgba(91,233,211,.2); font-size: 10px; font-weight: 900; letter-spacing: .04em; }
      .wf-avatar::after { content: ""; position: absolute; width: 18px; height: 5px; bottom: 7px; border-radius: 50%; background: rgba(4,69,75,.22); }
      .wf-heading { min-width: 0; flex: 1; }.wf-heading strong { display: block; color: #f3f8fc; font-size: 14px; letter-spacing: -.02em; }.wf-heading span { display: flex; align-items: center; gap: 5px; margin-top: 2px; color: #9fb3c9; font-size: 10px; }.wf-live-dot { width: 6px; height: 6px; display: inline-block; border-radius: 50%; background: var(--wf-teal); box-shadow: 0 0 0 3px rgba(103,229,207,.1); }
      .wf-icon-button { width: 32px; height: 32px; display: grid; place-items: center; padding: 0; color: #a9bdd1; background: transparent; border: 1px solid transparent; border-radius: 8px; }.wf-icon-button:hover { color: var(--wf-teal-bright); background: rgba(137,209,245,.08); border-color: rgba(147,212,246,.15); }.wf-icon-button svg { width: 17px; height: 17px; fill: currentColor; }.wf-speaker-off { display: none; }.wf-icon-button.is-muted .wf-speaker-on { display: none; }.wf-icon-button.is-muted .wf-speaker-off { display: block; }
      .wf-body { min-height: 0; display: flex; flex-direction: column; }.wf-messages { flex: 1; display: flex; flex-direction: column; gap: 15px; min-height: 0; padding: 19px 16px 10px; overflow-y: auto; scrollbar-color: #34516d transparent; scrollbar-width: thin; }.wf-message { display: flex; align-items: flex-end; gap: 8px; max-width: 91%; }.wf-message.user { align-self: flex-end; flex-direction: row-reverse; }.wf-message .wf-mini-avatar { width: 23px; height: 23px; display: grid; place-items: center; flex: 0 0 auto; color: #06383a; background: var(--wf-teal); border-radius: 7px; font-size: 7px; font-weight: 900; }.wf-message.user .wf-mini-avatar { color: #dfeafa; background: #34516f; }.wf-bubble { padding: 10px 12px; border: 1px solid rgba(169,208,241,.11); border-radius: 4px 13px 13px 13px; background: rgba(23,50,77,.82); box-shadow: 0 3px 12px rgba(0,0,0,.06); }.wf-message.user .wf-bubble { border-radius: 13px 4px 13px 13px; background: rgba(57,78,122,.7); }.wf-bubble p { margin: 0; color: #e2edf7; font-size: 12px; line-height: 1.58; white-space: pre-wrap; word-break: break-word; }.wf-bubble a { color: var(--wf-teal-bright); }.wf-message time { display: block; margin-top: 5px; color: #7189a4; font-size: 9px; }.wf-typing { display: flex; align-items: center; gap: 4px; min-height: 15px; }.wf-typing i { display: block; width: 5px; height: 5px; border-radius: 50%; background: var(--wf-teal); animation: wf-bounce .85s ease-in-out infinite; }.wf-typing i:nth-child(2) { animation-delay: .12s; }.wf-typing i:nth-child(3) { animation-delay: .24s; }@keyframes wf-bounce { 0%, 100% { opacity: .25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
      .wf-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 16px 13px; }.wf-suggestion { padding: 7px 9px; color: #b8cbe0; background: rgba(31,59,88,.65); border: 1px solid rgba(160,210,245,.14); border-radius: 999px; font-size: 10px; line-height: 1.2; }.wf-suggestion:hover { color: #d9fff9; border-color: rgba(103,229,207,.48); background: rgba(57,117,125,.25); }
      .wf-composer-wrap { padding: 12px 14px 13px; border-top: 1px solid var(--wf-line); background: rgba(5,16,29,.25); }.wf-voice-status { min-height: 14px; margin: 0 0 7px 3px; color: #86eddd; font-size: 10px; }.wf-voice-status:empty { display: none; }.wf-composer { display: flex; gap: 7px; align-items: flex-end; padding: 6px; border: 1px solid rgba(148,200,238,.2); border-radius: 11px; background: #071525; }.wf-composer:focus-within { border-color: rgba(113,239,221,.68); box-shadow: 0 0 0 3px rgba(103,229,207,.06); }.wf-input { width: 100%; max-height: 90px; min-height: 28px; padding: 7px 3px 5px 6px; resize: none; color: #edf5fb; background: transparent; border: 0; outline: 0; font-size: 12px; line-height: 1.4; }.wf-input::placeholder { color: #7087a0; }.wf-mic, .wf-send { width: 30px; height: 30px; display: grid; place-items: center; flex: 0 0 auto; padding: 0; border-radius: 7px; }.wf-mic { color: #afc4d9; background: transparent; border: 1px solid transparent; }.wf-mic:hover, .wf-mic.is-listening { color: #aaffef; background: rgba(89,223,203,.12); border-color: rgba(103,229,207,.3); }.wf-mic svg, .wf-send svg { width: 16px; height: 16px; fill: currentColor; }.wf-send { color: #033638; background: var(--wf-teal); border: 1px solid var(--wf-teal-bright); }.wf-send:hover { background: var(--wf-teal-bright); }.wf-note { margin: 8px 3px 0; color: #70849d; font-size: 9px; line-height: 1.45; }.wf-note a { color: #9eb6d0; }.wf-note a:hover { color: var(--wf-teal-bright); }
      @media (max-width: 480px) { .wf-wrap { right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); }.wf-panel { right: -1px; bottom: 75px; width: calc(100vw - 28px); height: min(620px, calc(100vh - 102px)); }.wf-launcher { width: 57px; height: 57px; }.wf-header { padding: 14px; }.wf-messages { padding: 16px 13px 8px; }.wf-suggestions { padding-left: 13px; padding-right: 13px; }.wf-composer-wrap { padding: 10px 12px 11px; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; } }
    </style>
    <section class="wf-wrap" aria-label="${escapeHtml(config.title)} portfolio assistant">
      <section class="wf-panel" aria-label="${escapeHtml(config.title)} chat" aria-hidden="true">
        <header class="wf-header">
          <div class="wf-avatar" aria-hidden="true">WF</div>
          <div class="wf-heading"><strong>${escapeHtml(config.title)}</strong><span><i class="wf-live-dot"></i> Portfolio &amp; voice assistant</span></div>
          <button class="wf-icon-button wf-speaker" type="button" aria-label="Turn voice replies off" aria-pressed="true" title="Voice replies">
            <svg class="wf-speaker-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.4 3a4.4 4.4 0 0 0-2.2-3.8v7.6a4.4 4.4 0 0 0 2.2-3.8Zm0-8.5v2.1a7 7 0 0 1 0 12.8v2.1a9 9 0 0 0 0-17.9Z" /></svg>
            <svg class="wf-speaker-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm15.7 1.3-1.4-1.4-2.3 2.3-2.3-2.3-1.4 1.4 2.3 2.3-2.3 2.3 1.4 1.4 2.3-2.3 2.3 2.3 1.4-1.4-2.3-2.3 2.3-2.3Z" /></svg>
          </button>
          <button class="wf-icon-button wf-reset" type="button" aria-label="Start a new conversation" title="New conversation">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2.2 5.5h-2.1A6 6 0 1 1 18.5 8H15v2h7V3h-2v3.5A8 8 0 0 0 20 11Z" /></svg>
          </button>
        </header>
        <div class="wf-body">
          <div class="wf-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
          <div class="wf-suggestions" aria-label="Suggested questions">
            <button class="wf-suggestion" type="button" data-prompt="What services does WF offer?">Services</button>
            <button class="wf-suggestion" type="button" data-prompt="Which motion design projects should I explore?">Explore projects</button>
            <button class="wf-suggestion" type="button" data-prompt="What tools and workflows does WF use?">Tools &amp; workflow</button>
            <button class="wf-suggestion" type="button" data-action="lead">Start a project</button>
          </div>
        </div>
        <div class="wf-composer-wrap">
          <p class="wf-voice-status" role="status"></p>
          <form class="wf-composer">
            <textarea class="wf-input" rows="1" maxlength="1600" aria-label="Message WF Assist" placeholder="Ask about the portfolio or a new project…"></textarea>
            <button class="wf-mic" type="button" aria-label="Speak to WF Assist" title="Speak to WF Assist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21H8v2h8v-2h-3v-3.1A7 7 0 0 0 19 11h-2Z" /></svg></button>
            <button class="wf-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 3-7 8-2-8-2-3-7Z" /></svg></button>
          </form>
          <p class="wf-note">Voice is browser-based. Please do not share passwords or payment details. <a href="${escapeAttribute(config.siteUrl)}" target="_blank" rel="noopener">Visit portfolio ↗</a></p>
        </div>
      </section>
      <button class="wf-launcher" type="button" aria-label="Open ${escapeHtml(config.title)}" aria-expanded="false">
        <svg class="wf-orb-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5a12.5 12.5 0 1 0 0 25 12.5 12.5 0 0 0 0-25Zm0 2.5a10 10 0 0 1 8.8 14.7l-3.1-3.1a5.6 5.6 0 0 0-2.1-6.2 5.5 5.5 0 0 0-8.8 4.4c0 .7.1 1.4.4 2L7.6 21.4A10 10 0 0 1 16 6Zm0 7.1a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4Zm0 12.4c-2.3 0-4.4-.8-6-2.2l3.1-3.1a5.5 5.5 0 0 0 7.3 0l3.1 3.1a9.9 9.9 0 0 1-7.5 2.2Z" /></svg>
        <svg class="wf-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z" /></svg>
      </button>
    </section>
  `;

  const ui = {
    wrap: root.querySelector(".wf-wrap"),
    panel: root.querySelector(".wf-panel"),
    launcher: root.querySelector(".wf-launcher"),
    messages: root.querySelector(".wf-messages"),
    form: root.querySelector(".wf-composer"),
    input: root.querySelector(".wf-input"),
    mic: root.querySelector(".wf-mic"),
    speaker: root.querySelector(".wf-speaker"),
    reset: root.querySelector(".wf-reset"),
    status: root.querySelector(".wf-voice-status"),
  };

  const state = {
    conversation: [],
    isOpen: false,
    isListening: false,
    voiceReplies: config.autoSpeak && "speechSynthesis" in window,
    recognition: null,
    lead: null,
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
  }

  function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }

  function timestamp() {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
  }

  function addMessage(content, role = "assistant", options = {}) {
    const message = document.createElement("article");
    message.className = `wf-message ${role}${options.typing ? " wf-message-typing" : ""}`;
    const avatar = document.createElement("span");
    avatar.className = "wf-mini-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = role === "assistant" ? "WF" : "YOU";
    const bubble = document.createElement("div");
    bubble.className = "wf-bubble";
    const paragraph = document.createElement("p");
    if (options.typing) {
      paragraph.className = "wf-typing";
      paragraph.innerHTML = "<i></i><i></i><i></i>";
    } else {
      paragraph.textContent = content;
    }
    const time = document.createElement("time");
    time.textContent = timestamp();
    bubble.append(paragraph, time);
    message.append(avatar, bubble);
    ui.messages.append(message);
    ui.messages.scrollTop = ui.messages.scrollHeight;
    if (role === "assistant" && options.speak) speak(content);
    return message;
  }

  function showStatus(value = "") { ui.status.textContent = value; }

  function openWidget(focusInput = true) {
    state.isOpen = true;
    ui.wrap.classList.add("is-open");
    ui.panel.setAttribute("aria-hidden", "false");
    ui.launcher.setAttribute("aria-expanded", "true");
    ui.launcher.setAttribute("aria-label", "Close WF Assist");
    if (!state.conversation.length) {
      addMessage(text.greeting, "assistant", { speak: false });
      state.conversation.push({ role: "assistant", content: text.greeting });
    }
    if (focusInput) window.setTimeout(() => ui.input.focus(), 150);
  }

  function closeWidget() {
    state.isOpen = false;
    state.isListening && state.recognition?.abort();
    ui.wrap.classList.remove("is-open");
    ui.panel.setAttribute("aria-hidden", "true");
    ui.launcher.setAttribute("aria-expanded", "false");
    ui.launcher.setAttribute("aria-label", "Open WF Assist");
    showStatus("");
  }

  function toggleWidget() { state.isOpen ? closeWidget() : openWidget(); }

  function autoGrow() {
    ui.input.style.height = "auto";
    ui.input.style.height = `${Math.min(ui.input.scrollHeight, 90)}px`;
  }

  function plainFallback(question) {
    const query = question.toLowerCase();
    if (/(price|cost|rate|quote|budget)/.test(query)) return "WF prepares quotes around the needs of each brief rather than using a published one-size-fits-all price. If you tell me what you need designed and your preferred timeline, I can start a project enquiry.";
    if (/(service|hire|work with|collaborat)/.test(query)) return "WF offers motion design, graphic design, illustrations, cinematic title visuals, experimental 3D concepts, and tailored visual direction for remote collaborations. What type of visual story or asset do you need?";
    if (/(motion|animation|after effects|blender|3d)/.test(query)) return "For motion work, explore Through the Eyes of Football, The Dream Pursuit, and the Motion Design Lab. WF’s portfolio also documents experimentation with After Effects, Blender, title design, and 3D concepts. Would you like a recommendation for a specific style?";
    if (/(poster|graphic|photoshop|illustration|visual design)/.test(query)) return "The Visual Design Archive is a good place to start for graphic work. Global Race is a Photoshop film-poster concept, and Gone Wild includes a process-focused Photoshop breakdown. Are you looking for poster design, illustration, or a broader campaign visual?";
    if (/(contact|email|talk|reach)/.test(query)) return "You can contact Pratyaksh Kumar at pratyakshkumar095@gmail.com. Include your project goal, the assets you need, any references, and an approximate timeline for the clearest next step. Would you like me to help outline your brief?";
    if (/(project|portfolio|work)/.test(query)) return "The portfolio is arranged around Wings Projects, Motion Design Lab, and the Visual Design Archive. Try Through the Eyes of Football for motion storytelling, The Dream Pursuit for trailer work, or Global Race for poster design. What kind of work interests you most?";
    return "I can help you discover the WF portfolio, explain motion and visual design services, or shape a new project brief. What would you like to know?";
  }

  function startLead() {
    state.lead = { step: 0, values: {} };
    const prompt = "Great — I can help prepare a concise project enquiry. What is your name?";
    addMessage(prompt, "assistant", { speak: state.voiceReplies });
    state.conversation.push({ role: "assistant", content: prompt });
  }

  async function handleLeadAnswer(answer) {
    const fields = [
      { key: "name", prompt: "Thanks. What company or organisation are you representing? You can say independent or personal if that fits." },
      { key: "company", prompt: "What work email should WF use to reply?" },
      { key: "email", prompt: "Which country or time zone are you working from?" },
      { key: "country", prompt: "Please describe what you want to create. Include the project type, desired outcome, and any useful reference or format." },
      { key: "project", prompt: "Finally, is there a preferred timeline or milestone? An estimate is fine." },
      { key: "timeline", prompt: "" },
    ];
    const field = fields[state.lead.step];
    if (field.key === "email" && !/^\S+@\S+\.\S+$/.test(answer)) {
      const retry = "Could you enter a valid email address so the WF team has a way to reply?";
      addMessage(retry, "assistant", { speak: state.voiceReplies });
      state.conversation.push({ role: "assistant", content: retry });
      return;
    }
    state.lead.values[field.key] = answer.trim();
    state.lead.step += 1;
    const next = fields[state.lead.step];
    if (next) {
      addMessage(next.prompt, "assistant", { speak: state.voiceReplies });
      state.conversation.push({ role: "assistant", content: next.prompt });
      return;
    }

    const lead = state.lead.values;
    state.lead = null;
    try {
      const response = await fetch(config.leadApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The enquiry could not be sent.");
      if (result.submitted) {
        const confirmation = "Thank you — your project enquiry has been sent to WF. The team will review the details and reply through the email you provided.";
        addMessage(confirmation, "assistant", { speak: state.voiceReplies });
        state.conversation.push({ role: "assistant", content: confirmation });
      } else {
        const handoff = "Thank you — I have the project details in this chat, but direct form delivery is not configured yet. Please email pratyakshkumar095@gmail.com with the same details so WF can respond.";
        addMessage(handoff, "assistant", { speak: state.voiceReplies });
        state.conversation.push({ role: "assistant", content: handoff });
      }
    } catch (error) {
      const handoff = `Thank you. I could not submit the enquiry automatically, so please email pratyakshkumar095@gmail.com directly. ${error.message}`;
      addMessage(handoff, "assistant", { speak: state.voiceReplies });
      state.conversation.push({ role: "assistant", content: handoff });
    }
  }

  async function askAssistant(rawMessage, voice = false) {
    const message = rawMessage.trim();
    if (!message) return;
    if (!state.isOpen) openWidget(false);
    ui.input.value = "";
    autoGrow();
    addMessage(message, "user");
    state.conversation.push({ role: "user", content: message });

    if (state.lead) {
      await handleLeadAnswer(message);
      return;
    }
    if (/^(start|begin).*(project|brief|enquir)|^(i want|i'd like|i would like) to (hire|work with|start)/i.test(message)) {
      startLead();
      return;
    }

    const typing = addMessage("", "assistant", { typing: true });
    try {
      const response = await fetch(config.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: state.conversation.slice(-12), voice }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || text.unavailable);
      typing.remove();
      const reply = String(result.reply || plainFallback(message)).trim();
      addMessage(reply, "assistant", { speak: voice || state.voiceReplies });
      state.conversation.push({ role: "assistant", content: reply });
    } catch (error) {
      typing.remove();
      const reply = plainFallback(message);
      addMessage(reply, "assistant", { speak: voice || state.voiceReplies });
      state.conversation.push({ role: "assistant", content: reply });
      console.warn("WF Assist API unavailable:", error.message);
    }
  }

  function setVoiceReplies(enabled) {
    state.voiceReplies = enabled && "speechSynthesis" in window;
    ui.speaker.classList.toggle("is-muted", !state.voiceReplies);
    ui.speaker.setAttribute("aria-pressed", String(state.voiceReplies));
    ui.speaker.setAttribute("aria-label", state.voiceReplies ? "Turn voice replies off" : "Turn voice replies on");
    if (!state.voiceReplies) window.speechSynthesis?.cancel();
  }

  function speak(value) {
    if (!state.voiceReplies || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = document.documentElement.lang || "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => { if (!state.isListening) showStatus("WF Assist is speaking…"); };
    utterance.onend = () => { if (!state.isListening) showStatus(""); };
    utterance.onerror = () => { if (!state.isListening) showStatus(""); };
    window.speechSynthesis.speak(utterance);
  }

  function recognitionSupported() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }

  function getRecognition() {
    if (state.recognition) return state.recognition;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.lang = document.documentElement.lang || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    let finalTranscript = "";
    recognition.onstart = () => {
      finalTranscript = "";
      state.isListening = true;
      ui.mic.classList.add("is-listening");
      ui.mic.setAttribute("aria-label", "Stop listening");
      showStatus("Listening…");
      window.speechSynthesis?.cancel();
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) finalTranscript += event.results[index][0].transcript;
        else interim += event.results[index][0].transcript;
      }
      showStatus(finalTranscript || interim || "Listening…");
    };
    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone permission was not granted. You can type instead.",
        "service-not-allowed": "Voice input is currently unavailable. You can type instead.",
        "audio-capture": "No microphone was found. Check your device settings and try again.",
        "no-speech": "I didn’t hear anything. Please try again.",
      };
      if (event.error !== "aborted") showStatus(messages[event.error] || "Voice input had a problem. Please try again.");
    };
    recognition.onend = () => {
      state.isListening = false;
      ui.mic.classList.remove("is-listening");
      ui.mic.setAttribute("aria-label", "Speak to WF Assist");
      if (finalTranscript.trim()) {
        showStatus("Thinking…");
        askAssistant(finalTranscript, true);
      } else if (ui.status.textContent === "Listening…") showStatus("");
    };
    state.recognition = recognition;
    return recognition;
  }

  function toggleListening() {
    if (!recognitionSupported()) {
      showStatus(text.voiceUnavailable);
      addMessage(text.voiceUnavailable, "assistant", { speak: false });
      return;
    }
    const recognition = getRecognition();
    if (state.isListening) {
      recognition.stop();
      return;
    }
    try { recognition.start(); } catch { showStatus("Voice input is preparing. Please try again in a moment."); }
  }

  function resetConversation() {
    window.speechSynthesis?.cancel();
    state.recognition?.abort();
    state.conversation = [];
    state.lead = null;
    ui.messages.replaceChildren();
    showStatus("");
    addMessage(text.greeting, "assistant", { speak: false });
    state.conversation.push({ role: "assistant", content: text.greeting });
    ui.input.focus();
  }

  ui.launcher.addEventListener("click", toggleWidget);
  ui.form.addEventListener("submit", (event) => { event.preventDefault(); askAssistant(ui.input.value); });
  ui.input.addEventListener("input", autoGrow);
  ui.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askAssistant(ui.input.value); }
  });
  ui.mic.addEventListener("click", toggleListening);
  ui.speaker.addEventListener("click", () => setVoiceReplies(!state.voiceReplies));
  ui.reset.addEventListener("click", resetConversation);
  root.querySelectorAll(".wf-suggestion").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.action === "lead") { openWidget(false); startLead(); }
    else askAssistant(button.dataset.prompt);
  }));

  setVoiceReplies(state.voiceReplies);
  window.WFAssist = Object.freeze({
    open: () => openWidget(),
    close: closeWidget,
    ask: (message) => askAssistant(String(message)),
    reset: resetConversation,
  });
})();
