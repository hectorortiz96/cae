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
  - `.env.production` -> API URL for non-container production builds
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

### Deploying to Cloud Run with Docker

Set the repository source/build context to `cae-app`, where the Dockerfile and
package manifests are located. The container listens on Cloud Run's `PORT`
environment variable (8080 by default).

Set `VITE_API_BASE_URL` in the frontend Cloud Run service's container environment
to the public backend URL. At container startup, an entrypoint script generates
`/runtime-config.js`, which the browser loads before React. The container fails
to start if the variable is missing or empty. No Docker build argument or
production environment file is required.

Runtime configuration takes precedence over Vite's build-time values. Local
development still reads `VITE_API_BASE_URL` from `.env.development`.
Only the API URL is exposed in runtime configuration; never put secrets in it.
The configuration response disables caching so browsers do not reuse a stale URL.

Rebuild and deploy the frontend image once to install runtime configuration
support. Subsequent URL changes only require deploying a Cloud Run revision with
the updated container environment variable, not rebuilding the image.
Remove any `VITE_API_BASE_URL` build argument and `_API_BASE_URL` substitution
previously added to Cloud Build; they are no longer used.
