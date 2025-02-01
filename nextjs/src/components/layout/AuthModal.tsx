'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Cookies from 'js-cookie';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => {
    setError('');
    setUsername('');
    setPassword('');
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.runconnect.app/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Неверное имя пользователя или пароль');
        } else if (response.status === 429) {
          throw new Error('Слишком много попыток входа. Пожалуйста, подождите немного');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Произошла ошибка при входе');
        }
      }

      const data: LoginResponse = await response.json();
      
      // Сохраняем токены в куки
      Cookies.set('access_token', data.access_token, { 
        secure: true, 
        sameSite: 'strict',
        expires: 1 // 1 день
      });
      
      Cookies.set('refresh_token', data.refresh_token, {
        secure: true,
        sameSite: 'strict',
        expires: 30 // 30 дней
      });

      closeModal();
      window.location.href = '/dashboard';
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={openModal} className="button button-secondary">
        Sign In
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sign In</h2>
              <button 
                className="modal-close" 
                onClick={closeModal} 
                aria-label="Close"
                disabled={isLoading}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleSubmit} className="auth-form">
                {error && (
                  <div className="error-message" role="alert">
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    minLength={1}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                <button 
                  type="submit" 
                  className="button button-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 