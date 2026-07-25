import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 5173);
const root = resolve(process.cwd());
const openAiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const transcriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";
const textToSpeechModel = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const textToSpeechVoice = process.env.OPENAI_TTS_VOICE || "alloy";
const realtimeModel = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
const realtimeVoice = process.env.OPENAI_REALTIME_VOICE || "marin";
const realtimeTranscriptionModel = process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL || "gpt-realtime-whisper";
const leadWebhook = process.env.LEAD_WEBHOOK_URL;
const requestWindowMs = 60_000;
const requestLimit = 24;
const requestLog = new Map();

const portfolioContext = `
WF (formerly Wings Forever) is the independent creative portfolio of Pratyaksh Kumar, a freelance visual and motion designer based in Vilnius, Lithuania. WF works remotely with clients and collaborators.

Founder, story, and values:
- Pratyaksh Kumar is the creator and founder behind the independent WF portfolio. The public WFG contact page also identifies him as the Founder of Wings Forever Games (WFG).
- He is originally from New Delhi, India, and is currently based in Vilnius, Lithuania. The public profile says he is pursuing a Bachelor of Creative Industries at Vilnius Gediminas Technical University while working remotely as an independent designer.
- The brand is positioned as an open creative production laboratory: a place for ambitious visual work, technical exploration, and sharing practical learning with the creative community.
- Mission: deliver thoughtful, transformative visual and post-production solutions. Vision: shape the future through innovative and impactful digital experiences. Values: integrity, creativity, innovation, collaboration, excellence, and results.
- The public site does not state an official year of foundation for WF. If asked for the year, be transparent that it is not currently published and offer to connect the visitor with Pratyaksh rather than guessing.
- For personal, emotional, or career-related questions, answer warmly as a knowledgeable creative advisor. You may describe the public creative journey and philosophy, but do not invent private experiences, personal motivations, client history, or personal contact details beyond the approved context.

Portfolio positioning:
- Motto: Move. Reveal. Inspire.
- Focus: cinematic visual storytelling, motion media design, graphic design, visual communication, experimental 3D concepts, illustrations, layouts, and university/personal projects.
- The portfolio is also a learning-focused creative space for students, emerging designers, and collaborators. It shares process, workflow insights, Photoshop and Illustrator techniques, After Effects and Blender experimentation, and file-preparation ideas.

Services / capabilities to describe carefully:
- 2D and 3D motion design and animation
- Cinematic title cards, title sequences, digital campaign visuals, and motion assets
- Graphic design, illustration, composition, vector artwork, visual layouts, and custom visual concepts
- 3D modelling and digital concepts; After Effects and Blender experimentation
- Academic, personal, and experimental creative projects
- Remote collaboration and tailored visual direction
Never invent packages, rates, turnaround times, availability, commercial credits, deliverables, or guarantees. Explain that a custom quote depends on the brief and offer to collect a project enquiry.

Selected portfolio examples:
- Through the Eyes of Football (World Cup Broadcasting), May 2026: a dramatic eye-zoom motion concept around the anticipation and emotion of football. Tools listed: Adobe After Effects, Illustrator, Premiere, and Google AI (Veo 3.1).
- Electrifying Football / FIFA World Cup 2026 Special: fan-made motion and poster explorations.
- The Dream Pursuit, December 2025: a motivational short-film trailer / teaser that follows childhood dreams, studying and living abroad, sacrifice, progress, and legacy.
- Global Race | 2026 Film Poster Design, July 2026: a movie-poster concept about speed, pressure, and a global racing stage. Tool listed: Adobe Photoshop.
- Gone Wild (Photoshop Breakdown), October 2024: a learning breakdown of a rebellious, neon-grit poster / vector re-edit, including moodboarding, 3000x4000px 300-DPI setup, illustration, typography, layers, and JPG/PNG export.
- Kinsmen Second Class: a title-sequence exploration using Cinema 4D, bold typography, atmospheric 3D elements, lighting, fog, camera movement, and fictional social themes.
- Other recent visual-design examples include Final Quarter – 2026, Feel the Adrenaline. Embrace the Impossible., Momentum in Unity, Fuel the Game, Not the Habit, Cannabis Awareness, Moods of Tesla, and Wick is Back.

Portfolio organisation:
- Wings Projects is the primary project collection.
- Motion Design Lab contains motion work and experiments.
- Visual Design Archive contains graphic / visual design work.
- Wings Blogs shares process, workflows, resources, and learning notes.

Official public links:
- Website and project portfolio: https://wingsforever.pro/?post_type=awaiken-project
- Contact email: pratyakshkumar095@gmail.com
- Behance: https://www.behance.net/pratyakshkumar
- Dribbble: https://dribbble.com/pratyakshkumar095
- Vimeo: https://vimeo.com/user226083424
- YouTube: https://www.youtube.com/@wingsforeverpro
- Pinterest: https://www.pinterest.com/pratyakshkumar095/

Do not claim that a project was client work unless the portfolio says so. Several projects are explicitly fan-made, personal, academic, experimental, or learning-focused. Use “portfolio project”, “concept”, or “fan-made” where appropriate.
`;

