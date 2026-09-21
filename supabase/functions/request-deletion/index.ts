// Törlési megerősítő kód kérése: hatjegyű kódot generál, hash-elve tárolja (deletion_codes),
// és a Resend API-val elküldi a fiók e-mail címére. A törlő SQL-függvények csak ezzel a kóddal futnak.
// Titkok: RESEND_API_KEY (kötelező), RESEND_FROM (feladó; alapból a hitelesített matecska@mail.apasupa.com).
// A válaszcím (Reply-To) az ideiglenes fogadó cím, ivanyi.almos@gmail.com.
// Telepítés: Supabase MCP deploy_edge_function vagy `supabase functions deploy request-deletion`.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const EXPIRES_SEC = 10 * 60;
const MIN_INTERVAL_SEC = 60;
const REPLY_TO = "ivanyi.almos@gmail.com";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigits(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST kell" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ?? "Matecska <matecska@mail.apasupa.com>";
  if (!resendKey) return json(500, { error: "RESEND_API_KEY nincs beállítva" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user?.email) return json(401, { error: "nincs bejelentkezve" });

  let body: { kind?: string; playerId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "hibás kérés" });
  }
  const kind = body.kind === "player" ? "player" : body.kind === "account" ? "account" : null;
  if (!kind) return json(400, { error: "kind: account vagy player" });

  const admin = createClient(url, service);
  let targetId: string | null = null;
  let playerName: string | null = null;
  if (kind === "player") {
    if (!body.playerId) return json(400, { error: "playerId kell" });
    const { data: player } = await admin.from("players").select("id, name").eq("id", body.playerId).eq("owner_id", user.id).maybeSingle();
    if (!player) return json(404, { error: "nincs ilyen játékos" });
    targetId = player.id;
    playerName = player.name;
  }

  // Percenként legfeljebb egy kód, hogy ne lehessen vele levelet szórni.
  const { data: last } = await admin
    .from("deletion_codes")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last && Date.now() - new Date(last.created_at).getTime() < MIN_INTERVAL_SEC * 1000) {
    return json(429, { error: "túl gyakori kérés", retryAfterSec: MIN_INTERVAL_SEC });
  }

  const code = sixDigits();
  const codeHash = await sha256Hex(`${code}:${user.id}`);
  const expiresAt = new Date(Date.now() + EXPIRES_SEC * 1000).toISOString();
  const { error: insertError } = await admin
    .from("deletion_codes")
    .insert({ user_id: user.id, kind, target_id: targetId, code_hash: codeHash, expires_at: expiresAt });
  if (insertError) return json(500, { error: "a kód mentése nem sikerült" });

  const what = kind === "account" ? "a Matecska-fiókod és minden játékos törlését" : `„${playerName}” játékos törlését`;
  const subject = kind === "account" ? `Matecska – fiók törlésének megerősítése: ${code}` : `Matecska – játékos törlésének megerősítése: ${code}`;
  const text = `Valaki ${what} kezdeményezte az alkalmazásban.\n\nA megerősítő kód: ${code}\n\nA kód 10 percig érvényes, és csak egyszer használható. Ha nem te kérted, hagyd figyelmen kívül ezt a levelet: kód nélkül semmi nem törlődik.`;
  const html = `<p>Valaki <strong>${what}</strong> kezdeményezte az alkalmazásban.</p><p>A megerősítő kód:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>A kód 10 percig érvényes, és csak egyszer használható.<br>Ha nem te kérted, hagyd figyelmen kívül ezt a levelet: kód nélkül semmi nem törlődik.</p>`;

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [user.email], reply_to: REPLY_TO, subject, text, html }),
  });
  if (!sent.ok) {
    const detail = await sent.text();
    console.error("Resend hiba", sent.status, detail);
    return json(502, { error: "a levél küldése nem sikerült" });
  }
  return json(200, { ok: true, expiresInSec: EXPIRES_SEC });
});
