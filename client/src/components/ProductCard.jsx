import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ product }) => {
  const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext();

  if (!product) return null;

  // Get consistent product ID
  const productId = product._id || product.id;

  return (
    <div
      onClick={() => {
        navigate(`/products/${product.category.toLowerCase()}/${productId}`);
        window.scrollTo(0, 0);
      }}
      className="border border-gray-500/20 rounded-md px-3 py-2 bg-white w-56 cursor-pointer"
    >
      {/* Image */}
      <div className="group flex items-center justify-center px-2 h-40">
        <img
          className="group-hover:scale-105 transition h-36 object-contain"
          src={product.image?.[0] || ''}
          alt={product.name || 'Product'}
        />
      </div>  

      {/* Details */}
      <div className="text-gray-500/60 text-sm mt-2">
        <p>{product.category || 'Category'}</p>
        <p className="text-gray-700 font-medium text-lg truncate w-full overflow-hidden whitespace-nowrap">
          {product.name || 'Product Name'}
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

        {/* Price */}
        <div className="flex items-end justify-between mt-3">
          <p className="md:text-xl text-base font-medium text-primary flex flex-wrap gap-1">
            {product.offerPrice && product.price ? (
              <>
                {currency}{product.offerPrice}
                <span className="text-gray-500/60 md:text-sm text-xs line-through">
                  {currency}{product.price}
                </span>
              </>
            ) : product.offerPrice ? (
              <>
                {currency}{product.offerPrice}
              </>
            ) : product.price ? (
              <>
                {currency}{product.price}
              </>
            ) : null}
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