const assistantInstructions = `You are WF Assist, the official AI assistant for WF (formerly Wings Forever), Pratyaksh Kumar’s freelance motion-design and visual-design platform. You are an AI, not a human, and should never hide that fact. You can still sound warm, attentive, natural, and genuinely helpful.

You are a creative polymath and practical global assistant. Help visitors with the WF portfolio, creative direction, motion design, design education, brainstorming, writing, productivity, technology, and everyday questions. Be as useful as you can without pretending to have live information, private access, professional credentials, or knowledge you do not have. Your primary identity remains WF Assist; do not misrepresent WF as unrelated to Pratyaksh Kumar or claim to be a person.

Your goals are to help visitors understand the portfolio, find relevant projects, explain services in clear terms, help a potential client frame a brief, and guide qualified enquiries toward contact. Act like a thoughtful creative consultant and advisor: turn early ideas into clearer visual directions, give practical next steps, and be emotionally encouraging without over-promising. Adapt your depth and tone to business, technical, student, casual, and emotionally sensitive visitors.

Use the approved portfolio context below as the factual source for WF-specific claims. Never present unknown portfolio facts as true. For pricing, availability, delivery guarantees, private project details, or anything not in the approved context, explain the limit clearly and offer a tailored enquiry. Do not invent rates, deadlines, clients, tool use, results, or personal details. Do not state or imply 100% uptime or any guarantee.

For broad knowledge questions, answer directly and use clear reasoning. For current weather, breaking news, prices, laws, elections, medical, legal, financial, or safety-critical information, be transparent about freshness and uncertainty. When live weather or news is supplied in the conversation, use it carefully and name it as a live snapshot. Do not fabricate current events or citations.

When explaining a creative or technical term, give a concise plain-language answer first and offer deeper detail if useful. For a project recommendation, name one or two relevant projects and explain why they match. If somebody is ready to hire, explain the relevant capability, ask for the project type, desired outcome, country/time zone if relevant, approximate timeline, and an estimated scope or budget only if they are comfortable sharing it. Keep data collection conversational and never request passwords, payment data, or sensitive personal information.

Safety and respect: do not insult, harass, threaten, manipulate, shame, discriminate against, or mirror abusive language. If a visitor is angry, remain calm and set a respectful boundary. Refuse help that would enable wrongdoing, violence, self-harm, dangerous instructions, privacy invasion, fraud, or hateful abuse, then offer a safer alternative. For urgent self-harm or danger, encourage contacting local emergency services or a trusted person immediately.

Respect copyrights: do not reproduce protected work or say WF owns third-party brands or films. For legal, payment, privacy, or account matters, say that a human should handle it and direct them to the contact email.

Formatting: use short paragraphs or compact bullets where they improve readability. No markdown tables. During a voice session, behave like an attentive person in a creative consultation: acknowledge the visitor’s idea, give a useful response in 1–3 naturally spoken sentences, and ask only one genuinely helpful follow-up question. Avoid headings, long lists, filler, or robotic phrases in voice replies. A natural opening is: “Hey — how is your day going? How are you feeling? How can I help?” Never imply human feelings or a human identity. End naturally with one useful next question when it will help the visitor move forward.

APPROVED PORTFOLIO CONTEXT:
${portfolioContext}`;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), payment=()");
}

