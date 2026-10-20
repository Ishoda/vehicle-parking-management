# Parkly Frontend

Vehicle Parking Management System staff application.

## Technology

React, JavaScript, Vite, Redux Toolkit, Axios, React Router,
Lucide React and Recharts.

## Local setup

Run these commands from the frontend directory:

```powershell
npm ci
```

Create a local `.env` file:

```env
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://localhost:5080
```

Set `API_PROXY_TARGET` to the actual backend address.

Start the backend separately, then start the frontend:

```powershell
npm run dev
```

Open the URL printed by Vite.

## Checks

```powershell
npm run lint
npm run build
```

## Production preview

```powershell
npm run preview
```

Preview serves the production build. It does not start the backend.

## User roles

- `AD`: Owner / Administrator
- `OP`: Operator

Frontend permissions control navigation and page access.
The backend must also enforce authorization.

## Project structure

- `src/components`: Shared interface components
- `src/constants`: API paths, permissions and resource definitions
- `src/pages`: Application screens
- `src/routes`: Route protection
- `src/services`: HTTP client and request functions
- `src/store`: Redux store and slices
- `src/styles`: Shared application styles
- `src/utils`: Request hook and formatting helpers
- `public`: Static assets, manifest and IIS configuration
- `scripts`: Icon and service-worker generation

## PWA

Development and production builds generate the application icons.

Production builds also generate `dist/sw.js` and `dist/offline.html`.
The service worker is registered only in production.

When a page navigation fails because the network is unavailable,
the service worker displays the offline page.

API responses are not cached by the service worker. Vehicle entries,
exits and payments require a live connection and are not queued offline.

Test using `npm run preview`, then check the browser's Application panel
for the manifest and activated service worker. Reload once before
testing an offline navigation.

## IIS deployment

Deploy the contents of `dist` at the website root.

The included `web.config` provides React route rewriting and manifest
and SVG MIME mappings. IIS requires the URL Rewrite module.

Configure `/api` to reach the backend separately. The Vite development
proxy is not part of the deployed application.

Use HTTPS in production.

## Integration status

API paths and response fields must match the backend implementation.
A successful frontend build does not verify database operations or
complete transaction flows.