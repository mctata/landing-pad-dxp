import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900">
                Create stunning websites with AI assistance
              </h1>
              <p className="text-xl text-secondary-600">
                Landing Pad Digital helps you build beautiful, responsive websites in minutes with AI-powered design and content suggestions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup" className="btn-primary text-center">
                  Get started for free
                </Link>
                <Link href="/templates" className="btn-outline text-center">
                  View templates
                </Link>
              </div>
            </div>
            <div className="relative h-96">
              <Image 
                src="/images/hero-image.png" 
                alt="AI Website Builder" 
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="section bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Build websites faster with AI
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Our AI-powered platform helps you create professional websites without coding skills.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card">
              <div className="mb-4 text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">AI-Powered Design</h3>
              <p className="text-secondary-600">
                Get intelligent layout and design suggestions based on your industry and goals.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="card">
              <div className="mb-4 text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Drag-and-Drop Editor</h3>
              <p className="text-secondary-600">
                Easily customize your website with our intuitive drag-and-drop interface.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="card">
              <div className="mb-4 text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">AI Content Generation</h3>
              <p className="text-secondary-600">
                Generate professional copy and content tailored to your business needs.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="section bg-secondary-50">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Choose the plan that works best for you and your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="card border-2 border-secondary-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">Free</h3>
                <p className="text-primary-600 text-4xl font-bold">$0<span className="text-lg text-secondary-500">/mo</span></p>
                <p className="text-secondary-500 mt-2">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>1 website</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Basic templates</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Landing Pad branding</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Basic AI assistance</span>
                </li>
              </ul>
              
              <Link href="/auth/signup" className="btn-outline w-full block text-center">
                Get started
              </Link>
            </div>
            
            {/* Pro Plan */}
            <div className="card border-2 border-primary-500 relative">
              <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                POPULAR
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">Pro</h3>
                <p className="text-primary-600 text-4xl font-bold">$19<span className="text-lg text-secondary-500">/mo</span></p>
                <p className="text-secondary-500 mt-2">For professionals and small businesses</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>5 websites</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Premium templates</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>No Landing Pad branding</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Advanced AI assistance</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Custom domain</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              
              <Link href="/auth/signup?plan=pro" className="btn-primary w-full block text-center">
                Get started
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="card border-2 border-secondary-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-secondary-900 mb-2">Enterprise</h3>
                <p className="text-primary-600 text-4xl font-bold">$99<span className="text-lg text-secondary-500">/mo</span></p>
                <p className="text-secondary-500 mt-2">For larger teams and businesses</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Unlimited websites</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>All Pro features</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>White-label option</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Custom integrations</span>
                </li>
              </ul>
              
              <Link href="/auth/signup?plan=enterprise" className="btn-outline w-full block text-center">
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="section bg-primary-600 text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to build your website?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of users who are creating stunning websites with Landing Pad Digital.
          </p>
          <Link href="/auth/signup" className="inline-block bg-white text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-primary-50 transition-colors duration-200">
            Get started for free
          </Link>
        </div>
      </section>
      
      <Footer />
    </>
  );
}