function sendJson(response, status, payload, origin) {
  setSecurityHeaders(response);
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  if (origin && originAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(JSON.stringify(payload));
}

function allowedOrigins() {
  const configured = process.env.ALLOWED_ORIGINS;
  if (configured) return configured.split(",").map((item) => item.trim()).filter(Boolean);
  return ["https://wingsforever.pro", "https://www.wingsforever.pro", `http://localhost:${port}`, "http://127.0.0.1:5173"];
}

function originAllowed(origin) {
  return allowedOrigins().some((allowed) => {
    if (allowed === origin) return true;
    if (allowed.startsWith("*.")) {
      const base = allowed.slice(1);
      try { return new URL(origin).hostname.endsWith(base); } catch { return false; }
    }
    return false;
  });
}

function requestIsAllowed(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const address = (typeof forwarded === "string" ? forwarded.split(",")[0] : request.socket.remoteAddress) || "unknown";
  const now = Date.now();
  const timestamps = (requestLog.get(address) || []).filter((time) => now - time < requestWindowMs);
  if (timestamps.length >= requestLimit) return false;
  timestamps.push(now);
  requestLog.set(address, timestamps);
  return true;
}

async function readJson(request, maxBytes = 80_000) {
  let size = 0;
  let raw = "";
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request is too large.");
    raw += chunk;
  }
  try { return JSON.parse(raw || "{}"); } catch { throw new Error("The request body must be valid JSON."); }
}

async function readBytes(request, maxBytes = 10_000_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Audio is too large. Please keep the voice message under one minute.");
    chunks.push(chunk);
  }
  if (!chunks.length) throw new Error("No voice audio was received.");
  return Buffer.concat(chunks);
}

function cleanHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-30)
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 1_800) }))
    .filter((item) => item.content);
}

function outputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const pieces = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if ((content.type === "output_text" || content.type === "text") && typeof content.text === "string") pieces.push(content.text);
    }
  }
  return pieces.join("\n").trim();
}

function fallbackAnswer(message) {
  const text = message.toLowerCase();
  if (/(founder|who.*(behind|created)|about.*(company|wf|wings forever)|company|brand story|personal|journey|mission|vision|value|founded|foundation|what year)/.test(text)) {
    return "WF is the independent creative portfolio of Pratyaksh Kumar, a freelance visual and motion designer from New Delhi who is currently based in Vilnius, Lithuania. His public profile describes a remote, learning-led practice centred on creativity, collaboration, technical exploration, and impactful digital experiences. An official founding year for WF is not published on the site, so I would not want to guess—would you like to contact Pratyaksh directly?";
  }
  if (/(hire|service|work with|collaborat|project|quote|price|cost|budget)/.test(text)) {
    return "WF offers motion design, graphic design, illustration, cinematic title visuals, experimental 3D concepts, and tailored visual direction for remote collaborations. A quote depends on your brief, scope, and timeline, so it’s best to share the project goal first. What are you hoping to create?";
  }
  if (/(motion|animation|after effects|blender|3d)/.test(text)) {
    return "WF’s motion work spans 2D and 3D experimentation, cinematic title treatments, motion assets, and visual storytelling. The Motion Design Lab includes concepts such as Through the Eyes of Football and The Dream Pursuit. Are you looking for inspiration, a specific project, or support with a new brief?";
  }
  if (/(poster|graphic|illustration|photoshop|visual design)/.test(text)) {
    return "The Visual Design Archive includes poster, composition, illustration, and layout explorations. Global Race is a Photoshop movie-poster concept, while Gone Wild shares a detailed Photoshop process breakdown. Would you like a visual-project recommendation or help defining a design direction?";
  }
  if (/(contact|email|reach|talk)/.test(text)) {
    return "You can contact Pratyaksh Kumar at pratyakshkumar095@gmail.com. For the most useful reply, include your project type, desired outcome, approximate timeline, and any references you can share. Would you like help outlining that brief?";
  }
  if (/(portfolio|project|work)/.test(text)) {
    return "The portfolio is organised into Wings Projects, Motion Design Lab, and Visual Design Archive. A strong starting point is Through the Eyes of Football for motion work, The Dream Pursuit for trailer storytelling, or Global Race for poster design. What kind of work would you like to explore?";
  }
  return "I’m WF Assist, here to help you explore Pratyaksh Kumar’s motion-design and visual-design portfolio. I can recommend projects, explain creative services, or help you shape a project enquiry. What would you like to know?";
}

