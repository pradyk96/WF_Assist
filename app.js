/*
 * WF Voice Assist
 * This front-end intentionally keeps the telecom knowledge base and session context
 * in the browser. Replace AssistantEngine.reply() with a secure server-side AI/API
 * request before using account data or sending leads in production.
 */

const $ = (selector, parent = document) => parent.querySelector(selector);

const elements = {
  messages: $("#messages"),
  composer: $("#composer"),
  input: $("#messageInput"),
  micButton: $("#micButton"),
  micButtonLabel: $("#micButtonLabel"),
  voiceState: $("#voiceState"),
  listeningVisual: $("#listeningVisual"),
  speakerButton: $("#speakerButton"),
  autoSpeak: $("#autoSpeak"),
  clearButton: $("#clearButton"),
  settingsButton: $("#settingsButton"),
  settingsDialog: $("#settingsDialog"),
  specialistButton: $("#specialistButton"),
  leadDialog: $("#leadDialog"),
  leadClose: $("#leadClose"),
  leadForm: $("#leadForm"),
  formStatus: $("#formStatus"),
};

const getTime = () => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());

class AssistantEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.context = { topic: null, issue: null, leadStage: null, lead: {} };
  }

  normalize(value) {
    return value.toLowerCase().replace(/[^a-z0-9@+ .'-]/g, " ").replace(/\s+/g, " ").trim();
  }

  reply(rawMessage) {
    const message = this.normalize(rawMessage);
    if (!message) return "I didn’t catch that. Could you tell me what you need help with—service information, setup, or a technical issue?";

    const leadReply = this.captureLead(message, rawMessage);
    if (leadReply) return leadReply;

    // Immediate escalation: do not attempt to diagnose or promise an outcome.
    if (/(legal|lawyer|attorney|complaint|sue|manager|supervisor|chargeback|payment dispute|data breach)/.test(message)) {
      this.context.topic = "human support";
      return "I understand this needs personal attention. I’ll connect you to a human specialist right away. Would you like to share your name and work email so the right team can follow up?";
    }
    if (/(outage|network down|service down|all calls down|system down)/.test(message)) {
      this.context.topic = "outage";
      return "I’m sorry your service may be affected. I’ll connect you to a human specialist right away so they can verify the network status for your service. May I have your company name and the country affected?";
    }

    if (/(poor.*call|call.*quality|call drop|dropped call|choppy|one way audio|no audio|echo|jitter|packet loss|voice.*break)/.test(message)) return this.callQuality();
    if (/(registration|register|not registered|sip.*fail|unable.*connect|auth.*fail|403|401)/.test(message)) return this.registration();
    if (/(bill|billing|invoice|charged|charge|rate calculation|credit|balance|payment)/.test(message)) return this.billing(message);

    if (/(price|pricing|cost|rate|quote|how much)/.test(message)) {
      this.context.topic = "pricing";
      return "I can help scope the right service, but I don’t want to guess pricing or rates. Let me connect you to our support team for accurate assistance. Is this for VoIP, SIP trunking, DID numbers, SMS, or international calling?";
    }

    // A visitor who actively wants a service can move into the light lead flow.
    // It asks only for proposal essentials, one answer at a time.
    const wantsService = /(need|want|looking for|interested in|proposal|purchase|buy|sign up|service for)/.test(message);
    if (wantsService && /(voip|internet phone|business phone|softphone)/.test(message)) {
      return this.startLead("business VoIP", "Business VoIP lets teams make and receive calls over the internet with flexible extensions and call handling.");
    }
    if (wantsService && /(sip trunk|sip)/.test(message)) {
      return this.startLead("SIP trunking", "SIP trunking connects an existing phone system to the public phone network over the internet and can scale with call demand.");
    }
    if (wantsService && /(did|virtual number|local number|phone number)/.test(message)) {
      return this.startLead("DID numbers", "DID numbers give callers a direct number that can route into a team, IVR, or application.");
    }
    if (wantsService && /(sms|text message|messaging)/.test(message)) {
      return this.startLead("SMS services", "Business SMS can support notifications, two-factor authentication, and customer updates.");
    }
    if (wantsService && /(cloud pbx|pbx|extension|ivr|call queue|auto attendant)/.test(message)) {
      return this.startLead("Cloud PBX", "A Cloud PBX provides hosted business calling features such as extensions, IVR menus, and call queues.");
    }

    if (/(voip|internet phone|business phone|softphone)/.test(message)) return this.voip();
    if (/(sip trunk|sip)/.test(message)) return this.sip();
    if (/(port|porting|transfer.*number|move.*number)/.test(message)) return this.porting();
    if (/(did|virtual number|local number|phone number)/.test(message)) return this.did();
    if (/(international|overseas|abroad|country.*call|call.*country)/.test(message)) return this.international();
    if (/(wholesale|carrier|termination|origination)/.test(message)) return this.wholesale();
    if (/(sms|text message|messaging)/.test(message)) return this.sms();
    if (/(cloud pbx|pbx|extension|ivr|call queue|auto attendant)/.test(message)) return this.pbx();
    if (/(routing|route|failover|lcr|least cost)/.test(message)) return this.routing();
    if (/(asr|acd|pdd|quality metric|answer seizure|post dial)/.test(message)) return this.quality();
    if (/(cli|caller id|callerid|calling line)/.test(message)) return this.cli();
    if (/(fraud|fraud protection|toll fraud|security)/.test(message)) return this.fraud();
    if (/(api|integration|webhook|developer)/.test(message)) return this.api();

    if (/(hello|hi|hey|good morning|good afternoon|good evening)/.test(message)) {
      return "Hello and welcome to WF Telecom. I can help with business voice, DID numbers, SIP, Cloud PBX, SMS, technical guidance, or a custom service request. What would you like to explore?";
    }
    if (/(thank|thanks)/.test(message)) {
      return "You’re welcome. Thank you for choosing WF Telecom. If you need further assistance, I’m always here to help. Is there anything else I can assist you with?";
    }

    // Use conversation context to make a reasonable next prompt without inventing facts.
    if (this.context.topic) {
      return `I’m still here to help with ${this.context.topic}. Could you share a little more about your setup or goal so I can guide you correctly?`;
    }
    return "I specialize in telecom services such as VoIP, SIP trunking, DID numbers, Cloud PBX, SMS, routing, and voice quality. For that topic, I recommend consulting the appropriate professional. Is there a WF Telecom service I can help you with?";
  }

  startLead(service, introduction = "") {
    this.context = { topic: service, issue: null, leadStage: "name", lead: { service } };
    const prefix = introduction || `WF can prepare a tailored ${service} proposal.`;
    return `${prefix} To prepare the right proposal, may I have your name?`;
  }

  captureLead(message, rawMessage) {
    const stage = this.context.leadStage;
    if (!stage) return null;
    if (/^(cancel|stop|never ?mind|nevermind|no thanks|not now)$/.test(message)) {
      const service = this.context.topic;
      this.context.leadStage = null;
      return `No problem. I’ve stopped the ${service} proposal questions. Would you like general service information or technical help instead?`;
    }

    if (stage === "name") {
      this.context.lead.name = rawMessage.trim().slice(0, 80);
      this.context.leadStage = "company";
      return `Thank you, ${this.context.lead.name}. What company are you representing?`;
    }
    if (stage === "company") {
      this.context.lead.company = rawMessage.trim().slice(0, 120);
      this.context.leadStage = "email";
      return "Thanks. What work email should the team use for the proposal?";
    }
    if (stage === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawMessage.trim())) {
        return "To make sure the team can contact you, could you provide a valid work email address?";
      }
      this.context.lead.email = rawMessage.trim().slice(0, 160);
      this.context.leadStage = "country";
      return "Great. Which country will the service be used in or managed from?";
    }
    if (stage === "country") {
      this.context.lead.country = rawMessage.trim().slice(0, 80);
      this.context.leadStage = "volume";
      return "Thank you. About how many monthly minutes, messages, numbers, or users do you expect? An estimate is completely fine.";
    }
    if (stage === "volume") {
      this.context.lead.volume = rawMessage.trim().slice(0, 120);
      this.context.leadStage = null;
      return `I’ve noted your ${this.context.topic} requirements. Let me connect you to our support team for accurate assistance and a custom proposal. Would you also like help with setup or technical requirements?`;
    }
    return null;
  }

  voip() {
    this.context.topic = "business VoIP";
    return "VoIP lets you make and receive calls over an internet connection instead of traditional phone lines. It can give a business more flexibility for remote teams, extensions, and call handling. Are you looking for VoIP for a business or personal use?";
  }

  sip() {
    this.context.topic = "SIP trunking";
    return "SIP trunking connects your business phone system to the public phone network over the internet, replacing or expanding traditional phone lines. It can help scale call capacity without adding physical circuits. Are you connecting an existing PBX, or starting a new phone setup?";
  }

  did() {
    this.context.topic = "DID numbers";
    return "A DID is a direct phone number that can route a caller to a person, department, IVR, or application without a separate physical line. It is useful when you need local presence or dedicated inbound call routing. Which country or city do you need a number for?";
  }

  international() {
    this.context.topic = "international calling";
    return "WF can help assess international calling needs, including destinations, expected traffic, and routing requirements. Actual rates and availability can vary by destination, so I won’t guess them. Which country are you calling, and is this for business traffic?";
  }

  wholesale() {
    this.context.topic = "wholesale voice";
    return "Wholesale voice is carrier-to-carrier voice traffic, usually managed at higher volumes with agreed routes, quality controls, and billing terms. WF can help evaluate originations or termination requirements. Which destinations and approximate monthly minutes are you considering?";
  }

  sms() {
    this.context.topic = "SMS services";
    return "Business SMS can support notifications, two-factor authentication, customer updates, and conversational messaging. The right setup depends on the sending country, destination countries, message type, and expected volume. Are you planning transactional messages, marketing messages, or both?";
  }

  pbx() {
    this.context.topic = "Cloud PBX";
    return "A Cloud PBX is an internet-hosted business phone system with features such as extensions, call queues, IVR menus, voicemail, and remote access. It can reduce the need to maintain on-site PBX hardware. How many users or departments would need to use it?";
  }

  routing() {
    this.context.topic = "call routing";
    return "Call routing decides where an incoming or outgoing call should go, for example to a team, a time-based destination, or a backup route. A well-designed routing plan helps callers reach the right place and supports continuity. Are you setting up inbound routing, outbound routing, or failover?";
  }

  porting() {
    this.context.topic = "number porting";
    return "Number porting moves an existing number from one provider to another so callers can keep using the same number. The process depends on the country, current carrier, number type, and valid authorization details. Which country is the number in, and is it a business or personal number?";
  }

  quality() {
    this.context.topic = "voice quality metrics";
    return "ASR, ACD, and PDD are call-quality indicators. In simple terms, they show how often calls connect, how long answered calls last, and how quickly a call starts ringing. Would you like a technical explanation of one of these metrics, or help reviewing a route?";
  }

  cli() {
    this.context.topic = "CLI management";
    return "CLI management controls the caller ID presented with a call. It should be handled carefully so numbers are authorized, recognizable, and compliant with the destination’s requirements. Are you trying to set a verified caller ID or diagnose caller ID display issues?";
  }

  fraud() {
    this.context.topic = "fraud protection";
    return "Telecom fraud protection helps reduce risks such as unauthorized calling, toll fraud, and abnormal traffic patterns. Common controls include strong credentials, IP restrictions, destination limits, spend limits, and traffic monitoring. Are you securing a SIP setup now, or responding to suspicious activity?";
  }

  api() {
    this.context.topic = "API integration";
    return "Telecom APIs allow software to manage functions such as messages, calls, number provisioning, and call events programmatically. The best integration approach depends on the workflow, authentication method, and expected volume. What are you building, and do you need voice, SMS, or both?";
  }

  callQuality() {
    this.context.topic = "call quality";
    this.context.issue = "call quality";
    return "I’m sorry you’re experiencing call-quality issues. First, please check that your internet connection is stable and that other heavy downloads or video calls are not using the available bandwidth. Are the drops or poor audio happening on local calls, international calls, or both?";
  }

  registration() {
    this.context.topic = "SIP registration";
    this.context.issue = "registration";
    return "I understand your SIP device is not registering. Please confirm the SIP username, password, server address, and port exactly match the details provided, then check that your firewall allows the required traffic. Are you authenticating by SIP credentials or by approved IP address?";
  }

  billing(message) {
    this.context.topic = "billing";
    if (/(dispute|wrong|incorrect|refund|unauthori[sz]ed)/.test(message)) {
      return "I understand you have a billing concern. For a charge review or account-specific details, I’ll connect you to a human specialist right away. Please do not send card details or passwords here. Would you like to open a support request?";
    }
    return "I can explain general billing: charges are normally based on the service, usage or recurring period, and the applicable rate structure. For your exact invoice, rate, or account balance, let me connect you to our support team for accurate assistance. Would you like an invoice review?";
  }
}

