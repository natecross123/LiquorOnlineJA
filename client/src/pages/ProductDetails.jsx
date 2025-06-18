import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";

const ProductDetails = () => {
    const { products, navigate, currency, addToCart, axios } = useAppContext();
    const { category, id } = useParams();
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    
    // Helper function to format price safely
    const formatPrice = (price) => {
        if (price === null || price === undefined || isNaN(price)) {
            return null;
        }
        return `${currency}${price}`;
    };

    // Find product - simplified approach
    useEffect(() => {
        const findProduct = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            
            // First try to find in context products
            let foundProduct = products.find((item) => {
                const itemId = String(item._id || item.id);
                const searchId = String(id);
                return itemId === searchId;
            });
            
            // If not found and we have products loaded, try API
            if (!foundProduct) {
                try {
                    const response = await axios.get(`/api/product/${id}`);
                    if (response.data.success) {
                        foundProduct = response.data.product;
                    }
                } catch (error) {
                    console.error('Error fetching product:', error);
                }
            }
            
            setProduct(foundProduct);
            setLoading(false);
        };

        findProduct();
    }, [id, products, axios]);

    // Set up related products
    useEffect(() => {
        if (product && products.length > 0) {
            const productsCopy = products.filter((item) => 
                product.category === item.category && 
                String(item._id || item.id) !== String(id)
            );
            setRelatedProducts(productsCopy.slice(0, 5));
        }
    }, [product, products, id]);

    // Set thumbnail
    useEffect(() => {
        if (product?.image?.length > 0) {
            setThumbnail(product.image[0]);
        }
    }, [product]);

    // Loading state
    if (loading) {
        return (
            <div className="mt-12 text-center">
                <h2 className="text-2xl font-medium text-gray-600">Loading...</h2>
            </div>
        );
    }

    // Product not found
    if (!product) {
        return (
            <div className="mt-12 text-center">
                <h2 className="text-2xl font-medium text-gray-600">Product not found</h2>
                <button 
                    onClick={() => navigate('/products')}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull transition"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    const productId = product._id || product.id;
    const displayPrice = formatPrice(product.price);
    const displayOfferPrice = formatPrice(product.offerPrice);

    return (
        <div className="mt-12">
            <p>
                <Link to={"/"}>Home</Link> /
                <Link to={"/products"}> Products</Link> /
                <Link to={`/products/${category}`}> {category}</Link> /
                <span className="text-indigo-500"> {product.name || 'Product'}</span>
            </p>

            <div className="flex flex-col md:flex-row gap-16 mt-4">
                <div className="flex gap-3">
                    <div className="flex flex-col gap-3">
                        {(product.image || []).map((image, index) => (
                            <div 
                                key={index} 
                                onClick={() => setThumbnail(image)} 
                                className="border max-w-24 border-gray-500/30 rounded overflow-hidden cursor-pointer"
                            >
                                <img src={image} alt={`Thumbnail ${index + 1}`} />
                            </div>
                        ))}
                    </div>

                    <div className="border border-gray-500/30 max-w-100 rounded overflow-hidden">
                        {thumbnail && <img src={thumbnail} alt="selected product" />}
                    </div>
                </div>

                <div className="text-sm w-full md:w-1/2">
                    <h1 className="text-3xl font-medium">{product.name || 'Product Name'}</h1>

                    <div className="flex items-center gap-0.5 mt-1">
                        {Array(5).fill('').map((_, i) => (
                            <img 
                                key={i}
                                src={i < 4 ? assets.star_icon : assets.star_dull_icon} 
                                alt="" 
                                className="md:w-4 w-3.5" 
                            />
                        ))}
                        <p className="text-base ml-2">(4)</p>
                    </div>

                    <div className="mt-6">
                        {displayOfferPrice && displayPrice ? (
                            <>
                                <p className="text-gray-500/70 line-through">MRP: {displayPrice}</p>
                                <p className="text-2xl font-medium">MRP: {displayOfferPrice}</p>
                                <span className="text-gray-500/70">(inclusive of all taxes)</span>
                            </>
                        ) : displayOfferPrice ? (
                            <>
                                <p className="text-2xl font-medium">MRP: {displayOfferPrice}</p>
                                <span className="text-gray-500/70">(inclusive of all taxes)</span>
                            </>
                        ) : displayPrice ? (
                            <>
                                <p className="text-2xl font-medium">MRP: {displayPrice}</p>
                                <span className="text-gray-500/70">(inclusive of all taxes)</span>
                            </>
                        ) : (
                            <p className="text-xl text-gray-400">Price not available</p>
                        )}
                    </div>

                    <p className="text-base font-medium mt-6">About Product</p>
                    <ul className="list-disc ml-4 text-gray-500/70">
                        {product.description && Array.isArray(product.description) ? (
                            product.description.map((desc, index) => (
                                <li key={index}>{desc}</li>
                            ))
                        ) : product.description ? (
                            <li>{product.description}</li>
                        ) : (
                            <li>No description available</li>
                        )}
                    </ul>

                    <div className="flex items-center mt-10 gap-4 text-base">
                        <button 
                            onClick={() => addToCart(productId)} 
                            className="w-full py-3.5 cursor-pointer font-medium bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
                        >
                            Add to Cart
                        </button>
                        <button 
                            onClick={() => {
                                addToCart(productId); 
                                navigate("/cart");
                            }} 
                            className="w-full py-3.5 cursor-pointer font-medium bg-primary text-white hover:bg-primary-dull transition"
                        >
                            Buy now
                        </button>
                    </div>
                </div>
            </div>

            {/* Related products */}
            <div className="flex flex-col items-center mt-20">
                <div className="flex flex-col items-center w-max">
                    <p className="text-3xl font-medium">Related Products</p>
                    <div className="w-20 h-0.5 bg-primary rounded-full mt-2"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mt-6 w-full">
                    {relatedProducts.filter((product) => product.inStock).map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))}
                </div>
                <button 
                    onClick={() => {
                        navigate('/products'); 
                        window.scrollTo(0, 0);
                    }}
                    className="mx-auto cursor-pointer px-12 my-16 py-2.5 border rounded text-primary hover:bg-primary/10 transition"
                >
                    See more
                </button>
            </div>
        </div>
    );
};

export default ProductDetails;