import React from 'react';
import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Login from './components/Login';
import Navbar from './components/Navbar';
import { useAppContext } from './context/AppContext';
import AddAddress from './pages/AddAddress';
import AllProducts from './pages/AllProducts';
import Cart from './pages/Cart';
import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import ProductCategory from './pages/ProductCategory';
import ProductDetails from './pages/ProductDetails';

const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller");
  const{ShowUserLogin} = useAppContext()

  return (
    <div>

      {isSellerPath ? null: <Navbar />}
      {ShowUserLogin ? <Login/> : null }

<Toaster/>

      <div className={`${isSellerPath? "": "px-6 md:px-16 lg:px-24 xl:px-32"}`}>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/products' element={<AllProducts/>}/>
        <Route path='/products/:category' element={<ProductCategory/>}/>
        <Route path='/products/:category/:id' element={<ProductDetails/>}/>
        <Route path='/Cart' element={<Cart/>}/>
        <Route path='/add-address' element={<AddAddress/>}/>
        <Route path='/my-orders' element={<MyOrders/>}/>

      </Routes>
      </div>
      {!isSellerPath && <Footer/>}
    </div>
  )
}

export default App
