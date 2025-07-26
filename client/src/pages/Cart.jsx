import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const Cart = () => {
    const {products, currency, cartItems, removeFromCart, getCartCount, updateCartItem, navigate, getCartAmount, axios, user, setCartItems} = useAppContext()
    const [cartArray, setCartArray] = useState([])
    const [addresses, setAddresses] = useState([]) 
    const [showAddress, setShowAddress] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [paymentOption, setPaymentOption] = useState("COD")

    const getCart = () => {
        console.log('Processing cart items:', cartItems);
        console.log('Available products:', products?.length || 0);
        
        if (!cartItems || Object.keys(cartItems).length === 0) {
            setCartArray([]);
            return;
        }
        
        if (!products || products.length === 0) {
            console.log('Products not loaded yet');
            return;
        }

        let tempArray = [];
        for (const key in cartItems) {
            if (cartItems[key] <= 0) continue;
            
            // Handle both _id and id field variations
            const product = products.find((item) => {
                const itemId = item._id || item.id;
                return itemId == key || String(itemId) === String(key);
            });
            
            if (product) {
                // Create a safe copy with all necessary fields
                const productCopy = {
                    ...product,
                    _id: product._id || product.id,
                    id: product.id || product._id,
                    quantity: cartItems[key],
                    // Ensure price fields exist and are valid
                    price: product.price || 0,
                    offerPrice: product.offerPrice || null
                };
                tempArray.push(productCopy);
                console.log('Added product to cart:', product.name, 'Quantity:', cartItems[key]);
            } else {
                console.warn(`Product with ID ${key} not found in products list`);
            }
        }
        
        console.log('Final cart array:', tempArray);
        setCartArray(tempArray);
    };

    const getUserAddress = async () => {
        try {
            console.log('Fetching user addresses...');
            const {data} = await axios.get('/api/address/get');
            console.log('Address response:', data);
            
            if (data.success) {
                setAddresses(data.addresses);
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to fetch addresses');
        }
    };
    // Place Order function 
    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                return toast.error("Please select an address");
            }

            if (cartArray.length === 0) {
                return toast.error("Your cart is empty");
            }

            console.log('Placing order with cart items:', cartArray);
            console.log('Selected address:', selectedAddress);

            // Place Order with COD
            if (paymentOption === "COD") {
                const orderData = {
                    items: cartArray.map(item => ({
                        product: item._id || item.id, 
                        quantity: item.quantity
                    })),
                    addressId: selectedAddress.id || selectedAddress._id
                };

                console.log('Order data being sent:', orderData);

                const {data} = await axios.post('/api/order/cod', orderData);

                console.log('Order response:', data);

                if (data.success) {
                    toast.success(data.message);
                    setCartItems({});
                    navigate('/my-orders');
                } else {
                    toast.error(data.message);
                }
            }
            // Handle Online Payment STRIPE
            else if (paymentOption === "Online") {
                const orderData = {
                    items: cartArray.map(item => ({
                        product: item._id || item.id, 
                        quantity: item.quantity
                    })),
                    addressId: selectedAddress.id || selectedAddress._id
                };

                const {data} = await axios.post('/api/order/stripe', orderData);

                if (data.success) {
                    window.location.href = data.url;
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to place order');
        }
    };

    useEffect(() => {
        console.log('Cart useEffect - Products:', products?.length, 'CartItems:', Object.keys(cartItems || {}).length);
        if (cartItems) {
            getCart();
        }
    }, [products, cartItems]);

    useEffect(() => {
        if (user) {
            getUserAddress();
        }
    }, [user]);
    
    // Show loading while products are loading
    if (!products || products.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-lg text-gray-500">Loading products...</div>
            </div>
        );
    }

    // Show empty cart message
    if (!cartItems || Object.keys(cartItems).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
                <button 
                    onClick={() => navigate("/products")} 
                    className="bg-primary text-white px-6 py-3 font-medium hover:bg-primary-dull transition"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    // Show if cart has items but no products found
    if (cartArray.length === 0 && Object.keys(cartItems).length > 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="text-lg text-gray-500 mb-4">Cart items not found</div>
                <div className="text-sm text-gray-400 mb-4">
                    Your cart has items but the products couldn't be loaded
                </div>
                <button 
                    onClick={() => setCartItems({})} 
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                    Clear Cart
                </button>
            </div>
        );
    }

    return cartArray.length > 0 ? (
        <div className="flex flex-col md:flex-row mt-16">
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => {
                    const productId = product._id || product.id;
                    const price = product.offerPrice || product.price || 0;
                    
                    return (
                        <div key={productId || index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                            <div className="flex items-center md:gap-6 gap-3">
                                <div onClick={() => {
                                    navigate(`/products/${product.category?.toLowerCase() || 'all'}/${productId}`); 
                                    scrollTo(0,0);
                                }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded">
                                    <img 
                                        className="max-w-full h-full object-cover" 
                                        src={product.image?.[0] || '/placeholder-image.jpg'} 
                                        alt={product.name || 'Product'} 
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="hidden md:block font-semibold">{product.name}</p>
                                    <div className="font-normal text-gray-500/70">
                                        <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                        <div className='flex items-center'>
                                            <p>Qty:</p>
                                            <select 
                                                onChange={e => updateCartItem(productId, Number(e.target.value))}  
                                                value={product.quantity || 1} 
                                                className='outline-none ml-2'
                                            >
                                                {Array(Math.max(product.quantity || 1, 9)).fill('').map((_, index) => (
                                                    <option key={index} value={index + 1}>{index + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center">
                                {currency}{(price * (product.quantity || 1)).toFixed(2)}
                            </p>
                            <button onClick={() => removeFromCart(productId)} className="cursor-pointer mx-auto">
                                <img src={assets.remove_icon} alt="remove" className="inline-block w-6 h-6" />
                            </button>
                        </div>
                    );
                })}

                <button onClick={() => {navigate("/products"); scrollTo(0,0)}} className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <img className="group-hover:-translate-x-1 transition" src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">
                            {selectedAddress ? 
                                `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.parish}, ${selectedAddress.country}` : 
                                "No address found"
                            }
                        </p>
                        <button onClick={() => setShowAddress(!showAddress)} className="text-primary hover:underline cursor-pointer">
                            Change
                        </button>
                        {showAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                               {addresses.map((address, index) => (
                                <p 
                                    key={address.id || address._id || index}
                                    onClick={() => {setSelectedAddress(address); setShowAddress(false)}} 
                                    className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {address.street}, {address.city}, {address.parish}, {address.country}
                                </p>
                               ))}
                                <p onClick={() => navigate("/add-address")} className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>

                    <select onChange={e => setPaymentOption(e.target.value)} value={paymentOption} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{getCartAmount()}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (15%)</span><span>{currency}{(getCartAmount() * 15 / 100).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span>
                        <span>{currency}{(parseFloat(getCartAmount()) + parseFloat(getCartAmount()) * 15 / 100).toFixed(2)}</span>
                    </p>
                </div>

                <button onClick={placeOrder} className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition">
                    {paymentOption === "COD" ? "Place Order" : "Proceed to Checkout"}
                </button>
            </div>
        </div>
    ) : (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-lg text-gray-500">Loading cart...</div>
        </div>
    );
};

export default Cart;