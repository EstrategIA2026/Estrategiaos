import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Company, LeadsData, Person } from "@/lib/leads/types";

/**
 * Camada de leitura do mini CRM.
 *
 * Em modo `supabase` (producao): le o card `validacao/leads` no Supabase e
 * faz o parse do body Markdown em entradas estruturadas.
 *
 * Em modo `file` (dev/local sem Supabase): le o arquivo `data/leads.json`.
 *
 * Server-only — `fs` e `createClient` sao server-side.
 *
 * As paginas de leads/oportunidades sao `dynamic = "force-dynamic"`, entao a
 * leitura acontece a cada request e reflete a base assim que os agentes gravam.
 */

const DATA_FILE = path.join(process.cwd(), "data", "leads.json");

const EMPTY: LeadsData = { companies: [], people: [] };

/** Lê e faz o parse do arquivo de leads; devolve base vazia se ainda nao existe. */
function loadFile(): LeadsData {
  if (!existsSync(DATA_FILE)) return EMPTY;
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LeadsData>;
    return {
      companies: parsed.companies ?? [],
      people: parsed.people ?? [],
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Carrega o card `validacao/leads` e faz o parse do body Markdown.
 * Cada lead é uma secao `## {Nome}` no formato usado por `renderLeadsBlock`.
 */
async function loadSupabase(): Promise<LeadsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: row } = await supabase
    .from("content_entities")
    .select("body, frontmatter")
    .eq("user_id", user.id)
    .eq("entity_id", "validacao/leads")
    .maybeSingle();

  if (!row?.body) return EMPTY;
  return parseLeadsMarkdown(row.body);
}

/** Parse simples de Markdown do tipo `## Nome\n...Fonte: url\n...` em entries. */
function parseLeadsMarkdown(body: string): LeadsData {
  const companies: Company[] = [];
  const people: Person[] = [];

  // Divide em secoes por `## `. Cada secao e um lead (ou um intro).
  // Body sempre comeca com `## ` (primeira secao), entao a primeira leva
  // o prefixo `## ` que precisa ser removido do titulo.
  const sections = body.split(/\n##\s+/).filter(Boolean);
  for (const section of sections) {
    const lines = section.split("\n");
    const title = (lines[0]?.trim() ?? "").replace(/^#+\s*/, "");
    if (!title) continue;

    // === Formato Hunter: `## Nome — Empresa\nCargo: ...\nEmail: ...\nLinkedIn: ...`
    const companyLine = lines.find((l) => l.startsWith("— "));
    if (companyLine) {
      const companyName = companyLine.replace(/^—\s*/, "").trim();
      const position =
        lines.find((l) => l.startsWith("Cargo:"))?.replace(/^Cargo:\s*/, "").trim() ??
        undefined;
      const email =
        lines.find((l) => l.startsWith("Email:"))?.replace(/^Email:\s*/, "").trim() ??
        undefined;
      const linkedin =
        lines.find((l) => l.startsWith("LinkedIn:"))?.replace(/^LinkedIn:\s*/, "").trim() ??
        undefined;
      const sourceLine = lines.find((l) => l.startsWith("_("));
      const source =
        sourceLine?.match(/_\(([^·]+)·/)?.[1]?.trim() ?? "Hunter.io";

      const personId = slugify(title);
      const companyId = slugify(companyName);
      const now = new Date().toISOString();

      people.push({
        id: personId,
        name: title,
        role: position,
        email,
        linkedin,
        companyId,
        source,
        addedAt: now,
      });
      if (!companies.find((c) => c.id === companyId)) {
        companies.push({
          id: companyId,
          name: companyName,
          source,
          stage: "new",
          addedAt: now,
        });
      }
      continue;
    }

    // === Formato Tavily antigo: `## Nome\n...\nFonte: url\n...Contatos: ...`
    const isPF = /PF/i.test(section);
    const kind: "PJ" | "PF" = isPF ? "PF" : "PJ";
    const fonteLine = lines.find((l) => l.startsWith("Fonte:"));
    const url = fonteLine?.replace(/^Fonte:\s*/, "").trim() ?? "";
    const summary = lines
      .slice(1)
      .filter(
        (l) =>
          l.trim().length > 0 &&
          !l.startsWith("Fonte:") &&
          !l.startsWith("Contatos:") &&
          !l.startsWith("_("),
      )
      .join(" ")
      .trim()
      .slice(0, 400);

    const contatosLine = lines.find((l) => l.startsWith("Contatos:"));
    const contacts = (contatosLine ?? "")
      .replace(/^Contatos:\s*/, "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const id = slugify(title);

    if (kind === "PF") {
      for (const contact of contacts) {
        const cname = contact.split("(")[0]?.trim() ?? contact;
        const role = /\(([^)]+)\)/.exec(contact)?.[1] ?? undefined;
        const pid = slugify(cname);
        people.push({
          id: pid,
          name: cname,
          role,
          companyId: slugify(title),
          source: "Tavily + Claude Sonnet 5",
          addedAt: new Date().toISOString(),
        });
      }
      const cid = slugify(title);
      if (!companies.find((c) => c.id === cid)) {
        companies.push({
          id: cid,
          name: title,
          source: url || "Tavily + Claude Sonnet 5",
          stage: "new",
          addedAt: new Date().toISOString(),
          note: summary,
        });
      }
    } else {
      companies.push({
        id,
        name: title,
        source: url || "Tavily + Claude Sonnet 5",
        stage: "new",
        addedAt: new Date().toISOString(),
        note: summary,
      });
    }
  }

  return { companies, people };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function load(): Promise<LeadsData> {
  if (config.CONTENT_STORE === "supabase") {
    try {
      return await loadSupabase();
    } catch {
      return EMPTY;
    }
  }
  return loadFile();
}

/** Todas as empresas (PJ) do CRM. */
export async function listCompanies(): Promise<Company[]> {
  return (await load()).companies;
}

/** Todas as pessoas (PF/contatos) do CRM. */
export async function listPeople(): Promise<Person[]> {
  return (await load()).people;
}

/** Empresa por id, ou `undefined`. */
export async function getCompany(id: string): Promise<Company | undefined> {
  return (await load()).companies.find((c) => c.id === id);
}

/** Contatos (pessoas) de uma empresa. */
export async function peopleOfCompany(companyId: string): Promise<Person[]> {
  return (await load()).people.filter((p) => p.companyId === companyId);
}

/** Contagem por estagio do funil (PJ primeiro). */
export async function countByStageCompanies(): Promise<Record<string, number>> {
  const { companies } = await load();
  const counts: Record<string, number> = {
    new: 0,
    qualified: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  };
  for (const c of companies) counts[c.stage ?? "new"] = (counts[c.stage ?? "new"] ?? 0) + 1;
  return counts;
}
