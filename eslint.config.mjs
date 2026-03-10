import nextConfig from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Pre-existing: raw <a> tags tracked in token-audit.sh, migrating incrementally
      "@next/next/no-html-link-for-pages": "warn",
      // New in react-hooks v5 — valid rule but needs refactor, not a blocker
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
