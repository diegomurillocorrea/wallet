#!/usr/bin/env node
/**
 * Verificación SQL post-migración (requiere DATABASE_PASSWORD en .env).
 * Uso: node scripts/verify-schema.mjs
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(root, ".env")
const pw = fs.readFileSync(envPath, "utf8").match(/^DATABASE_PASSWORD=(.*)$/m)?.[1]?.trim()
if (!pw) {
  console.error("Falta DATABASE_PASSWORD en .env")
  process.exit(1)
}

const conn =
  "postgresql://postgres.osrdlsvbjqyuafmqkqof@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"

const sql = `
select
  (select to_regclass('public.budget_limits') is not null) as has_budget_limits,
  (select to_regclass('public.user_settings') is not null) as has_user_settings,
  (select count(*) = 0 from public.budget_limits where month_start = '2000-01-01') as no_anchor_2000,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='budgets' and column_name in ('amount_limit','month_start')) = 0 as no_budget_mirrors,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='credit_cards' and column_name='pan') = 0 as no_pan,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='credit_cards' and column_name='bin') = 1 as has_bin;
`

const out = execFileSync("psql", [conn, "-c", sql], {
  env: { ...process.env, PGPASSWORD: pw },
  encoding: "utf8",
})
console.log(out)

const dataLine = out
  .split("\n")
  .map((l) => l.trim())
  .find((l) => /^t\s/.test(l) || /^\s*t\s+\|/.test(l))

if (!dataLine || dataLine.split("|").some((cell) => cell.trim() === "f")) {
  console.error("Verificación falló")
  process.exit(1)
}
console.log("OK schema verify")