const engine = new AssistantEngine();
let recognition = null;
let isListening = false;
let voiceRepliesEnabled = true;
let replyTimer = null;

function addMessage(text, sender = "assistant", { speak = false, typing = false } = {}) {
  const message = document.createElement("article");
  message.className = `message ${sender}-message${typing ? " is-typing" : ""}`;
  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = sender === "assistant" ? "WF" : "YOU";

  const content = document.createElement("div");
  content.className = "message-content";
  const body = document.createElement("p");
  if (typing) {
    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      body.append(dot);
    }
  } else {
    body.textContent = text;
  }
  const time = document.createElement("time");
  time.textContent = getTime();
  content.append(body, time);
  message.append(avatar, content);
  elements.messages.append(message);
  elements.messages.scrollTop = elements.messages.scrollHeight;

  if (speak && sender === "assistant") speakText(text);
  return message;
}

function removeTypingMessage() {
  $(".is-typing", elements.messages)?.remove();
}

function sendMessage(rawMessage, fromVoice = false) {
  const message = rawMessage.trim();
  if (!message) return;
  window.clearTimeout(replyTimer);
  elements.input.value = "";
  addMessage(message, "user");
  const typingMessage = addMessage("", "assistant", { typing: true });
  const answer = engine.reply(message);
  replyTimer = window.setTimeout(() => {
    typingMessage.remove();
    addMessage(answer, "assistant", { speak: fromVoice || voiceRepliesEnabled });
  }, Math.min(850, 260 + answer.length * 2));
}

