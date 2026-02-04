# Brik Design System Quick Reference

This is a condensed reference for AI agents. Full documentation in `../brik-bds/tokens/TOKEN-REFERENCE.md`.

## Token Pattern

```
--_[category]---[type]--[variant]
```

## Spacing Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--_space---section--sm` | 3rem | Small section padding |
| `--_space---section--md` | 4.5rem | Medium section padding |
| `--_space---section--lg` | 6rem | Large section padding |
| `--_space---component--sm` | 1rem | Small component padding |
| `--_space---component--md` | 2rem | Standard component padding |
| `--_space---layout--sm` | 1rem | Small grid gap |
| `--_space---layout--md` | 2rem | Standard grid gap |
| `--_space---layout--lg` | 3rem | Large grid gap |

## Color Tokens

| Token | Description |
|-------|-------------|
| `--_color---brand--primary` | Primary brand color |
| `--_color---brand--accent` | Accent/highlight color |
| `--_color---surface--card` | Card background |
| `--_color---surface--page` | Page background |
| `--_color---text--primary` | Primary text |
| `--_color---text--muted` | Secondary/muted text |
| `--_color---border--subtle` | Subtle borders |

## Typography Tokens

| Token | Description |
|-------|-------------|
| `--_font---family--display` | Display/heading font (Instrument Serif) |
| `--_font---family--body` | Body text font (Sora) |
| `--_font---size--display-lg` | Large display text |
| `--_font---size--display-md` | Medium display text |
| `--_font---size--body-lg` | Large body text |
| `--_font---size--body-md` | Standard body text |
| `--_font---size--body-sm` | Small body text |

## Border Radius Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--_radius---component--sm` | 4px | Small elements (buttons) |
| `--_radius---component--md` | 8px | Cards, panels |
| `--_radius---component--lg` | 16px | Large containers |
| `--_radius---component--full` | 9999px | Pills, circles |

## Section Types

Use these class patterns:

| Section | Class |
|---------|-------|
| Hero | `.section.section--hero` |
| Content | `.section.section--content` |
| Feature | `.section.section--feature` |
| Cards | `.section.section--cards` |
| CTA | `.section.section--cta` |
| Testimonial | `.section.section--testimonial` |
| FAQ | `.section.section--faq` |

## Layout Types

| Layout | Class | Grid |
|--------|-------|------|
| 1 column | `.layout.layout--1-col` | Single column |
| 2 column | `.layout.layout--2-col` | 50/50 split |
| 3 column | `.layout.layout--3-col` | Three equal |
| Grid | `.layout.layout--grid` | Auto-fit responsive |

## Component Classes

| Component | Class | Use |
|-----------|-------|-----|
| Card | `.display.display--card` | Content card |
| Button | `.el.el--button` | Button element |
| Badge | `.el.el--badge` | Label/badge |
| Link | `.el.el--link` | Styled link |

## Button Variants

```html
<a class="el el--button el--button-primary">Primary</a>
<a class="el el--button el--button-secondary">Secondary</a>
<a class="el el--button el--button-ghost">Ghost</a>
```

## Example Usage

```css
.section--hero {
  padding: var(--_space---section--lg);
}

.display--card {
  padding: var(--_space---component--md);
  border-radius: var(--_radius---component--md);
  background: var(--_color---surface--card);
}

.el--button-primary {
  background: var(--_color---brand--primary);
  border-radius: var(--_radius---component--sm);
}
```
