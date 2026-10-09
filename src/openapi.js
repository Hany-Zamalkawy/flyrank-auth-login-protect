const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'FlyRank Auth API',
    version: '1.0.0',
    description: 'Authentication API using Supabase Auth. Use the access token returned by /auth/login with the Authorize button.'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the access token only; Swagger adds the Bearer prefix.' }
    },
    schemas: {
      Credentials: {
        type: 'object', required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email', example: 'test@example.com' }, password: { type: 'string', format: 'password', minLength: 6, example: 'password123' } }
      },
      Error: { type: 'object', properties: { error: { type: 'string' } } }
    }
  },
  paths: {
    '/auth/signup': { post: { tags: ['Auth'], summary: 'Create a user account', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } }, responses: { '201': { description: 'User created' }, '400': { description: 'Missing or invalid input' }, '409': { description: 'Signup rejected by Supabase' } } } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Log in and receive tokens', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } }, responses: { '200': { description: 'Login successful; includes access_token and refresh_token' }, '400': { description: 'Missing input' }, '401': { description: 'Invalid login credentials' } } } },
    '/auth/logout': { post: { tags: ['Auth'], summary: 'Sign out the authenticated session', security: [{ bearerAuth: [] }], responses: { '204': { description: 'Signed out' }, '401': { description: 'Missing or invalid token' }, '501': { description: 'Stateless token logout limitation' } } } },
    '/protected/profile': { get: { tags: ['Protected'], summary: 'Read authenticated user profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Safe user metadata' }, '401': { description: 'Missing or invalid token' } } },
    '/protected/dashboard': { get: { tags: ['Protected'], summary: 'Example second protected route', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard data' }, '401': { description: 'Missing or invalid token' } } },
    '/public/info': { get: { tags: ['Public'], summary: 'Read public information', responses: { '200': { description: 'Public message' } } }
  }
};

module.exports = { openapi };