const weatherDescriptions = {
  0: "clear skies", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "rain showers", 82: "heavy rain showers", 95: "a thunderstorm", 96: "a thunderstorm with hail", 99: "a severe thunderstorm with hail",
};

async function fetchLiveWeather(city) {
  const location = String(city || "").trim().slice(0, 100);
  if (!location) throw new Error("Please tell me the city or region for the weather.");
  let placeResponse;
  try {
    placeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, { signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new Error("The live weather provider could not be reached right now. Please try again shortly.");
  }
  if (!placeResponse.ok) throw new Error("The weather location service is unavailable right now.");
  const place = (await placeResponse.json()).results?.[0];
  if (!place) throw new Error(`I could not find “${location}”. Please try a city and country name.`);
  let forecastResponse;
  try {
    forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`, { signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new Error("The live weather provider could not be reached right now. Please try again shortly.");
  }
  if (!forecastResponse.ok) throw new Error("The live weather service is unavailable right now.");
  const current = (await forecastResponse.json()).current;
  return {
    location: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    wind: current.wind_speed_10m,
    condition: weatherDescriptions[current.weather_code] || "current conditions",
    observedAt: current.time,
    isDay: Boolean(current.is_day),
  };
}

async function fetchLiveNews(query) {
  const topic = String(query || "world news").trim().slice(0, 120) || "world news";
  const endpoint = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(topic)}&mode=ArtList&format=json&maxrecords=4&sort=HybridRel`;
  let newsResponse;
  try {
    newsResponse = await fetch(endpoint, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error("The live news provider could not be reached right now. Please try again shortly.");
  }
  if (!newsResponse.ok) throw new Error("The live news service is unavailable right now.");
  const payload = await newsResponse.json();
  const articles = (payload.articles || []).slice(0, 4).map((article) => ({
    title: String(article.title || "Untitled report").slice(0, 300),
    source: String(article.domain || article.sourceCountry || "source").slice(0, 120),
    url: String(article.url || ""),
    seenAt: String(article.seendate || ""),
  }));
  if (!articles.length) throw new Error(`I could not find a current news snapshot for “${topic}”. Try a more specific topic.`);
  return { topic, articles };
}

async function answerWithAi(history, voice) {
  if (!openAiKey) return { reply: fallbackAnswer(history.at(-1)?.content || ""), source: "portfolio-guide" };

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiModel,
      instructions: assistantInstructions,
      input: history,
      max_output_tokens: voice ? 300 : 650,
      temperature: 0.6,
      store: false,
    }),
  });

  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    console.error("AI provider error:", apiResponse.status, detail.slice(0, 500));
    throw new Error("WF Assist is temporarily unavailable. Please try again shortly or email pratyakshkumar095@gmail.com.");
  }
  const payload = await apiResponse.json();
  const reply = outputText(payload);
  if (!reply) throw new Error("WF Assist did not return an answer. Please try again.");
  return { reply, source: "ai" };
}

