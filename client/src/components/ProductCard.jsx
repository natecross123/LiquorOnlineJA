import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ product }) => {
  const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext();

  // Add safety check for product
  if (!product) {
    return null;
  }

  // Safe property access with fallbacks
  const productId = product._id || product.id;
  const productName = product.name || '';
  const productCategory = product.category || '';
  const productImage = product.image?.[0] || '';

  // Helper function to format price safely
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return null;
    }
    return `${currency}${price}`;
  };

  const displayPrice = formatPrice(product.price);
  const displayOfferPrice = formatPrice(product.offerPrice);

  return (
    <div
      onClick={() => {
        // Debug logging
        console.log('ProductCard clicked:', {
          productId,
          productCategory,
          navigationPath: `/products/${productCategory.toLowerCase()}/${productId}`
        });
        
        // Navigate to product details page - Fixed to match route structure /products/:category/:id
        navigate(`/products/${productCategory.toLowerCase()}/${productId}`);
        window.scrollTo(0, 0);
      }}
      className="border border-gray-500/20 rounded-md px-3 py-2 bg-white w-56 cursor-pointer"
    >
      {/* Image */}
      <div className="group flex items-center justify-center px-2 h-40">
        <img
          className="group-hover:scale-105 transition h-36 object-contain"
          src={productImage}
          alt={productName}
        />
      </div>

      {/* Details */}
      <div className="text-gray-500/60 text-sm mt-2">
        <p>{productCategory}</p>
        <p className="text-gray-700 font-medium text-lg truncate w-full overflow-hidden whitespace-nowrap">
          {productName}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-1">
          {Array(5).fill('').map((_, i) => (
            <img
              key={i}
              className="md:w-3.5 w-3"
              src={i < 4 ? assets.star_icon : assets.star_dull_icon}
              alt=""
            />
          ))}
          <p>(4)</p>
        </div>

        {/* Price - Fixed to handle null/undefined properly */}
        <div className="flex items-end justify-between mt-3">
          <p className="md:text-xl text-base font-medium text-primary flex flex-wrap gap-1">
            {displayOfferPrice && displayPrice ? (
              // Both prices available - show offer price with crossed out original
              <>
                {displayOfferPrice}
                <span className="text-gray-500/60 md:text-sm text-xs line-through">
                  {displayPrice}
                </span>
              </>
            ) : displayOfferPrice ? (
              // Only offer price available
              displayOfferPrice
            ) : displayPrice ? (
              // Only regular price available
              displayPrice
            ) : (
              // No prices available
              <span className="text-gray-400 text-xs">Price not available</span>
            )}
          </p>

          {/* Add to Cart */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="text-primary"
          >
            {!cartItems[productId] ? (
              <button
                className="flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 md:w-[80px] w-[64px] h-[34px] rounded"
                onClick={() => addToCart(productId)}
              >
                <img src={assets.cart_icon} alt="cart_icon" />
                Add
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 md:w-20 w-16 h-[34px] bg-primary/25 rounded select-none">
                <button
                  onClick={() => removeFromCart(productId)}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  -
                </button>
                <span className="w-5 text-center">{cartItems[productId]}</span>
                <button
                  onClick={() => addToCart(productId)}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;