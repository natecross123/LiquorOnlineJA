import React from 'react';
import { useParams } from 'react-router-dom';
import { categories } from '../assets/assets';
import ProductCard from '../components/ProductCard';
import { useAppContext } from '../context/AppContext';

const ProductCategory = () => {
  const { products } = useAppContext();
  const { category } = useParams();

  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === category
  );

  const filteredProducts = products.filter(
    (product) => product.category.toLowerCase() === category
  );

  return (
    <div className='mt-16 flex flex-col'>
      {searchCategory && (
        <div className='flex flex-col items-end w-max'>
          <p className='text-2xl font-medium uppercase'>{searchCategory.text}</p>
          <div className='w-16 h-0.5 bg-primary rounded-full'></div>
        </div>
      )}

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6'>
        {filteredProducts
          .filter(product => product.inStock)
          .map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
      </div>
    </div>
  );
};

export default ProductCategory;
