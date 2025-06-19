import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const RemoveProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const { axios } = useAppContext();

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('/api/product/list');
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Remove product
  const removeProduct = async (productId) => {
    try {
      const { data } = await axios.delete(`/api/product/remove/${productId}`);
      if (data.success) {
        toast.success(data.message);
        // Refresh the product list
        fetchProducts();
        setSelectedProduct('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to remove product');
    }
  };

  // Handle remove button click
  const handleRemove = () => {
    if (!selectedProduct) {
      toast.error('Please select a product to remove');
      return;
    }

    if (window.confirm('Are you sure you want to remove this product?')) {
      removeProduct(selectedProduct);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex items-center justify-center">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
      <div className="md:p-10 p-4 space-y-5 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800">Remove Product</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-base font-medium" htmlFor="product-select">
              Select Product to Remove
            </label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ${product.price}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="border rounded-lg p-4 bg-gray-50">
              {(() => {
                const product = products.find(p => p._id === selectedProduct);
                return product ? (
                  <div className="flex items-start gap-4">
                    {product.image && product.image[0] && (
                      <img
                        src={product.image[0]}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Price: ${product.price}</span>
                        {product.offerPrice && (
                          <span className="text-green-600">Offer: ${product.offerPrice}</span>
                        )}
                        <span className="text-gray-500">Category: {product.category}</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <button
            onClick={handleRemove}
            disabled={!selectedProduct}
            className={`px-8 py-2.5 font-medium rounded cursor-pointer transition-colors ${
              selectedProduct
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Remove Product
          </button>
        </div>

        {products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveProduct;