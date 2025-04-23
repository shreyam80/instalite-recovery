// routes.js
import { authenticateUser, createUser } from '../../users.js';

export async function handleLogin(req, res) {
  const result = await authenticateUser(req.body);
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
}

export async function handleRegister(req, res) {
  const createResult = await createUser(req.body);
  if (createResult.error) return res.status(400).json({ error: createResult.error });

  const loginResult = await authenticateUser({
    login: req.body.login,
    password: req.body.password,
  });

  if (loginResult.error) return res.status(500).json({ error: loginResult.error });

  res.json(loginResult);
}
