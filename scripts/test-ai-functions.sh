#!/usr/bin/env bash
# scripts/test-ai-functions.sh
# Smoke-tests the three AI edge functions end-to-end against the deployed Supabase project.
# - chat: baseline; proves the deploy/auth path is healthy
# - classify-occurrence: new
# - analyze-document: new
#
# Each call is classified into one of:
#   PASS                  — 200 with the expected payload field
#   FAIL: not deployed    — 404/405 (function name unknown to the gateway)
#   FAIL: auth            — 401 (anon JWT rejected → check verify_jwt config)
#   FAIL: secret missing  — 5xx with "key" / "not configured" in error body
#   FAIL: server error    — other 5xx
#   FAIL: bad shape       — 200 but missing the expected field
#
# Re-run after each change. Exits non-zero with the count of failures.

set -uo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Read URL + anon key from src/supabase-client.ts — that's the source of truth
# the running app uses (it does NOT read from .env; .env points to a different/stale project).
CLIENT=src/supabase-client.ts
if [ ! -f "$CLIENT" ]; then
  echo -e "${RED}ERROR: $CLIENT not found. Run from repo root.${NC}"
  exit 2
fi
SUPABASE_URL=$(grep -oE 'https://[a-z0-9]+\.supabase\.co' "$CLIENT" | head -1)
ANON_KEY=$(grep -oE '"eyJ[A-Za-z0-9._-]+"' "$CLIENT" | head -1 | tr -d '"')
if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo -e "${RED}ERROR: could not extract URL or anon key from $CLIENT${NC}"
  exit 2
fi

echo -e "${BLUE}== AI edge function smoke tests ==${NC}"
echo "URL: $SUPABASE_URL"
echo

PASS=0; FAIL=0
HINTS=()

# ── Preflight: can the locally-authenticated CLI account deploy to this project? ──
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://||; s|\.supabase\.co.*||')
preflight=$(npx --no-install supabase functions list --project-ref "$PROJECT_REF" 2>&1 || true)
if echo "$preflight" | grep -q '403'; then
  echo -e "${YELLOW}WARN${NC} Supabase CLI is authenticated, but that account is NOT authorized to deploy to project ${PROJECT_REF}."
  echo "      Symptom: \`supabase functions list/deploy\` returns 403. The smoke tests below will all show as not-deployed."
  echo "      Fix: run \`npx supabase login\` with the account that owns the project (likely a teammate's account)."
  echo
elif echo "$preflight" | grep -qiE 'access token not provided|please.*login|not.*logged'; then
  echo -e "${YELLOW}WARN${NC} Supabase CLI is not logged in. Run: npx supabase login"
  echo
fi

# Args: name, status, body, expected_field
classify() {
  local name="$1" status="$2" body="$3" expect="$4"

  case "$status" in
    200)
      if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$expect' in d and d['$expect'] is not None else 1)" 2>/dev/null; then
        echo -e "  ${GREEN}PASS${NC}  $name (200 with .$expect)"
        PASS=$((PASS+1))
        return 0
      fi
      # 200 with an explicit error field (function returned shaped error)
      if echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'error' in d else 1)" 2>/dev/null; then
        local err
        err=$(echo "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("error",""))' 2>/dev/null)
        echo -e "  ${RED}FAIL${NC}  $name — 200 but error body: ${err}"
        FAIL=$((FAIL+1))
        return 1
      fi
      echo -e "  ${RED}FAIL${NC}  $name — 200 missing .$expect; body[:200]: ${body:0:200}"
      FAIL=$((FAIL+1))
      return 1
      ;;
    404|405)
      echo -e "  ${RED}FAIL${NC}  $name — not deployed (HTTP $status)"
      HINTS+=("npx supabase functions deploy $name${name:+$([ "$name" = "classify-occurrence" ] && echo " --no-verify-jwt")}")
      FAIL=$((FAIL+1))
      return 1
      ;;
    401|403)
      echo -e "  ${RED}FAIL${NC}  $name — auth rejected (HTTP $status). For classify-occurrence this means verify_jwt didn't propagate; redeploy with --no-verify-jwt."
      HINTS+=("npx supabase functions deploy $name --no-verify-jwt   # if pre-signup function")
      FAIL=$((FAIL+1))
      return 1
      ;;
    5*)
      local err
      err=$(echo "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("error","<no error field>"))' 2>/dev/null || echo "${body:0:200}")
      if echo "$err" | grep -qiE 'api[_ -]?key|not configured|unauthorized|invalid.*key|401|x-api-key'; then
        echo -e "  ${RED}FAIL${NC}  $name — server-side key not configured: ${err}"
        case "$name" in
          analyze-document)    HINTS+=("npx supabase secrets set ANTHROPIC_API_KEY=<paste>") ;;
          classify-occurrence) HINTS+=("npx supabase secrets set GEMINI_API_KEY=<paste>") ;;
        esac
      else
        echo -e "  ${RED}FAIL${NC}  $name — HTTP $status: ${err}"
      fi
      FAIL=$((FAIL+1))
      return 1
      ;;
    *)
      echo -e "  ${RED}FAIL${NC}  $name — unexpected HTTP $status; body[:200]: ${body:0:200}"
      FAIL=$((FAIL+1))
      return 1
      ;;
  esac
}

invoke() {
  local name="$1" payload="$2" expect="$3" extra_summary="${4:-}"
  echo -e "${BLUE}→ $name${NC}"
  local resp status body
  resp=$(curl -sS --max-time 60 -w '\n__STATUS__%{http_code}' \
    -X POST "$SUPABASE_URL/functions/v1/$name" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
  status=$(echo "$resp" | tail -1 | sed 's/__STATUS__//')
  body=$(echo "$resp" | sed '$d')
  classify "$name" "$status" "$body" "$expect"
  if [ "$status" = "200" ] && [ -n "$extra_summary" ]; then
    echo "$body" | python3 -c "$extra_summary" 2>/dev/null || true
  fi
  echo
}

# ── 1. baseline ─────────────────────────────────────────────────────────────
invoke "chat" \
  '{"messages":[{"role":"user","content":"ping"}]}' \
  "reply" \
  'import sys,json; d=json.load(sys.stdin); print("       reply:", (d.get("reply","") or "")[:80])'

# ── 2. classify-occurrence ──────────────────────────────────────────────────
invoke "classify-occurrence" \
  '{"titulo":"Fuga de água na garagem"}' \
  "result" \
  'import sys,json; d=json.load(sys.stdin); r=d.get("result",{}); print(f"       categoria={r.get(\"categoria\")}  prioridade={r.get(\"prioridade\")}")'

# ── 3. analyze-document (1×1 PNG so the call is well-formed) ────────────────
TINY_PNG_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
invoke "analyze-document" \
  "{\"fileBase64\":\"$TINY_PNG_B64\",\"mediaType\":\"image/png\",\"fileName\":\"smoke.png\"}" \
  "extraction" \
  'import sys,json; d=json.load(sys.stdin); e=d.get("extraction",{}); print(f"       tipo={e.get(\"tipo_documento\")}  categoria={e.get(\"categoria\")}")'

# ── summary ─────────────────────────────────────────────────────────────────
echo -e "${BLUE}== Result ==${NC}"
echo -e "Passed: ${GREEN}${PASS}${NC}   Failed: ${RED}${FAIL}${NC}"

if [ ${#HINTS[@]} -gt 0 ]; then
  echo
  echo -e "${YELLOW}Next steps — append \`--project-ref ${PROJECT_REF}\` to each:${NC}"
  printf '  - %s\n' "${HINTS[@]}" | awk '!seen[$0]++'
fi

exit $FAIL
