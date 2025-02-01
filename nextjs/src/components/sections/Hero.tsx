'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Transform Your Running Journey with AI</h1>
          <p className="hero-description">
            Get personalized training plans, track your progress, and achieve your running goals with our AI-powered platform
          </p>
          <div className="hero-buttons">
            <a href="https://t.me/sl_run_bot" className="button button-primary" target="_blank" rel="noopener noreferrer">
              Get Started
            </a>
            <a href="#features" className="button button-secondary">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 