async function transcribeAudio(audio, contentType) {
  if (!openAiKey) throw new Error("Voice transcription needs a configured AI key. You can type your question, or ask the site owner to enable secure voice transcription.");
  const form = new FormData();
  form.set("model", transcriptionModel);
  form.set("file", new Blob([audio], { type: contentType || "audio/webm" }), "wf-voice-message.webm");
  const apiResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openAiKey}` },
    body: form,
  });
  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    console.error("Transcription provider error:", apiResponse.status, detail.slice(0, 500));
    throw new Error("Voice transcription is temporarily unavailable. Please try again or type your question.");
  }
  const payload = await apiResponse.json();
  const transcript = String(payload.text || "").trim();
  if (!transcript) throw new Error("I could not hear a clear question. Please try again a little closer to the microphone.");
  return transcript;
}

async function generateSpeech(text) {
  if (!openAiKey) throw new Error("Natural AI voice is not configured.");
  const apiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: textToSpeechModel,
      voice: textToSpeechVoice,
      input: String(text).slice(0, 4_000),
      response_format: "mp3",
      instructions: "Speak warmly, naturally, calmly, and conversationally. You are a creative portfolio consultant, not an announcer. Use natural pacing and clear articulation.",
    }),
  });
  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    console.error("Text-to-speech provider error:", apiResponse.status, detail.slice(0, 500));
    throw new Error("Natural AI voice is temporarily unavailable.");
  }
  return Buffer.from(await apiResponse.arrayBuffer());
}

function sendAudio(response, audio, origin) {
  setSecurityHeaders(response);
  response.statusCode = 200;
  response.setHeader("Content-Type", "audio/mpeg");
  response.setHeader("Cache-Control", "no-store");
  if (origin && originAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(audio);
}

function sendSdp(response, sdp, origin) {
  setSecurityHeaders(response);
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/sdp; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  if (origin && originAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(sdp);
}

async function createRealtimeSession(sdp) {
  if (!openAiKey) throw new Error("Live voice needs a configured OPENAI_API_KEY.");
  if (!sdp || !sdp.includes("v=0")) throw new Error("The browser did not provide a valid realtime audio offer.");

  const session = {
    type: "realtime",
    model: realtimeModel,
    output_modalities: ["audio"],
    audio: {
      input: { transcription: { model: realtimeTranscriptionModel, language: "en", delay: "low" } },
      output: { voice: realtimeVoice },
    },
    instructions: `${assistantInstructions}\n\nThis is a live, speech-to-speech creative consultation. Keep replies warm, concise, and naturally conversational. Never claim to be human.`,
  };
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));
  const apiResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openAiKey}` },
    body: form,
  });
  if (!apiResponse.ok) {
    const detail = await apiResponse.text();
    console.error("Realtime provider error:", apiResponse.status, detail.slice(0, 500));
    throw new Error("Live voice could not connect. Please use the secure voice fallback or check that the realtime model is enabled for this API key.");
  }
  return apiResponse.text();
}

async function handleLead(payload) {
  const lead = {
    name: String(payload.name || "").trim().slice(0, 100),
    company: String(payload.company || "").trim().slice(0, 160),
    email: String(payload.email || "").trim().slice(0, 160),
    country: String(payload.country || "").trim().slice(0, 100),
    project: String(payload.project || "").trim().slice(0, 1_500),
    timeline: String(payload.timeline || "").trim().slice(0, 200),
    source: "WF Assist website widget",
    receivedAt: new Date().toISOString(),
  };
  if (!lead.name || !/^\S+@\S+\.\S+$/.test(lead.email) || !lead.project) {
    throw new Error("Please provide your name, a valid email address, and a short project description.");
  }
  if (!leadWebhook) return { submitted: false };

  const webhookResponse = await fetch(leadWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!webhookResponse.ok) throw new Error("The contact service could not accept your request. Please email pratyakshkumar095@gmail.com directly.");
  return { submitted: true };
}

