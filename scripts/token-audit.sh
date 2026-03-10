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
count_matches() {
  if [ -z "$1" ]; then echo 0; else echo "$1" | grep -c "." 2>/dev/null || echo 0; fi
}

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

# ── 9. Alias→alias token violations (CSS) ─────────────────────────────
section "Alias→alias token references in CSS"

# Rule: Alias tokens must reference primitives only.
# Component-tier tokens (--_color---*) MAY reference aliases.
# Component-tier CSS (.bds-* selectors) MAY reference aliases.
#
# Primitive prefixes (values that aliases are ALLOWED to reference):
#   --font-size-*, --space-*, --border-radius-*, --border-width-*,
#   --box-shadow-*, --font-line-height-*, --grayscale--*, --poppy--*,
#   --tan--*, --brand--*, --services--* (raw colors only)
#
# Anything else inside var() on the RHS of an alias assignment = violation.

ALIAS_CSS_HITS=$(grep -rn --include="*.css" \
  -E '^\s*--[a-z].*:\s*var\(--' "$SRC" \
  | grep -v '\-\-_color---' \
  | grep -v '\.bds-' \
  | grep -v 'var(--font-size-' \
  | grep -v 'var(--space-' \
  | grep -v 'var(--border-radius-' \
  | grep -v 'var(--border-width-' \
  | grep -v 'var(--box-shadow-' \
  | grep -v 'var(--font-line-height-' \
  | grep -v 'var(--grayscale--' \
  | grep -v 'var(--poppy--' \
  | grep -v 'var(--tan--' \
  | grep -v 'var(--brand--' \
  | grep -v '// ' \
  || true)

ALIAS_CSS_COUNT=$(count_matches "$ALIAS_CSS_HITS")
if [ "$ALIAS_CSS_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${ALIAS_CSS_COUNT} alias→alias references in CSS${NC}"
  echo "$ALIAS_CSS_HITS" | head -10
  [ "$ALIAS_CSS_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((ALIAS_CSS_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + ALIAS_CSS_COUNT))
else
  echo -e "  ${GREEN}Clean${NC}"
fi

# ── 10. Inline CSS variable overrides in TSX ──────────────────────────
section "Inline CSS custom property overrides in TSX"

# Inline '--variable-name': value patterns in style objects are almost always
# token architecture violations (alias overriding alias). Each should use a
# component-tier CSS rule in globals.css instead.
# Excludes: comments, test files

INLINE_VAR_HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "'--[a-z][a-z0-9-]+'" "$SRC" \
  | grep -v "\.test\." \
  | grep -v "// " \
  | grep -v "globals\.css" \
  | grep -v "fonts\.ts" \
  || true)

INLINE_VAR_COUNT=$(count_matches "$INLINE_VAR_HITS")
if [ "$INLINE_VAR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}${INLINE_VAR_COUNT} inline CSS variable overrides${NC}"
  echo -e "  ${DIM}(Move to component-tier CSS in globals.css)${NC}"
  echo "$INLINE_VAR_HITS" | head -10
  [ "$INLINE_VAR_COUNT" -gt 10 ] && echo -e "  ${DIM}... and $((INLINE_VAR_COUNT - 10)) more${NC}"
  VIOLATIONS=$((VIOLATIONS + INLINE_VAR_COUNT))
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
  echo "  1. Alias→alias violations (breaks token architecture)"
  echo "  2. Inline CSS variable overrides (move to globals.css)"
  echo "  3. Fix hardcoded colors (breaks dark mode / theming)"
  echo "  4. Replace native <button> with BDS Button"
  echo "  5. Tokenize border-radius values"
  echo "  6. Migrate px spacing to tokens (do file-by-file)"
fi

echo ""
exit $([ "$VIOLATIONS" -eq 0 ] && echo 0 || echo 1)
