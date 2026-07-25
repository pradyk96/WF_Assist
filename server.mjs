import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 5173);
const root = resolve(process.cwd());
const openAiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const leadWebhook = process.env.LEAD_WEBHOOK_URL;
const requestWindowMs = 60_000;
const requestLimit = 24;
const requestLog = new Map();

const portfolioContext = `
WF (formerly Wings Forever) is the portfolio of Pratyaksh Kumar, an independent freelance visual and motion designer based in Vilnius, Lithuania. WF works remotely with clients and collaborators.

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

const assistantInstructions = `You are WF Assist, the friendly official portfolio assistant for WF (formerly Wings Forever), Pratyaksh Kumar’s freelance motion-design and visual-design portfolio.

Your goals are to help visitors understand the portfolio, find relevant projects, explain services in clear terms, help a potential client frame a brief, and guide qualified enquiries toward contact. Be professional, creative, clear, warm, and never robotic. Adapt to business, technical, student, and casual visitors.

Use the approved portfolio context below as the factual source. Answer normal general questions helpfully, but never present unknown portfolio facts as true. If a visitor asks for pricing, availability, a delivery guarantee, a private project detail, or anything not in the approved context, say that it depends on the brief and offer a tailored enquiry. Do not invent rates, deadlines, clients, tool use, results, or personal details. Do not state or imply 100% uptime or any guarantee.

When explaining a creative or technical term, give a concise plain-language answer first and offer deeper detail if useful. For a project recommendation, name one or two relevant projects and explain why they match. If somebody is ready to hire, explain the relevant capability, ask for the project type, desired outcome, country/time zone if relevant, approximate timeline, and an estimated scope or budget only if they are comfortable sharing it. Keep data collection conversational and never request passwords, payment data, or sensitive personal information.

If the visitor asks outside the design / portfolio scope, you may answer briefly if it is harmless, then gently bring the conversation back to WF when relevant. For legal, payment, privacy, or account matters, say that a human should handle it and direct them to the contact email. Respect copyrights: do not reproduce protected work or say WF owns third-party brands or films.

Formatting: use short paragraphs or compact bullets where they improve readability. No markdown tables. Voice replies must be 2–5 short sentences, with no long list. End naturally with one useful next question when it will help the visitor move forward.

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

async function readJson(request, maxBytes = 30_000) {
  let size = 0;
  let raw = "";
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request is too large.");
    raw += chunk;
  }
  try { return JSON.parse(raw || "{}"); } catch { throw new Error("The request body must be valid JSON."); }
}

function cleanHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-12)
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2_000) }))
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
    response.setHeader("Cache-Control", safePath === "/wf-assist-widget.js" ? "no-cache" : "public, max-age=3600");
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
  if (!leadWebhook) console.log("Lead delivery: not configured (set LEAD_WEBHOOK_URL to send enquiries)");
});
