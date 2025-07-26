import React from 'react'

const AboutUs = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Hero Section */}
        <div className='text-center mb-16'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            About Our Company
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            We're dedicated to bringing you quality products you can trust, with exceptional service and unbeatable value.
          </p>
        </div>

        {/* Story Section */}
        <div className='grid md:grid-cols-2 gap-12 items-center mb-16'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900 mb-6'>Our Story</h2>
            <p className='text-gray-700 mb-4 leading-relaxed'>
              Founded in 2025, our company started with a simple mission: to make quality liquor accessible to everyone. What began as a small team with big dreams has grown into a trusted brand serving customers worldwide.
            </p>
            <p className='text-gray-700 mb-4 leading-relaxed'>
              We believe that everyone deserves access to products that enhance their lives, which is why we work tirelessly to source the best items at fair prices.
            </p>
            <p className='text-gray-700 leading-relaxed'>
              Today, we're proud to serve thousands of satisfied customers while maintaining our commitment to quality, affordability, and exceptional customer service.
            </p>
          </div>
          <div className='bg-gray-200 h-80 rounded-lg flex items-center justify-center'>
            <span className='text-gray-500'>Company Image Placeholder</span>
          </div>
        </div>

        {/* Values Section */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 text-center mb-12'>Our Values</h2>
          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Quality First</h3>
              <p className='text-gray-600'>We carefully curate every product to ensure it meets our high standards for quality and durability.</p>
            </div>

            <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Fair Pricing</h3>
              <p className='text-gray-600'>We believe quality shouldn't break the bank. Our competitive prices make premium products accessible.</p>
            </div>

            <div className='text-center p-6 bg-white rounded-lg shadow-sm'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Customer Focus</h3>
              <p className='text-gray-600'>Your satisfaction is our priority. We're here to support you every step of your shopping journey.</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-gray-900 text-center mb-12'>Meet Our Team</h2>
          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4'></div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Lorem Ipsum </h3>
              <p className='text-gray-600 mb-2'>CEO & Founder</p>
              <p className='text-sm text-gray-500'>Leading our vision with passion and dedication to customer satisfaction.</p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4'></div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Lorem Ipsum</h3>
              <p className='text-gray-600 mb-2'>Head of Operations</p>
              <p className='text-sm text-gray-500'>Ensuring smooth operations and timely delivery of all orders.</p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4'></div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>Lorem Ipsum</h3>
              <p className='text-gray-600 mb-2'>Customer Success Manager</p>
              <p className='text-sm text-gray-500'>Dedicated to providing exceptional customer service and support.</p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className='text-center bg-white rounded-lg p-8 shadow-sm'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Get in Touch</h2>
          <p className='text-gray-600 mb-6'>
            Have questions or want to learn more? We'd love to hear from you.
          </p>
          <button className='px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-primary transition-colors'>
            Contact Us
          </button>
        </div>
      </div>
    </div>
  )
}

export default AboutUs