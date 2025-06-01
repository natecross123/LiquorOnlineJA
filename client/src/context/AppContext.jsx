import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({children})=>{

    const currency = import.meta.env.VITE_CURRENCY;

    const navigate = useNavigate();
    const[user,setUser] = useState(null)
    const[isSeller,setIsSeller] = useState(false)
    const[ShowUserLogin,setShowUserLogin] = useState(false)
    const[products,setProducts] = useState([])

    const[cartItems, setCartItems]= useState({})
    const[searchQuery, setSearchQuery]= useState({})

    //Fetch Seller Status
    const fetchSeller = async ()=> {
        try {
            const {data} = await axios.get('/api/seller/is-auth');
            if(data.success){
                setIsSeller(true)
            }else{
                setIsSeller(false)
            }
        } catch (error) {
            setIsSeller(false)
        }
    }
    // Fetch User Auth status, user data 
    const fetchUser = async ()=>{
        try {
            const{data}= await axios.get('/api/user/is-auth')
            if(data.success){
                setUser(data.user)
                setCartItems(data.user.cartItems)
            }
        } catch (error) {
            setUser(null)
        }
    }



    // Fetch Products
    const fetchProducts = async ()=>{
        try {
            const {data} = await axios.get('/api/product/list')
            if(data.success){
                setProducts(data.products)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            
        }
    }

    //Add Product to cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);
    
        if(cartData[itemId]){
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
    
        setCartItems(cartData);
        toast.success("Added To Cart");
    };
    


// Update cart Items
const updateCartItem =(itemId, quantity)=>{
    let cartData = structuredClone(cartItems);
    cartData[itemId]= quantity;
    setCartItems(cartData)
    toast.success("Cart Updated")
};
// Remove from cart
const removeFromCart = (itemId) => {
    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
        cartData[itemId] -= 1;
        if (cartData[itemId] === 0) {
            delete cartData[itemId];
        }
    }
    toast.success("Removed From Cart")
    setCartItems(cartData)
}

    // Get Cart Item Count 
    const getCartCount = ()=>{
        let totalCount = 0;
        for(const item in cartItems){
            totalCount += cartItems[item];
          }
          return totalCount;
        }
    
        // Get Cart Total Amount
        const getCartAmount =()=> {
            let totalAmount = 0;
            for (const items in cartItems){
                let itemInfo = products.find((product)=> product._id === items);
                if(cartItems [items] > 0){
                    totalAmount += itemInfo.offerPrice * cartItems[items]
                }
            }
            return Math.floor(totalAmount*100)/100;
        }


    useEffect(()=>{
        fetchUser()
        fetchSeller()
        fetchProducts()
    },[])
    // Update Database Cart Items 
    useEffect(()=>{
        const updateCart = async()=>{
            try {
                const{data} = await axios.post('/api/cart/update', {cartItems})
                if(!data.success){
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message) 
            }
        }
        if(user){
            updateCart()
        }
    },[cartItems, user])

    const value = {navigate, user, setUser, setIsSeller,isSeller,ShowUserLogin,setShowUserLogin,products,currency,addToCart,updateCartItem,removeFromCart
        , cartItems,searchQuery,setSearchQuery,getCartCount,getCartAmount,axios, fetchProducts,setCartItems
}
    return <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext);
};