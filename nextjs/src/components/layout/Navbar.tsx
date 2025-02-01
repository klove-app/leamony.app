'use client';

import Link from 'next/link';
import Image from 'next/image';
import AuthModal from './AuthModal';

export default function Navbar() {
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
          <AuthModal />
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