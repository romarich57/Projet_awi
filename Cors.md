# CORS code review

## Findings (ordered by severity)
1) [Low] CORS headers are not applied to `/uploads` responses
   - Where: `backend/src/server.ts:58`, `backend/src/server.ts:77`
   - Why: `express.static('/uploads')` is registered before `app.use(cors(corsOptions))`, so static uploads do not get CORS headers.
   - Impact: cross-origin `fetch` or canvas/image processing against `/uploads` on the API domain will fail due to missing CORS headers. This is a functional break if the frontend ever accesses the API host directly instead of the nginx proxy.
   - Fix: move `app.use(cors(corsOptions))` above the static middleware, or scope CORS explicitly:
     ```ts
     app.use(cors(corsOptions))
     app.use('/uploads', cors(corsOptions), express.static(uploadsPath))
     ```

2) [Low] Denied origins throw an error without a safe CORS error handler
   - Where: `backend/src/server.ts:68-77`
   - Why: the `origin` callback calls `callback(new Error(...))`, but there is no dedicated error middleware to map it to a 403/400.
   - Impact: Express default error handling returns a 500 and can expose stack traces in non-prod settings. It also makes CORS denials look like server errors.
   - Fix: return `callback(null, false)` and handle `Origin` rejections with a custom 403 response, or add a global error middleware for CORS errors.

3) [Low] Allowlist matching is strict and fragile to formatting
   - Where: `backend/src/server.ts:63-71`, `backend/src/config/env.ts:7-14`
   - Why: `allowedOrigins.includes(origin)` is a raw string match and does not normalize trailing slashes or equivalent hostnames.
   - Impact: valid frontend origins can be blocked (ex: `https://example.com/` vs `https://example.com`, or `localhost` vs `127.0.0.1`).
   - Fix: normalize both env values and incoming origin with `new URL(origin).origin` before comparison.

## Questions / assumptions
- Assumption: the frontend always hits the API through nginx (`/api`, `/uploads`), so missing CORS on `/uploads` is currently masked. If you expect direct API access from another origin, this needs fixing.
- Assumption: `FRONTEND_ORIGINS` is always set correctly in prod. If not, the fallback allows only localhost and will break CORS.

## Change summary
- No code changes in this review (analysis only).
