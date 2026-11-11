// Demo-only login. NOT real authentication: credentials live in the frontend bundle.
import { load, save, remove } from './storage';

const DEMO_USERS = [{ username: 'Big Smoke', password: 'santamaria' }];
const SESSION_KEY = 'minigpt:session';

export function login(username, password) {
  const user = DEMO_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
  );
  if (!user) return null;
  const session = { username: user.username, loggedInAt: Date.now() };
  save(SESSION_KEY, session);
  return session;
}

export const getSession = () => load(SESSION_KEY, null);
export const logout = () => remove(SESSION_KEY);
