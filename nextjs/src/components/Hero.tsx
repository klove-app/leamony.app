import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl max-w-4xl mx-auto">
            Transform Your Running Journey with AI
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Join an active running community where every run becomes more engaging with our AI assistant. 
            Track progress, earn unique achievements, and share your success with fellow runners.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="https://t.me/sl_run_bot"
              target="_blank"
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-md text-lg font-medium transition-colors"
            >
              Start Running Now
            </Link>
            <Link
              href="#features"
              className="bg-white text-gray-900 px-8 py-3 rounded-md text-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 