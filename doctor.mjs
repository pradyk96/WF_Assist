import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (!existsSync(envPath)) {
  console.error("WF Assist check: .env is missing. Copy .env.example to .env in this folder, then add your new private OpenAI key.");
  process.exit(1);
}

const env = readFileSync(envPath, "utf8");
if (/^\{\\rtf/i.test(env.trim())) {
  console.error("WF Assist check: .env appears to be Rich Text Format. Recreate it with nano .env or a plain-text editor; do not save it as rich text.");
  process.exit(1);
}

const key = env.match(/^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, "");
if (!key || /replace_with|your_new|your_key_here|sk-proj-your/i.test(key)) {
  console.error("WF Assist check: OPENAI_API_KEY is still a placeholder. Replace only the text after OPENAI_API_KEY= in .env, then save.");
  process.exit(1);
}
if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
  console.error("WF Assist check: OPENAI_API_KEY does not look like an OpenAI secret key. Do not paste the key in chat; replace it locally in .env.");
  process.exit(1);
}

console.log("WF Assist check: .env is plain text and contains a non-placeholder OpenAI key. Run npm run dev, then open /api/wf-health for a connection check.");
