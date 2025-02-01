'use client';

import { useState } from 'react';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button onClick={openModal} className="nav-link">
        Sign In
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sign In</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <p>Please use our Telegram bot to sign in:</p>
              <a 
                href="https://t.me/sl_run_bot" 
                className="button button-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign In with Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 