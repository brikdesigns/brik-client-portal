#!/usr/bin/env bash
set -euo pipefail

# Brik Client Portal — Design Token Compliance Audit
# Run from project root: ./scripts/token-audit.sh
#
# Scans src/ for hardcoded values that should use BDS design tokens.
# Exit code 0 = clean, 1 = violations found (useful for CI gates)

SRC="src"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
DIM='\033[2m'
NC='\033[0m'
VIOLATIONS=0

section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }
count_matches() { echo "$1" | grep -c "." 2>/dev/null || echo 0; }

# ── 1. Hardcoded colors ─────────────────────────────────────────────
section "Hardcoded colors (hex outside var() fallbacks)"

# Find hex colors NOT preceded by a comma+space (which indicates a var() fallback)
# Exclude: email.ts (HTML emails can't use CSS vars), SVG references, comments
COLOR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "'#[0-9a-fA-F]{3,8}'" "$SRC" \
  | grep -v "email\.ts" \
  | grep -v "\.svg" \
  | grep -v "// " \
  | grep -v "var(--" \
  || true)

COLOR_COUNT=$(count_matches "$COLOR_HITS")
if [ "$COLOR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${COLOR_COUNT} hardcoded hex colors${NC}"
  echo "$COLOR_HITS" | head -10
  [ "$COLOR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((COLOR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + COLOR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 2. Hardcoded rgba/rgb ───────────────────────────────────────────
section "Hardcoded rgba/rgb values"

RGBA_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "rgba?\([0-9]" "$SRC" \
  | grep -v "email\.ts" \
  | grep -v "// " \
  || true)

RGBA_COUNT=$(count_matches "$RGBA_HITS")
if [ "$RGBA_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${RGBA_COUNT} hardcoded rgba/rgb values${NC}"
  echo "$RGBA_HITS" | head -5
  VIOLATIONS=$((VIOLATIONS + RGBA_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 3. Native <button> instead of BDS Button ────────────────────────
section "Native <button> (should be BDS Button)"

BUTTON_HITS=$(grep -rn --include="*.tsx" \
  -E "<button[ >]" "$SRC" \
  | grep -v "// " \
  || true)

BUTTON_COUNT=$(count_matches "$BUTTON_HITS")
if [ "$BUTTON_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${BUTTON_COUNT} native <button> elements${NC}"
  echo "$BUTTON_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + BUTTON_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 4. Raw <a href> instead of Next.js Link / BDS TextLink ──────────
section "Raw <a href> (should be Next.js Link or BDS TextLink)"

LINK_HITS=$(grep -rn --include="*.tsx" \
  -E '<a\s+href=' "$SRC" \
  | grep -v "email\.ts" \
  | grep -v "// " \
  || true)

LINK_COUNT=$(count_matches "$LINK_HITS")
if [ "$LINK_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${LINK_COUNT} raw <a> tags${NC}"
  echo "$LINK_HITS" | head -10
  [ "$LINK_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((LINK_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + LINK_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 5. Hardcoded border-radius ───────────────────────────────────────
section "Hardcoded borderRadius (should use var(--_border-radius--*))"

BR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "borderRadius:\s*['\"][0-9]+" "$SRC" \
  | grep -v "var(--" \
  || true)

BR_COUNT=$(count_matches "$BR_HITS")
if [ "$BR_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${BR_COUNT} hardcoded borderRadius values${NC}"
  echo "$BR_HITS" | head -10
  VIOLATIONS=$((VIOLATIONS + BR_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 6. Hardcoded font-family ─────────────────────────────────────────
section "Hardcoded fontFamily (should use var(--_typography---font-family--*))"

FONT_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "fontFamily:\s*'" "$SRC" \
  | grep -v "var(--" \
  || true)

FONT_COUNT=$(count_matches "$FONT_HITS")
if [ "$FONT_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${FONT_COUNT} hardcoded fontFamily values${NC}"
  echo "$FONT_HITS" | head -5
  VIOLATIONS=$((VIOLATIONS + FONT_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 7. Inline px spacing (high-volume — report count only) ──────────
section "Hardcoded px in spacing props (gap, padding, margin)"

SPACING_PROPS="(gap|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|margin|marginTop|marginBottom|marginLeft|marginRight)"
SPACING_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "${SPACING_PROPS}:\s*'[0-9]+px" "$SRC" \
  | grep -v "var(--" \
  || true)

SPACING_COUNT=$(count_matches "$SPACING_HITS")
if [ "$SPACING_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${SPACING_COUNT} hardcoded px spacing values${NC}"
  # Group by file for overview
  echo "$SPACING_HITS" | sed 's/:.*$//' | sort | uniq -c | sort -rn | head -10
  echo -e "  ${DIM}(Top 10 files by violation count)${NC}"
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 8. Hardcoded fontSize ────────────────────────────────────────────
section "Hardcoded fontSize (should use var(--_typography---*))"

FS_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "fontSize:\s*'[0-9]+px'" "$SRC" \
  | grep -v "var(--" \
  || true)

FS_COUNT=$(count_matches "$FS_HITS")
if [ "$FS_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}${FS_COUNT} hardcoded fontSize values${NC}"
  echo "$FS_HITS" | sed 's/:.*$//' | sort | uniq -c | sort -rn | head -10
  echo -e "  ${DIM}(Top 10 files by violation count)${NC}"
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Token Audit Summary"
echo "========================================="
echo ""

if [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "  ${GREEN}All clean — no violations found${NC}"
else
  echo -e "  ${YELLOW}Total violations: ${VIOLATIONS}${NC}"
  echo ""
  echo "  Priority:"
  echo "  1. Fix hardcoded colors (breaks dark mode / theming)"
  echo "  2. Replace native <button> with BDS Button"
  echo "  3. Tokenize border-radius values"
  echo "  4. Migrate px spacing to tokens (do file-by-file)"
fi

echo ""
exit $([ "$VIOLATIONS" -eq 0 ] && echo 0 || echo 1)
