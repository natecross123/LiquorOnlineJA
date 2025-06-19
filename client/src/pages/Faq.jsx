import React, { useState } from 'react'

const Faq = () => {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqData = [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for all unused items in their original packaging. Simply contact our customer service team to initiate a return."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. Free shipping is available on orders over $50."
    },
    {
      question: "Do you ship internationally?",
      answer: " We currrently only deliver within Jamaica . However, we are working on expanding our shipping options to include international destinations in the future."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking update via email. You can use this number to track your package on our website or the carrier's website."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers."
    },
    {
      question: "Can I modify or cancel my order?",
      answer: "You can modify or cancel your order within 1 hour of placing it. After that, please contact customer service for assistance."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, our customer support team is available 24/7 via email, or phone. We're here to help with any questions or concerns."
    },
    {
      question: "Are your products guaranteed?",
      answer: "All our products come with a manufacturer's warranty. We also offer our own quality guarantee - if you're not satisfied, we'll make it right."
    }
  ]

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Frequently Asked Questions
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Find answers to common questions about our products, shipping, returns, and more. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Items */}
        <div className='space-y-4'>
          {faqData.map((item, index) => (
            <div key={index} className='bg-white rounded-lg shadow-sm border border-gray-200'>
              <button
                className='w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors'
                onClick={() => toggleItem(index)}
              >
                <h3 className='text-lg font-semibold text-gray-900 pr-4'>
                  {item.question}
                </h3>
                <div className='flex-shrink-0'>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems[index] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {openItems[index] && (
                <div className='px-6 pb-4'>
                  <p className='text-gray-700 leading-relaxed'>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className='mt-16 text-center bg-white rounded-lg p-8 shadow-sm border border-gray-200'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Still have questions?
          </h2>
          <p className='text-gray-600 mb-6'>
            Our customer support team is here to help you with any additional questions.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
              Contact Support
            </button>
            <button className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'>
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Faq