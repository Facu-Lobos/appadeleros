
import React, { useState } from 'react';

interface PlayerLoginProps {
  onLogin: (credentials: { email: string; pass: string }) => void;
  onBack: () => void;
  onForgotPassword: () => void;
}

const PlayerLogin: React.FC<PlayerLoginProps> = ({ onLogin, onBack, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email, pass: password });
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-dark-secondary p-8 rounded-lg shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Iniciar Sesión (Jugador)</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light-secondary mb-1">Email</label>
            <input
              type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="tu@email.com" required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-light-secondary mb-1">Contraseña</label>
            <input
              type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-tertiary border border-dark-tertiary text-white rounded-md p-3 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="********" required
            />
          </div>
          <div className="text-right -mt-2">
            <button type="button" onClick={onForgotPassword} className="text-sm text-primary hover:underline font-semibold">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="flex flex-col space-y-4 pt-2">
            <button type="submit" className="w-full bg-primary text-dark-primary font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-colors duration-300 disabled:bg-gray-500" disabled={!email || !password}>
              Iniciar Sesión
            </button>
            <button type="button" onClick={onBack} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-300">
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerLogin;
