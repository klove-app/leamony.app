'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>Product</h3>
            <ul className="footer-links">
              <li><Link href="#features" className="footer-link">Features</Link></li>
              <li><Link href="#pricing" className="footer-link">Pricing</Link></li>
              <li><a href="https://docs.runconnect.app" className="footer-link" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Company</h3>
            <ul className="footer-links">
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li><Link href="/blog" className="footer-link">Blog</Link></li>
              <li><Link href="/careers" className="footer-link">Careers</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><a href="https://t.me/sl_run_support" className="footer-link" target="_blank" rel="noopener noreferrer">Help Center</a></li>
              <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/terms" className="footer-link">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} RunConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 