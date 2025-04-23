// registerRoutes.js
import { handleLogin, handleRegister } from './routes.js';

export default function registerRoutes(app) {
  app.post('/auth/login', handleLogin);
  app.post('/auth/register', handleRegister);

  // Add more app.get/post/put/delete(...) here as needed
}
