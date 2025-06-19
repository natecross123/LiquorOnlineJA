import React from 'react'
import { features } from '../assets/assets'

const BottomBanner = () => {
  return (
    <div className='mt-24 px-4 md:px-8 py-16 bg-gray-50/50'>
      {/* Horizontal Title Section */}
      <div className='text-center mb-16'>
        <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4'>
          WHY WE ARE THE BEST!!
        </h1>
        <p className='text-lg text-gray-700 max-w-2xl mx-auto'>
          Here's what makes us the smarter choice
        </p>
      </div>
      
      {/* Features Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto'>
        {features.map((feature, index) => (
          <div key={index} className='text-center px-4'>
            {/* Icon */}
            <div className='flex justify-center mb-6'>
              <img 
                src={feature.icon} 
                alt={feature.title} 
                className='w-16 h-16 md:w-20 md:h-20'
              />
            </div>
            
            {/* Title */}
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 mb-4 uppercase tracking-wide'>
              {feature.title}
            </h3>
            
            {/* Description */}
            <p className='text-gray-600 text-lg md:text-base leading-relaxed'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BottomBanner