import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
    const [open, setOpen] = React.useState(false)
    const{user, setUser,setShowUserLogin,navigate, setSearchQuery, searchQuery,getCartCount, axios } = useAppContext();

    const logout=async()=>{
        try {
            const{data} = await axios.get('/api/user/logout')
            if(data.success){
                toast.success(data.message)
                setUser(null);
                navigate('/')

            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during logout");
        }
        setUser(null);
        navigate('/')
    }
    useEffect(() => {
        if (searchQuery.length > 0) {
            navigate("/products");
        }
    }, [searchQuery, navigate]);
    

  return (
   <nav className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 xl:px-8 py-1.5 border-b border-gray-300 bg-white relative transition-all">


    <NavLink to='/' onClick={()=> setOpen(false)} className="ml-0">
    <img className="h-18 object-contain" src={assets.LogoJA} alt="logo" />
    </NavLink>



    {/* Desktop Menu */}
    <div className="hidden sm:flex items-center gap-8">

        <NavLink to= '/' className="font-bold hover:text-primary transition-colors">Home</NavLink>
        <NavLink to= '/products' className="font-bold hover:text-primary transition-colors">Allproduct</NavLink>
         <NavLink to= '/Aboutus' className="font-bold hover:text-primary transition-colors">About Us</NavLink>
        <NavLink to= '/Faq' className="font-bold hover:text-primary transition-colors">FAQ</NavLink>
      

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full w-[500px]">
            <input onChange={(e)=> setSearchQuery(e.target.value)} className="py-2 w-full bg-transparent outline-none placeholder-gray-500 font-medium" type="text" placeholder="Search products..." />
            <img src={assets.search_icon} alt ='search' className='w-4 h-4'/>

        </div>

        <div onClick={()=> navigate("/cart")}className="relative cursor-pointer">
            <img src = {assets.nav_cart_icon}alt='cart' className= 'w-6 opacity-80'/>
            <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full font-bold">{getCartCount()}</button>
        </div>
{!user ?( <button onClick={()=> setShowUserLogin(true)} className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary transition text-white rounded-full font-bold">
            Login
        </button>)
        :
        (
            <div className='relative group'>
                <img src={assets.profile_icon} className='w-10' alt="" />
                <ul className= 'hidden group-hover:block absolute top-10 right-0 bg-white shadow border border-gray-200 py-2.5 w-30 rounded-md text-sm z-40' >
                    <li onClick={()=> navigate("my-orders")} className='p-1.5 p1-3 hover:bg-primary/10 cursor-pointer font-medium'>My Orders</li>
                    <li onClick={logout} className='p-1.5 p1-3 hover:bg-primary/10 cursor-pointer font-medium'>Logout</li>
                </ul>
            </div>
        )}
    </div>
        <div  className ='flex items-center gap-6 sm:hidden'>
        <div onClick={()=> navigate("/cart")}className="relative cursor-pointer">
            <img src = {assets.nav_cart_icon}alt='cart' className= 'w-6 opacity-80'/>
            <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full font-bold">{getCartCount()}</button>
    </div>
        <button onClick={() => open ? setOpen(false) : setOpen(true)} aria-label="Menu" className="">
        <img src={assets.menu_icon} alt='menu'/>
    </button>
    </div>
  

    {/* Mobile Menu */}
    {open &&(
        <div className={`${open ? 'flex' : 'hidden'} absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden`}>
       <NavLink to="/" onClick={()=> setOpen(false)} className="font-bold hover:text-primary transition-colors">Home</NavLink>
       <NavLink to="/products" onClick={()=> setOpen(false)} className="font-bold hover:text-primary transition-colors">All product</NavLink>
       {user &&
       <NavLink to="/products" onClick={()=> setOpen(false)} className="font-bold hover:text-primary transition-colors">My Orders</NavLink>
        }
        <NavLink to="/products" onClick={()=> setOpen(false)} className="font-bold hover:text-primary transition-colors">Contact</NavLink>

        {!user ?(
            <button onClick = {()=>{
                setOpen(false);
                setShowUserLogin(true);
            }} className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm font-bold">
            Login
            </button>
        ) : (
            <button onClick={logout} className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm font-bold">
            Logout
            </button>
        )}
       
    </div>)}

</nav>
  )
}

export default Navbar