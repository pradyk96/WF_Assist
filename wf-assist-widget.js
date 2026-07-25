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
      button:focus-visible, textarea:focus-visible { outline: 2px solid #9ffff1; outline-offset: 3px; }
      .wf-wrap { --wf-ink:#f3f8ff; --wf-muted:#93a8bd; --wf-line:rgba(181,216,244,.15); --wf-teal:#62e6d0; --wf-bright:#a9fff1; --wf-violet:#a798ff; --wf-deep:#06111f; --pointer-x:0px; --pointer-y:0px; position:fixed; z-index:2147483000; right:max(21px, env(safe-area-inset-right)); bottom:max(21px, env(safe-area-inset-bottom)); color:var(--wf-ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .wf-launcher { position:relative; width:64px; height:64px; display:grid; place-items:center; padding:0; color:#022b2d; border:1px solid rgba(218,255,249,.9); border-radius:50%; background:radial-gradient(circle at 35% 27%, #d2fff8, #70ead6 37%, #2eb4b0 100%); box-shadow:0 16px 45px rgba(0,0,0,.42), 0 0 0 7px rgba(90,226,206,.1), inset 0 1px 1px rgba(255,255,255,.8); transition:transform .55s cubic-bezier(.2,.9,.25,1.45), box-shadow .4s ease, opacity .2s ease; }
      .wf-launcher::before { position:absolute; inset:5px; content:""; border:1px solid rgba(5,96,98,.32); border-radius:50%; }.wf-launcher:hover { transform:translateY(-5px) rotate(-8deg) scale(1.05); box-shadow:0 22px 55px rgba(0,0,0,.48), 0 0 0 11px rgba(90,226,206,.12), inset 0 1px 1px rgba(255,255,255,.8); }.wf-launcher svg { width:31px; height:31px; fill:currentColor; }.wf-close-icon { display:none; }.wf-launcher .wf-launch-pulse { position:absolute; width:7px; height:7px; right:8px; top:8px; border:1px solid #d5fff8; border-radius:50%; background:#11ba9f; box-shadow:0 0 0 3px rgba(5,76,74,.25); }
      .wf-wrap.is-open .wf-launcher { visibility:hidden; opacity:0; transform:scale(.7); pointer-events:none; }
      .wf-panel { position:absolute; right:0; bottom:0; width:min(1120px, calc(100vw - 46px)); height:min(710px, calc(100vh - 46px)); min-height:548px; display:grid; grid-template-rows:auto minmax(0,1fr); overflow:hidden; visibility:hidden; opacity:0; transform:translateY(22px) scale(.965); pointer-events:none; border:1px solid rgba(177,218,249,.23); border-radius:25px; background:linear-gradient(145deg, #0e2741 0%, #071629 53%, #091526 100%); box-shadow:0 32px 110px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,255,255,.07); transition:visibility .25s, opacity .32s ease, transform .68s cubic-bezier(.19,.95,.27,1.25); }
      .wf-panel::before { position:absolute; z-index:0; inset:0; content:""; pointer-events:none; opacity:.55; background:radial-gradient(circle at 15% 15%, rgba(84,225,207,.14), transparent 31%), radial-gradient(circle at 88% 86%, rgba(127,91,242,.13), transparent 30%); }.wf-panel::after { position:absolute; z-index:0; inset:0; content:""; pointer-events:none; opacity:.24; background-image:linear-gradient(rgba(175,232,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(175,232,255,.05) 1px, transparent 1px); background-size:35px 35px; mask-image:linear-gradient(135deg, black, transparent 60%); }
      .wf-wrap.is-open .wf-panel { visibility:visible; opacity:1; transform:translateY(0) scale(1); pointer-events:auto; }
      .wf-header, .wf-workspace { position:relative; z-index:1; }.wf-header { display:flex; align-items:center; gap:11px; min-height:76px; padding:14px 20px; border-bottom:1px solid var(--wf-line); background:rgba(7,22,38,.36); backdrop-filter:blur(16px); }.wf-avatar { position:relative; width:42px; height:42px; display:grid; place-items:center; overflow:hidden; flex:0 0 auto; color:#042d31; border:1px solid rgba(207,255,246,.76); border-radius:13px; background:radial-gradient(circle at 36% 29%, #d0fff6, #63dbc8 53%, #297c87); box-shadow:0 0 26px rgba(80,229,209,.2); font-size:10px; font-weight:900; letter-spacing:.07em; }.wf-avatar::before { position:absolute; inset:5px; content:""; border:1px solid rgba(1,71,77,.3); border-radius:9px; }.wf-heading { flex:1; min-width:0; }.wf-heading strong { display:block; color:#f4f8ff; font-size:14px; letter-spacing:-.025em; }.wf-heading span { display:flex; align-items:center; gap:6px; margin-top:3px; color:#96adc4; font-size:10px; }.wf-live-dot { width:6px; height:6px; display:inline-block; border-radius:50%; background:var(--wf-teal); box-shadow:0 0 0 4px rgba(98,230,208,.1), 0 0 12px rgba(98,230,208,.7); animation:wf-live 1.8s ease-in-out infinite; }@keyframes wf-live { 50% { transform:scale(.65); box-shadow:0 0 0 7px rgba(98,230,208,0); } }
      .wf-icon-button { width:34px; height:34px; display:grid; place-items:center; padding:0; color:#a8bdd0; border:1px solid rgba(164,212,246,.1); border-radius:9px; background:rgba(29,55,80,.2); transition:color .25s ease, border-color .25s ease, background .25s ease, transform .35s cubic-bezier(.2,.9,.25,1.4); }.wf-icon-button:hover { color:var(--wf-bright); border-color:rgba(112,236,218,.45); background:rgba(69,176,168,.12); transform:translateY(-2px); }.wf-icon-button svg { width:17px; height:17px; fill:currentColor; }.wf-speaker-off { display:none; }.wf-icon-button.is-muted .wf-speaker-on { display:none; }.wf-icon-button.is-muted .wf-speaker-off { display:block; }
      .wf-workspace { min-height:0; display:grid; grid-template-columns:minmax(360px,.94fr) minmax(380px,1.06fr); }.wf-stage { position:relative; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr) auto; overflow:hidden; isolation:isolate; padding:21px 23px 20px; border-right:1px solid var(--wf-line); background:linear-gradient(145deg, rgba(18,51,76,.7), rgba(5,19,34,.74)); }.wf-stage::before { position:absolute; z-index:-2; inset:0; content:""; background:radial-gradient(circle at 50% 43%, rgba(68,222,202,.21), transparent 19%), radial-gradient(circle at 28% 80%, rgba(141,106,253,.14), transparent 35%); transition:background .35s ease-out; }.wf-stage::after { position:absolute; z-index:-1; inset:0; content:""; opacity:.27; pointer-events:none; background-image:radial-gradient(rgba(164,245,239,.7) .65px, transparent .9px); background-size:22px 22px; mask-image:radial-gradient(circle at center, black, transparent 72%); }
      .wf-stage-top, .wf-stage-bottom { display:flex; align-items:center; justify-content:space-between; gap:11px; }.wf-stage-label { margin:0; color:var(--wf-teal); font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:9px; font-weight:700; letter-spacing:.16em; }.wf-stage-latency { display:flex; align-items:center; gap:6px; color:#9db2c6; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:9px; }.wf-stage-latency i { width:5px; height:5px; display:block; border-radius:50%; background:#76f5df; box-shadow:0 0 10px #76f5df; }
      .wf-visual-field { position:relative; display:grid; place-items:center; min-height:305px; }.wf-orbit { position:absolute; width:244px; height:244px; border:1px solid rgba(143,251,236,.17); border-radius:50%; transform:translate3d(var(--pointer-x), var(--pointer-y), 0); transition:transform .5s cubic-bezier(.22,.9,.2,1.2); }.wf-orbit::after { position:absolute; top:50%; left:-4px; width:7px; height:7px; content:""; border-radius:50%; background:#b5fff5; box-shadow:0 0 12px #58e7d4; }.wf-orbit-one { animation:wf-orbit 14s linear infinite; }.wf-orbit-two { width:337px; height:337px; border-color:rgba(169,145,255,.13); animation:wf-orbit 21s linear infinite reverse; }.wf-orbit-two::after { top:29%; left:auto; right:-3px; background:#c5b8ff; box-shadow:0 0 12px #9d87ff; }.wf-orbit-three { width:425px; height:425px; border-style:dashed; border-color:rgba(120,228,255,.1); animation:wf-orbit 35s linear infinite; }.wf-orbit-three::after { display:none; }@keyframes wf-orbit { to { rotate:360deg; } }
      .wf-core-shadow { position:absolute; width:155px; height:25px; top:calc(50% + 107px); border-radius:50%; background:rgba(19,225,202,.18); filter:blur(13px); transform:translateX(var(--pointer-x)); transition:transform .5s ease; }.wf-core { position:relative; width:158px; height:158px; display:grid; place-items:center; overflow:hidden; border:1px solid rgba(195,255,248,.74); border-radius:47% 53% 51% 49% / 50% 44% 56% 50%; background:radial-gradient(circle at 35% 27%, #e0fff8 0%, #86f1df 18%, #258c9a 51%, #112f57 100%); box-shadow:0 0 0 13px rgba(92,230,209,.06), 0 0 65px rgba(61,230,209,.38), inset 15px 17px 27px rgba(255,255,255,.2), inset -18px -17px 28px rgba(5,22,61,.46); transform:translate3d(var(--pointer-x), var(--pointer-y), 0) rotate(-7deg); transition:transform .6s cubic-bezier(.18,.96,.25,1.35), border-radius .6s ease, box-shadow .5s ease; animation:wf-breathe 5s ease-in-out infinite; }.wf-core::before { position:absolute; width:190px; height:65px; content:""; background:linear-gradient(105deg, transparent 30%, rgba(255,255,255,.75) 47%, transparent 61%); transform:rotate(-39deg) translateY(-52px); animation:wf-sheen 5s ease-in-out infinite; }.wf-core::after { position:absolute; inset:12px; content:""; border:1px solid rgba(227,255,252,.42); border-radius:inherit; }.wf-core-word { position:relative; z-index:1; color:#043b48; text-shadow:0 1px rgba(255,255,255,.38); font-size:26px; font-weight:900; letter-spacing:-.1em; transform:translateX(-2px); }.wf-core-word small { margin-left:3px; font-size:8px; letter-spacing:.08em; vertical-align:middle; }.wf-stage.is-listening .wf-core { border-radius:50%; box-shadow:0 0 0 17px rgba(92,230,209,.1), 0 0 95px rgba(61,230,209,.66), inset 15px 17px 27px rgba(255,255,255,.2), inset -18px -17px 28px rgba(5,22,61,.46); animation:wf-listen .75s ease-in-out infinite alternate; }.wf-stage.is-listening .wf-orbit { border-color:rgba(150,255,241,.5); animation-duration:4s; }.wf-stage.is-speaking .wf-core { border-radius:42% 58% 46% 54% / 55% 42% 58% 45%; animation:wf-speak 1.25s ease-in-out infinite; }.wf-stage.is-speaking .wf-orbit { border-color:rgba(177,157,255,.43); }@keyframes wf-breathe { 0%,100% { scale:.97; } 50% { scale:1.03; } }@keyframes wf-listen { from { scale:.96; } to { scale:1.1; } }@keyframes wf-speak { 0%,100% { scale:1; rotate:-5deg; } 50% { scale:1.075; rotate:4deg; } }@keyframes wf-sheen { 0%, 25% { transform:rotate(-39deg) translateY(-70px); opacity:0; } 48%, 65% { opacity:.85; } 84%,100% { transform:rotate(-39deg) translateY(125px); opacity:0; } }
      .wf-wave { position:absolute; bottom:18px; display:flex; align-items:center; justify-content:center; gap:4px; height:48px; }.wf-wave i { display:block; width:3px; height:8px; border-radius:4px; background:linear-gradient(to top, #2ec9ba, #d2fff8); opacity:.38; }.wf-wave i:nth-child(3n) { height:22px; }.wf-wave i:nth-child(4n) { height:35px; }.wf-wave i:nth-child(5n) { height:16px; }.wf-stage.is-listening .wf-wave i, .wf-stage.is-speaking .wf-wave i { opacity:1; animation:wf-bars .62s ease-in-out infinite alternate; }.wf-stage.is-listening .wf-wave i:nth-child(2n), .wf-stage.is-speaking .wf-wave i:nth-child(2n) { animation-delay:-.31s; }.wf-stage.is-listening .wf-wave i:nth-child(3n), .wf-stage.is-speaking .wf-wave i:nth-child(3n) { animation-delay:-.49s; }@keyframes wf-bars { from { transform:scaleY(.3); } to { transform:scaleY(1.45); } }
      .wf-call-card { display:flex; align-items:center; gap:12px; margin:0 auto; padding:8px 11px 8px 9px; border:1px solid rgba(157,219,241,.15); border-radius:15px; background:rgba(5,19,34,.46); box-shadow:0 12px 32px rgba(0,0,0,.15); backdrop-filter:blur(10px); }.wf-stage-mic { width:42px; height:42px; display:grid; place-items:center; flex:0 0 auto; padding:0; color:#04373a; border:1px solid #b6fff4; border-radius:12px; background:linear-gradient(145deg, #a7fff2, #50d7c5); box-shadow:0 5px 16px rgba(55,219,200,.22); transition:transform .35s cubic-bezier(.2,.9,.25,1.45), box-shadow .3s ease, background .3s ease; }.wf-stage-mic:hover { transform:translateY(-2px) scale(1.05); box-shadow:0 9px 22px rgba(55,219,200,.36); }.wf-stage-mic.is-listening { color:#efffff; background:linear-gradient(145deg, #245879, #173650); box-shadow:0 0 0 5px rgba(103,229,207,.1), 0 8px 25px rgba(62,232,210,.32); }.wf-stage-mic svg { width:19px; height:19px; fill:currentColor; }.wf-call-copy strong { display:block; color:#e7f1fb; font-size:11px; letter-spacing:-.02em; }.wf-call-copy span { display:block; max-width:210px; margin-top:2px; color:#88a0b8; font-size:9px; line-height:1.4; }.wf-stage-bottom { margin-top:14px; }.wf-stage-bottom span { color:#7790aa; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:9px; letter-spacing:.03em; }.wf-stage-bottom .wf-recording { display:flex; align-items:center; gap:5px; color:#9cb3c9; }.wf-recording i { width:5px; height:5px; border-radius:50%; background:#e9879d; box-shadow:0 0 9px rgba(233,135,157,.75); }
      .wf-transcript { min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr) auto auto; background:rgba(4,17,31,.4); }.wf-transcript-head { display:flex; align-items:center; justify-content:space-between; gap:9px; padding:19px 21px 13px; border-bottom:1px solid rgba(177,216,244,.09); }.wf-transcript-head p { margin:0; color:#8fa6bd; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:9px; font-weight:700; letter-spacing:.16em; }.wf-transcript-head span { color:#79e9d5; font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:9px; }.wf-messages { min-height:0; display:flex; flex-direction:column; gap:15px; padding:19px 21px 9px; overflow-y:auto; scroll-behavior:smooth; scrollbar-color:#35536e transparent; scrollbar-width:thin; }.wf-message { display:flex; align-items:flex-end; gap:9px; max-width:92%; animation:wf-message-in .42s cubic-bezier(.2,.9,.25,1.18) both; }.wf-message.user { align-self:flex-end; flex-direction:row-reverse; }.wf-mini-avatar { width:25px; height:25px; display:grid; place-items:center; flex:0 0 auto; color:#063b3e; border-radius:8px; background:var(--wf-teal); font-size:7px; font-weight:900; }.wf-message.user .wf-mini-avatar { color:#dce8f5; background:#345172; }.wf-bubble { padding:10px 12px 8px; border:1px solid rgba(167,211,244,.12); border-radius:4px 14px 14px 14px; background:linear-gradient(135deg, rgba(27,60,91,.82), rgba(16,42,68,.7)); box-shadow:0 8px 21px rgba(0,0,0,.08); }.wf-message.user .wf-bubble { border-radius:14px 4px 14px 14px; background:linear-gradient(135deg, rgba(64,80,133,.72), rgba(42,65,104,.72)); }.wf-bubble p { margin:0; color:#e2edf8; font-size:12px; line-height:1.62; white-space:pre-wrap; word-break:break-word; }.wf-message time { display:block; margin-top:5px; color:#7790aa; font-size:9px; }.wf-typing { display:flex; align-items:center; gap:4px; min-height:15px; }.wf-typing i { display:block; width:5px; height:5px; border-radius:50%; background:var(--wf-teal); animation:wf-bounce .85s ease-in-out infinite; }.wf-typing i:nth-child(2) { animation-delay:.12s; }.wf-typing i:nth-child(3) { animation-delay:.24s; }@keyframes wf-bounce { 0%,100% { opacity:.25; transform:translateY(0); } 50% { opacity:1; transform:translateY(-3px); } }@keyframes wf-message-in { from { opacity:0; transform:translateY(10px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .wf-suggestions { display:flex; flex-wrap:wrap; gap:6px; padding:7px 21px 13px; }.wf-suggestion { padding:7px 9px; color:#adc3d8; border:1px solid rgba(156,210,242,.14); border-radius:99px; background:rgba(29,55,84,.56); font-size:10px; line-height:1.2; transition:color .25s ease, border-color .25s ease, transform .25s cubic-bezier(.2,.9,.25,1.3), background .25s ease; }.wf-suggestion:hover { color:#dbfff9; border-color:rgba(103,229,207,.52); background:rgba(56,130,126,.25); transform:translateY(-2px); }
      .wf-composer-wrap { padding:0 17px 15px; }.wf-voice-status { min-height:15px; margin:0 0 7px 4px; color:#8af0df; font-size:10px; }.wf-voice-status:empty { display:none; }.wf-composer { display:flex; align-items:flex-end; gap:7px; padding:6px; border:1px solid rgba(148,200,238,.2); border-radius:12px; background:#071525; transition:border-color .2s ease, box-shadow .2s ease; }.wf-composer:focus-within { border-color:rgba(113,239,221,.68); box-shadow:0 0 0 3px rgba(98,230,208,.06); }.wf-input { width:100%; max-height:90px; min-height:29px; padding:7px 3px 5px 6px; resize:none; color:#edf5fb; background:transparent; border:0; outline:0; font-size:12px; line-height:1.4; }.wf-input::placeholder { color:#7188a1; }.wf-mic, .wf-send { width:31px; height:31px; display:grid; place-items:center; flex:0 0 auto; padding:0; border-radius:8px; }.wf-mic { color:#aec5d9; border:1px solid transparent; background:transparent; }.wf-mic:hover, .wf-mic.is-listening { color:#aaffef; border-color:rgba(103,229,207,.3); background:rgba(89,223,203,.12); }.wf-mic svg, .wf-send svg { width:16px; height:16px; fill:currentColor; }.wf-send { color:#033638; border:1px solid var(--wf-bright); background:var(--wf-teal); }.wf-send:hover { background:var(--wf-bright); }.wf-note { margin:8px 3px 0; color:#71869e; font-size:9px; line-height:1.45; }.wf-note a { color:#a6bed4; }.wf-note a:hover { color:var(--wf-bright); }
      @media (max-width: 860px) { .wf-panel { width:min(690px, calc(100vw - 32px)); height:min(780px, calc(100vh - 32px)); }.wf-workspace { grid-template-columns:1fr; grid-template-rows:minmax(280px,.72fr) minmax(330px,1fr); }.wf-stage { min-height:280px; padding:17px 20px 15px; border-right:0; border-bottom:1px solid var(--wf-line); }.wf-visual-field { min-height:190px; }.wf-orbit { width:185px; height:185px; }.wf-orbit-two { width:255px; height:255px; }.wf-orbit-three { width:310px; height:310px; }.wf-core { width:122px; height:122px; }.wf-core-shadow { top:calc(50% + 78px); }.wf-wave { bottom:0; }.wf-call-card { position:absolute; z-index:2; right:0; bottom:3px; margin:0; transform:scale(.88); transform-origin:right bottom; }.wf-stage-bottom { display:none; } }
      @media (max-width: 560px) { .wf-wrap { right:0; bottom:0; }.wf-panel { right:0; bottom:0; width:100vw; height:100svh; min-height:0; border:0; border-radius:0; }.wf-header { min-height:65px; padding:11px 14px; }.wf-avatar { width:38px; height:38px; }.wf-heading strong { font-size:13px; }.wf-workspace { grid-template-rows:270px minmax(0,1fr); }.wf-stage { padding:15px 15px 11px; }.wf-visual-field { min-height:165px; }.wf-orbit { width:159px; height:159px; }.wf-orbit-two { width:218px; height:218px; }.wf-orbit-three { width:275px; height:275px; }.wf-core { width:104px; height:104px; }.wf-core-word { font-size:22px; }.wf-core-shadow { top:calc(50% + 63px); }.wf-call-card { transform:scale(.76); right:-12px; bottom:-2px; }.wf-transcript-head { padding:13px 14px 10px; }.wf-messages { padding:14px 13px 6px; gap:11px; }.wf-message { max-width:96%; }.wf-bubble { padding:9px 10px 7px; }.wf-bubble p { font-size:11.5px; }.wf-suggestions { flex-wrap:nowrap; padding:6px 13px 10px; overflow-x:auto; }.wf-suggestion { flex:0 0 auto; }.wf-composer-wrap { padding:0 11px max(11px, env(safe-area-inset-bottom)); }.wf-note { display:none; }.wf-icon-button { width:31px; height:31px; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior:auto !important; animation-duration:.001ms !important; transition-duration:.001ms !important; } }
    </style>
    <section class="wf-wrap" aria-label="${escapeHtml(config.title)} portfolio assistant">
      <section class="wf-panel" aria-label="${escapeHtml(config.title)} live conversation" aria-hidden="true">
        <header class="wf-header">
          <div class="wf-avatar" aria-hidden="true">WF</div>
          <div class="wf-heading"><strong>${escapeHtml(config.title)}</strong><span><i class="wf-live-dot"></i> Creative voice companion</span></div>
          <button class="wf-icon-button wf-speaker" type="button" aria-label="Turn voice replies off" aria-pressed="true" title="Voice replies"><svg class="wf-speaker-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.4 3a4.4 4.4 0 0 0-2.2-3.8v7.6a4.4 4.4 0 0 0 2.2-3.8Zm0-8.5v2.1a7 7 0 0 1 0 12.8v2.1a9 9 0 0 0 0-17.9Z" /></svg><svg class="wf-speaker-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm15.7 1.3-1.4-1.4-2.3 2.3-2.3-2.3-1.4 1.4 2.3 2.3-2.3 2.3 1.4 1.4 2.3-2.3 2.3 2.3 1.4-1.4-2.3-2.3 2.3-2.3Z" /></svg></button>
          <button class="wf-icon-button wf-reset" type="button" aria-label="Start a new conversation" title="New conversation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2.2 5.5h-2.1A6 6 0 1 1 18.5 8H15v2h7V3h-2v3.5A8 8 0 0 0 20 11Z" /></svg></button>
          <button class="wf-icon-button wf-close-panel" type="button" aria-label="Close WF Assist" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z" /></svg></button>
        </header>
        <div class="wf-workspace">
          <section class="wf-stage" aria-label="WF Assist voice session">
            <div class="wf-stage-top"><p class="wf-stage-label">LIVE CREATIVE SESSION</p><span class="wf-stage-latency"><i></i> ONLINE</span></div>
            <div class="wf-visual-field" aria-hidden="true">
              <div class="wf-orbit wf-orbit-three"></div><div class="wf-orbit wf-orbit-two"></div><div class="wf-orbit wf-orbit-one"></div><div class="wf-core-shadow"></div>
              <div class="wf-core"><span class="wf-core-word">WF<small>AI</small></span></div>
              <div class="wf-wave">${"<i></i>".repeat(19)}</div>
            </div>
            <div class="wf-stage-bottom"><div class="wf-call-card"><button class="wf-stage-mic" type="button" aria-label="Start voice chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21H8v2h8v-2h-3v-3.1A7 7 0 0 0 19 11h-2Z" /></svg></button><div class="wf-call-copy"><strong>Start voice conversation</strong><span class="wf-stage-status">Tap to talk with WF Assist</span></div></div><span class="wf-recording"><i></i> TRANSCRIPT ON</span></div>
          </section>
          <section class="wf-transcript" aria-label="Written conversation transcript">
            <header class="wf-transcript-head"><p>LIVE TRANSCRIPT</p><span>SESSION · 01</span></header>
            <div class="wf-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
            <div class="wf-suggestions" aria-label="Suggested questions"><button class="wf-suggestion" type="button" data-prompt="What services does WF offer?">Services</button><button class="wf-suggestion" type="button" data-prompt="Which motion design projects should I explore?">Explore projects</button><button class="wf-suggestion" type="button" data-prompt="What tools and workflows does WF use?">Tools &amp; workflow</button><button class="wf-suggestion" type="button" data-action="lead">Start a project</button></div>
            <div class="wf-composer-wrap"><p class="wf-voice-status" role="status"></p><form class="wf-composer"><textarea class="wf-input" rows="1" maxlength="1600" aria-label="Message WF Assist" placeholder="Write or speak to WF Assist…"></textarea><button class="wf-mic" type="button" aria-label="Speak to WF Assist" title="Speak to WF Assist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21H8v2h8v-2h-3v-3.1A7 7 0 0 0 19 11h-2Z" /></svg></button><button class="wf-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 3-7 8-2-8-2-3-7Z" /></svg></button></form><p class="wf-note">Voice is browser-based. Please do not share passwords or payment details. <a href="${escapeAttribute(config.siteUrl)}" target="_blank" rel="noopener">Visit portfolio ↗</a></p></div>
          </section>
        </div>
      </section>
      <button class="wf-launcher" type="button" aria-label="Open ${escapeHtml(config.title)}" aria-expanded="false"><svg class="wf-orb-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5a12.5 12.5 0 1 0 0 25 12.5 12.5 0 0 0 0-25Zm0 2.5a10 10 0 0 1 8.8 14.7l-3.1-3.1a5.6 5.6 0 0 0-2.1-6.2 5.5 5.5 0 0 0-8.8 4.4c0 .7.1 1.4.4 2L7.6 21.4A10 10 0 0 1 16 6Zm0 7.1a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4Zm0 12.4c-2.3 0-4.4-.8-6-2.2l3.1-3.1a5.5 5.5 0 0 0 7.3 0l3.1 3.1a9.9 9.9 0 0 1-7.5 2.2Z" /></svg><span class="wf-launch-pulse"></span></button>
    </section>
  `;

  const ui = {
    wrap: root.querySelector(".wf-wrap"),
    panel: root.querySelector(".wf-panel"),
    launcher: root.querySelector(".wf-launcher"),
    stage: root.querySelector(".wf-stage"),
    stageMic: root.querySelector(".wf-stage-mic"),
    stageStatus: root.querySelector(".wf-stage-status"),
    messages: root.querySelector(".wf-messages"),
    form: root.querySelector(".wf-composer"),
    input: root.querySelector(".wf-input"),
    mic: root.querySelector(".wf-mic"),
    speaker: root.querySelector(".wf-speaker"),
    reset: root.querySelector(".wf-reset"),
    close: root.querySelector(".wf-close-panel"),
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

  function showStatus(value = "") {
    ui.status.textContent = value;
    ui.stageStatus.textContent = value || "Tap to talk with WF Assist";
    ui.stage.classList.toggle("is-speaking", value === "WF Assist is speaking…");
  }

  function addStagePhysics() {
    ui.stage.addEventListener("pointermove", (event) => {
      const bounds = ui.stage.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 18;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 14;
      ui.wrap.style.setProperty("--pointer-x", `${x.toFixed(1)}px`);
      ui.wrap.style.setProperty("--pointer-y", `${y.toFixed(1)}px`);
    });
    ui.stage.addEventListener("pointerleave", () => {
      ui.wrap.style.setProperty("--pointer-x", "0px");
      ui.wrap.style.setProperty("--pointer-y", "0px");
    });
  }

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
    window.speechSynthesis?.cancel();
    ui.stage.classList.remove("is-listening", "is-speaking");
    ui.stageMic.classList.remove("is-listening");
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
      ui.stageMic.classList.add("is-listening");
      ui.stage.classList.add("is-listening");
      ui.mic.setAttribute("aria-label", "Stop listening");
      ui.stageMic.setAttribute("aria-label", "Stop listening");
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
      ui.stageMic.classList.remove("is-listening");
      ui.stage.classList.remove("is-listening");
      ui.mic.setAttribute("aria-label", "Speak to WF Assist");
      ui.stageMic.setAttribute("aria-label", "Start voice chat");
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
    ui.stage.classList.remove("is-listening", "is-speaking");
    ui.stageMic.classList.remove("is-listening");
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
  ui.stageMic.addEventListener("click", toggleListening);
  ui.speaker.addEventListener("click", () => setVoiceReplies(!state.voiceReplies));
  ui.reset.addEventListener("click", resetConversation);
  ui.close.addEventListener("click", closeWidget);
  addStagePhysics();
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
