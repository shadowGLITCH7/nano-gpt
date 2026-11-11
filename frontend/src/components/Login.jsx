import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { login } from '../lib/auth';
import { Logo } from './Logo';

export function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter both a username and a password.');
      return;
    }
    const session = login(username, password);
    if (session) onLogin(session);
    else setError('That username and password don’t match. Check the demo credentials below.');
  };

  const fillDemo = () => {
    setUsername('Big Smoke');
    setPassword('santamaria');
    setError('');
  };

  return (
    <main className="login">
      <form className="login__card" onSubmit={submit} noValidate>
        <Logo size={40} />
        <h1>Sign in to Mini-GPT</h1>
        <p className="login__sub">A small language model running on your own machine.</p>

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            autoComplete="username"
            autoFocus
            aria-invalid={!!error}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div className="field__pw">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              aria-invalid={!!error}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && <p className="login__error" role="alert">{error}</p>}

        <button className="btn btn--primary btn--block" type="submit">
          Sign in <ArrowRight size={16} />
        </button>

        <div className="login__demo">
          <Info size={16} />
          <div className="login__demo-text">
            <span><strong>Demo account</strong> · Big Smoke / santamaria</span>
            <button type="button" className="link-btn" onClick={fillDemo}>Fill in</button>
          </div>
        </div>
      </form>
      <p className="login__foot">Local demo login, not real authentication.</p>
    </main>
  );
}