function setVoiceState(state, isActive = false) {
  elements.voiceState.textContent = state;
  elements.voiceState.classList.toggle("listening", isActive);
  elements.listeningVisual.classList.toggle("is-listening", isActive);
  elements.micButton.classList.toggle("is-listening", isActive);
  elements.micButtonLabel.textContent = isActive ? "Listening…" : "Speak to WF";
  elements.micButton.setAttribute("aria-label", isActive ? "Stop listening" : "Start speaking to WF Telecom");
}

function speechSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function setupRecognition() {
  if (!speechSupported()) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const instance = new Recognition();
  instance.lang = document.documentElement.lang || "en-US";
  instance.interimResults = true;
  instance.continuous = false;
  let finalTranscript = "";

  instance.onstart = () => {
    finalTranscript = "";
    isListening = true;
    setVoiceState("Listening…", true);
    window.speechSynthesis?.cancel();
  };
  instance.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript;
      if (event.results[index].isFinal) finalTranscript += transcript;
      else interimTranscript += transcript;
    }
    setVoiceState(finalTranscript || interimTranscript || "Listening…", true);
  };
  instance.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone permission was not granted. You can type your question below.",
      "service-not-allowed": "Voice recognition is unavailable right now. You can type your question below.",
      "no-speech": "I didn’t hear anything. Please try again or type your question.",
      "audio-capture": "I can’t find a microphone. Check your device settings, then try again.",
      aborted: "Voice input stopped.",
    };
    if (event.error !== "aborted") setVoiceState(messages[event.error] || "Voice input had a problem. Please try again.");
  };
  instance.onend = () => {
    const transcript = finalTranscript.trim();
    isListening = false;
    if (transcript) {
      setVoiceState("Thinking…");
      sendMessage(transcript, true);
    } else if (elements.voiceState.textContent === "Listening…") {
      setVoiceState("Ready when you are");
    }
  };
  return instance;
}

