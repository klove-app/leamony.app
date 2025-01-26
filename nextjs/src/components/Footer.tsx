import Link from 'next/link';

const footerSections = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Documentation', href: 'https://docs.runconnect.app' }
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' }
    ]
  },
  {
    title: 'Support',
    links: [
      { name: 'Help Center', href: 'https://t.me/sl_run_support' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' }
    ]
  }
];

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#features" className="text-base text-gray-500 hover:text-gray-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-base text-gray-500 hover:text-gray-900">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="https://docs.runconnect.app" className="text-base text-gray-500 hover:text-gray-900">
                  Documentation
                </a>
              </li>
              <li>
                <a href="mailto:support@runconnect.app" className="text-base text-gray-500 hover:text-gray-900">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="/privacy" className="text-base text-gray-500 hover:text-gray-900">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-base text-gray-500 hover:text-gray-900">
                  Terms
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Social
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="https://twitter.com/runconnect" className="text-base text-gray-500 hover:text-gray-900">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://t.me/runconnect" className="text-base text-gray-500 hover:text-gray-900">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} RunConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 