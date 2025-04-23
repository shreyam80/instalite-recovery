// registerRoutes.js
import { handleLogin, handleRegister, handleSearch } from './routes.js';

export default function registerRoutes(app) {
  app.post('/auth/login', handleLogin);
  app.post('/auth/register', handleRegister);
  app.post('/auth/search', handleSearch);

  // Add more app.get/post/put/delete(...) here as needed
}
