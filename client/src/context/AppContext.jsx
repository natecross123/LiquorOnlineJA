import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";

export const AppContext = createContext();

export const AppContextProvider = ({children})=>{

    const currency = import.meta.VITE_CURRECY;

    const navigate = useNavigate();
    const[user,setUser] = useState(null)
    const[isSeller,setIsSeller] = useState(false)
    const[ShowUserLogin,setShowUserLogin] = useState(false)
    const[products,setProducts] = useState([])

    const[cartItems, setCartItems]= useState({})
    const[searchQuery, setSearchQuery]= useState({})

    // Fetch Products
    const fetchProducts = async ()=>{
        setProducts(dummyProducts)
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
        fetchProducts()
    },[]);

    const value = {navigate, user, setUser, setIsSeller,isSeller,ShowUserLogin,setShowUserLogin,products,currency,addToCart,updateCartItem,removeFromCart
        , cartItems,searchQuery,setSearchQuery,getCartCount,getCartAmount
    }
    return <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext);
};