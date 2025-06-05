import React from 'react';
import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Login from './components/Login';
import Navbar from './components/Navbar';
import SellerLogin from './components/seller/SellerLogin';
import { useAppContext } from './context/AppContext';
import AddAddress from './pages/AddAddress';
import AllProducts from './pages/AllProducts';
import Cart from './pages/Cart';
import Home from './pages/Home';
import MyOrders from './pages/MyOrders';
import ProductCategory from './pages/ProductCategory';
import ProductDetails from './pages/ProductDetails';
import AddProduct from './pages/seller/AddProduct';
import Orders from './pages/seller/Orders';
import ProductList from './pages/seller/ProductList';
import SellerLayout from './pages/seller/SellerLayout';
import Faq from './pages/Faq'; 
import Aboutus from './pages/Aboutus'; 
const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller");
  const{ShowUserLogin , isSeller} = useAppContext()

  return (
    <div className='text-default min-h-screen text-gray-700 bg-white'>

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
  <Route path='/Faq' element={<Faq/>}/>
  <Route path='/Aboutus' element={<Aboutus/>}/>
  <Route path='/seller' element={isSeller ? <SellerLayout/> : <SellerLogin/>}>
    <Route index element={isSeller ? <AddProduct/> : null}/>
    <Route path='product-list' element={<ProductList/>}/>
    <Route path='orders' element={<Orders/>}/>
  </Route>
</Routes>
      </div>
      {!isSellerPath && <Footer/>}
    </div>
  )
}

export default App

