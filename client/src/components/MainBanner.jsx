import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const MainBanner = () => {
  return (
    <div className='relative w-screen ml-[calc(-50vw+50%)] -mt-0'>
      {/* Background images */}
      <img src={assets.Background1} alt="banner" className='w-full hidden md:block object-cover h-96 md:h-[500px]' />
      <img src={assets.Background2} alt="banner" className='w-full md:hidden object-cover h-96' />
      
      {/* Banner content */}
      <div className='absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-center pb-24 md:pb-0 px-4 md:pl-18 lg:pl-24'>
        <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-center md:text-left max-w-72 md:max-w-80 lg:max-w-105 leading-tight lg:leading-[3.75rem] text-yellow-300'>
          Bringing Quality You Can Trust
        </h1>
        <div className='flex items-center mt-6 font-medium'>
          <Link to="/products" className='group flex items-center gap-2 px-7 md:px-9 py-3 bg-primary hover:bg-primary-dull transition rounded text-white cursor-pointer'>
            Shop now
            <img className='md:hidden transition group-focus:translate-x-1' src={assets.white_arrow_icon} alt="arrow" />
          </Link>
          <Link to="/products" className='group hidden md:flex items-center gap-2 px-9 py-3 cursor-pointer text-yellow-300'>
            Explore deals
            <img className='transition group-hover:translate-x-1' src={assets.black_arrow_icon} alt="arrow" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MainBanner