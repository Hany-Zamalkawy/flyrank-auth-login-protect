# FlyRank Auth — Login & Protect

A Node.js + Express API using Supabase Auth for sign-up and login, server-side access-token verification, reusable authentication middleware, protected routes, and Swagger UI with Bearer authentication.

## Features

- `POST /auth/signup` — create an account with Supabase Auth.
- `POST /auth/login` — validate credentials and return access/refresh tokens.
- `POST /auth/logout` — protected sign-out endpoint.
- `GET /protected/profile` — returns safe metadata for the authenticated user.
- `GET /protected/dashboard` — second route protected by the same middleware.
- `GET /public/info` — public information without authentication.
- `GET /docs` — interactive Swagger UI.
- `GET /health` — basic server health check.

## Requirements

- Node.js 20 or newer
- A free Supabase project
- Git

## Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your Supabase Project URL and **anon/publishable key** from Supabase Dashboard → Project Settings → API.

   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your_supabase_anon_or_publishable_key
   PORT=3000
   ```

4. For this practice assignment, if you want immediate login after registration, open Supabase Dashboard → Authentication → Sign In / Providers → Email and turn off email confirmation. Re-enable it for production.
5. Start the server:

   ```bash
   npm start
   ```

6. Open Swagger at <http://localhost:3000/docs>.

## API reference

| Method | Endpoint | Auth required | Purpose |
|---|---|---:|---|
| POST | `/auth/signup` | No | Create an account |
| POST | `/auth/login` | No | Authenticate and return tokens |
| POST | `/auth/logout` | Yes | Sign out the authenticated session |
| GET | `/protected/profile` | Yes | Read safe user metadata |
| GET | `/protected/dashboard` | Yes | Example of reusable route protection |
| GET | `/public/info` | No | Public message |
| GET | `/health` | No | Health check |

## Try it with curl

### Sign up

```bash
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Log in

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Copy the `access_token` from the response.

### Call the protected profile

```bash
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

A missing or invalid token should return `401`. Change one character of a valid token to test rejection.

### Public route

```bash
curl -i http://localhost:3000/public/info
```

### Logout

```bash
curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Status codes

- `200` — successful login or read
- `201` — signup accepted
- `204` — logout succeeded
- `400` — required input missing or malformed
- `401` — missing, malformed, invalid, or expired token; invalid credentials

## Security notes

- Never commit `.env` or paste secrets into issues, screenshots, or chat.
- Use only the Supabase anon/publishable key in this project. Never use `service_role`.
- The middleware calls `supabase.auth.getUser(token)` so Supabase verifies the presented token; the API does not trust a decoded JWT alone.
- Do not log access tokens or passwords.
- JWT access tokens are bearer credentials. A stateless JWT may remain usable until expiry depending on Supabase's session/revocation behavior; test logout behavior rather than assuming local client sign-out instantly invalidates every copied token.
- This is an educational assignment. Before production, add rate limiting, stricter input validation, CORS policy, structured logging, and deployment configuration.

## Tests

Run the middleware input tests:

```bash
npm test
```

The tests cover missing and malformed Authorization headers. End-to-end tests require a configured Supabase project and should be run manually using the commands above or Swagger.

## Swagger screenshot

After starting the API, visit `/docs`, use **Authorize** to paste an access token, and run `GET /protected/profile`. Save a screenshot and add it here before submission. A real screenshot is intentionally not fabricated in this source package.