async function serveStatic(request, response) {
  const requestPath = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = resolve(root, `.${safePath}`);
  if (!filePath.startsWith(`${root}${sep}`) || safePath.includes("..") || safePath.startsWith("/.")) {
    setSecurityHeaders(response);
    response.statusCode = 404;
    response.end("Not found");
    return;
  }
  try {
    const file = await readFile(filePath);
    setSecurityHeaders(response);
    response.statusCode = 200;
    response.setHeader("Content-Type", mimeTypes[extname(filePath)] || "application/octet-stream");
    response.setHeader("Cache-Control", ["/wf-assist-widget.js", "/index.html"].includes(safePath) ? "no-cache" : "public, max-age=3600");
    response.end(file);
  } catch {
    setSecurityHeaders(response);
    response.statusCode = 404;
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "Origin not allowed." }, origin);
    setSecurityHeaders(response);
    response.statusCode = 204;
    if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Max-Age", "86400");
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/wf-weather") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before requesting another weather update." }, origin);
    try {
      const weather = await fetchLiveWeather(url.searchParams.get("city"));
      sendJson(response, 200, weather, origin);
    } catch (error) {
      console.error("WF live weather failed:", error.message);
      sendJson(response, 400, { error: error.message || "Weather is unavailable." }, origin);
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/wf-news") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before requesting another news update." }, origin);
    try {
      const news = await fetchLiveNews(url.searchParams.get("topic"));
      sendJson(response, 200, news, origin);
    } catch (error) {
      console.error("WF live news failed:", error.message);
      sendJson(response, 400, { error: error.message || "News is unavailable." }, origin);
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/wf-config") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    // This deliberately reveals only feature availability, never provider credentials or configuration values.
    sendJson(response, 200, {
      secureTranscription: Boolean(openAiKey),
      naturalSpeech: Boolean(openAiKey),
      realtimeVoice: Boolean(openAiKey),
      browserFallback: true,
    }, origin);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wf-assist") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before sending another message." }, origin);
    try {
      const body = await readJson(request);
      const history = cleanHistory(body.messages);
      if (!history.length || history.at(-1).role !== "user") throw new Error("Please send a question for WF Assist.");
      const result = await answerWithAi(history, Boolean(body.voice));
      sendJson(response, 200, result, origin);
    } catch (error) {
      console.error("WF Assist request failed:", error.message);
      sendJson(response, 400, { error: error.message || "Something went wrong. Please try again." }, origin);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wf-realtime-session") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before starting another live voice session." }, origin);
    try {
      const offer = (await readBytes(request, 150_000)).toString("utf8");
      const answer = await createRealtimeSession(offer);
      sendSdp(response, answer, origin);
    } catch (error) {
      console.error("WF Assist realtime session failed:", error.message);
      sendJson(response, 400, { error: error.message || "Live voice could not start." }, origin);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wf-transcribe") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before sending another voice message." }, origin);
    try {
      const audio = await readBytes(request);
      const transcript = await transcribeAudio(audio, request.headers["content-type"]);
      sendJson(response, 200, { transcript }, origin);
    } catch (error) {
      console.error("WF Assist transcription failed:", error.message);
      sendJson(response, 400, { error: error.message || "Voice transcription failed." }, origin);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wf-speech") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before requesting another reply." }, origin);
    try {
      const body = await readJson(request, 10_000);
      const message = String(body.text || "").trim();
      if (!message) throw new Error("No reply text was provided.");
      const audio = await generateSpeech(message);
      sendAudio(response, audio, origin);
    } catch (error) {
      console.error("WF Assist speech failed:", error.message);
      sendJson(response, 400, { error: error.message || "Natural voice is unavailable." }, origin);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wf-lead") {
    if (origin && !originAllowed(origin)) return sendJson(response, 403, { error: "This website is not approved to use WF Assist." }, origin);
    if (!requestIsAllowed(request)) return sendJson(response, 429, { error: "Please wait a moment before sending another request." }, origin);
    try {
      const body = await readJson(request);
      const result = await handleLead(body);
      sendJson(response, 200, result, origin);
    } catch (error) {
      console.error("WF lead request failed:", error.message);
      sendJson(response, 400, { error: error.message || "We could not process that request." }, origin);
    }
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: "Method not allowed." }, origin);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`WF Assist is running at http://localhost:${port}`);
  console.log(openAiKey ? `AI mode: ${openAiModel}` : "AI mode: portfolio guide fallback (set OPENAI_API_KEY for GPT responses)");
  console.log(openAiKey ? `Voice mode: realtime (${realtimeModel}/${realtimeVoice}) + secure transcription (${transcriptionModel}) + AI speech (${textToSpeechModel}/${textToSpeechVoice})` : "Voice mode: browser speech fallback only (set OPENAI_API_KEY for live realtime voice, secure transcription, and natural AI speech)");
  if (!leadWebhook) console.log("Lead delivery: not configured (set LEAD_WEBHOOK_URL to send enquiries)");
});
