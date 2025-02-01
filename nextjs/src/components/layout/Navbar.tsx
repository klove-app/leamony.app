'use client';

import Link from 'next/link';
import Image from 'next/image';
import AuthModal from './AuthModal';
import { useAuth } from '@/lib/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          <Image 
            src="/images/logo.svg" 
            alt="RunConnect Logo" 
            width={32} 
            height={32} 
          />
          RunConnect
        </Link>

        <div className="nav-links">
          <Link href="#features" className="nav-link">
            Features
          </Link>
          <Link href="#pricing" className="nav-link">
            Pricing
          </Link>
          <a 
            href="https://docs.runconnect.app" 
            className="nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          
          {user ? (
            <>
              <Link href="/dashboard" className="nav-link">
                Личный кабинет
              </Link>
              <button onClick={logout} className="button button-secondary">
                Выйти
              </button>
            </>
          ) : (
            <AuthModal />
          )}
          
          <a 
            href="https://t.me/sl_run_bot" 
            className="button button-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
} 