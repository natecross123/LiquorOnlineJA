import React, { useState } from 'react'
import AgeVerification from '../components/AgeVerification'
import BestSeller from '../components/Bestseller'
import BottomBanner from '../components/BottomBanner'
import Categories from '../components/Categories'
import MainBanner from '../components/MainBanner'
import NewsLetter from '../components/NewsLetter'

const Home = () => {
  const [ageVerified, setAgeVerified] = useState(false);

  const handleAgeVerified = () => {
    setAgeVerified(true);
  };

  return (
    <div className='mt-10'>
      {/* Age Verification Popup */}
      <AgeVerification onVerified={handleAgeVerified} />
      
      {/* Main Content - only show after age verification */}
      <div className={`${!ageVerified ? 'pointer-events-none' : ''}`}>
        <MainBanner/>  
        <Categories/> 
        <BestSeller/>
        <BottomBanner/>
        <NewsLetter/>
      </div>
    </div>
  )
}

export default Home