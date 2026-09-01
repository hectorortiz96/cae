# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


Run vite server:
npm run dev
npm run build
npx vite

## API Environment Routing

This app uses environment variables plus a centralized client for API routes.

- Environment files:
  - `.env.development` -> `VITE_API_BASE_URL=/api`
  - `.env.test` -> test API URL
  - `.env.production` -> production API URL
  - `.env.example` -> template values
- Route constants live in `src/api/routes.ts`
- Shared request logic lives in `src/api/client.ts`

### Development proxy

`vite.config.ts` proxies `/api/*` to your backend target (`VITE_PROXY_TARGET`) and rewrites `/api`.

Example: frontend calls `/api/auth/login` -> backend receives `/auth/login`.

### PowerShell build note

If your shell does not support `&&` in npm scripts, run:

```powershell
npx tsc -b
npx vite build
```

