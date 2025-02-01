'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const openModal = () => {
    setError('');
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        closeModal();
        window.location.href = '/dashboard';
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    }
  };

  return (
    <>
      <button onClick={openModal} className="nav-link">
        Войти
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Вход в систему</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label htmlFor="username">Имя пользователя</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Пароль</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="button button-primary">
                  Войти
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 