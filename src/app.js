const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { supabase, createClient } = require('./supabase');
const { requireAuth } = require('./auth-middleware');
const { openapi } = require('./openapi');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/public/info', (_req, res) => res.status(200).json({ message: 'Welcome stranger! This info is public.' }));

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ user: data.user });
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to create account' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) return res.status(401).json({ error: 'Invalid login credentials' });
    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type,
      expires_in: data.session.expires_in,
      user: data.user
    });
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }
});

app.get('/protected/profile', requireAuth, (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    }
  });
});

app.get('/protected/dashboard', requireAuth, (req, res) => {
  return res.status(200).json({ message: 'Welcome to your protected dashboard.', user_id: req.user.id });
});

app.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    // A server-side stateless client has no browser session to clear. This user-scoped
    // client attempts Supabase sign-out with the presented access token.
    const userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${req.accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });
    const { error } = await userClient.auth.signOut({ scope: 'local' });
    if (error) return res.status(400).json({ error: 'Unable to sign out this session', detail: error.message });
    return res.status(204).end();
  } catch (_error) {
    return res.status(500).json({ error: 'Unable to sign out' });
  }
});

app.get('/openapi.json', (_req, res) => res.status(200).json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app };