function toggleListening() {
  if (!speechSupported()) {
    const notice = "Voice input is not available in this browser. You can type your question below, or use a current supported browser. Would you like help with a telecom service?";
    addMessage(notice, "assistant", { speak: false });
    setVoiceState("Voice input is unavailable in this browser");
    return;
  }
  if (!recognition) recognition = setupRecognition();
  if (isListening) {
    recognition.stop();
    return;
  }
  try {
    recognition.start();
  } catch (_) {
    // Recognition throws if a browser still considers an earlier session active.
    setVoiceState("Voice input is preparing. Please try again in a moment.");
  }
}

function speakText(text) {
  if (!voiceRepliesEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = document.documentElement.lang || "en-US";
  utterance.onstart = () => {
    if (!isListening) setVoiceState("WF is speaking…");
  };
  utterance.onend = () => {
    if (!isListening) setVoiceState("Ready when you are");
  };
  utterance.onerror = () => {
    if (!isListening) setVoiceState("Ready when you are");
  };
  window.speechSynthesis.speak(utterance);
}

function setVoiceReplies(enabled) {
  voiceRepliesEnabled = enabled;
  elements.autoSpeak.checked = enabled;
  elements.speakerButton.classList.toggle("is-on", enabled);
  elements.speakerButton.setAttribute("aria-pressed", String(enabled));
  elements.speakerButton.setAttribute("aria-label", enabled ? "Turn voice replies off" : "Turn voice replies on");
  if (!enabled) window.speechSynthesis?.cancel();
}

function resetConversation() {
  window.clearTimeout(replyTimer);
  window.speechSynthesis?.cancel();
  if (isListening) recognition?.abort();
  engine.reset();
  elements.messages.replaceChildren();
  addMessage("Hello and welcome to WF Telecom. How may I assist you today?");
  setVoiceState("Ready when you are");
  elements.input.focus();
}

function openLeadDialog() {
  if (typeof elements.leadDialog.showModal === "function") {
    elements.leadDialog.showModal();
    $("input", elements.leadDialog)?.focus();
  } else {
    // Fallback for obsolete browsers: guide the visitor in the conversation.
    addMessage("I’ll connect you to a human specialist right away. Please share your name, company, work email, country, and the service you need so the team can follow up.", "assistant", { speak: voiceRepliesEnabled });
  }
}

// Events
elements.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(elements.input.value);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

elements.micButton.addEventListener("click", toggleListening);
elements.clearButton.addEventListener("click", resetConversation);
elements.speakerButton.addEventListener("click", () => setVoiceReplies(!voiceRepliesEnabled));
elements.autoSpeak.addEventListener("change", (event) => setVoiceReplies(event.target.checked));
elements.settingsButton.addEventListener("click", () => elements.settingsDialog.showModal());
elements.specialistButton.addEventListener("click", openLeadDialog);
elements.leadClose.addEventListener("click", () => elements.leadDialog.close());

elements.leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(elements.leadForm);
  const name = form.get("name")?.trim() || "there";
  // No external endpoint is configured. Never imply that a lead has been transmitted.
  sessionStorage.setItem("wfAssistLeadDraft", JSON.stringify(Object.fromEntries(form.entries())));
  elements.formStatus.textContent = `Thanks, ${name}. Your request is saved in this browser for this session. Connect this form to WF’s secure support or CRM endpoint to submit it.`;
});

// Keep the visual preference consistent when a voice changes outside the settings dialog.
setVoiceReplies(true);
