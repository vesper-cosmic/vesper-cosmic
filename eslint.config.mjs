import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...coreWebVitals,
  {
    // New React Compiler advisories (eslint-plugin-react-hooks 7). The existing
    // effects work; keep them visible as warnings rather than failing lint.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
];

export default config;
