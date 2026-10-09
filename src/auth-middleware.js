const { supabase } = require('./supabase');

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // getUser(token) verifies the token against Supabase Auth; do not trust decoded JWTs alone.
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.accessToken = match[1];
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
