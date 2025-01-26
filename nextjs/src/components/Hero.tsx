import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl">
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
              className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
            >
              Start Running Now
            </Link>
            <Link
              href="#features"
              className="bg-white text-gray-900 px-8 py-3 rounded-md text-lg font-medium border border-gray-300 hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 