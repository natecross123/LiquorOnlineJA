import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency, axios, user } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching user orders...');
      const { data } = await axios.get(`/api/order/user`);
      console.log('Orders response:', data);
      
      if (data.success) {
        // Filter out items with null/undefined products
        const ordersWithValidItems = data.orders.map(order => ({
          ...order,
          items: order.items.filter(item => item.product && (item.product._id || item.product.id))
        })).filter(order => order.items.length > 0); // Remove orders with no valid items
        
        console.log('Processed orders:', ordersWithValidItems);
        setMyOrders(ordersWithValidItems);
      } else {
        console.error('Failed to fetch orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressSteps = (status) => {
    const steps = [
      { name: 'Order Placed' },
      { name: 'Shipped' },
      { name: 'Delivered' }
    ];

    const currentStepIndex = steps.findIndex(step => step.name === status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex
    }));
  };

  if (loading) {
    return (
      <div className="mt-16 pb-16">
        <div className="flex flex-col items-end w-max mb-8">
          <p className="text-2xl font-medium uppercase">My orders</p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Show message if no orders
  if (myOrders.length === 0) {
    return (
      <div className="mt-16 pb-16">
        <div className="flex flex-col items-end w-max mb-8">
          <p className="text-2xl font-medium uppercase">My orders</p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16">
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {myOrders.map((order, index) => (
        <div key={order._id || order.id || index} className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl">
          
          {/* Order Header */}
          <div className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col mb-4">
            <span>OrderId : {order._id || order.id}</span>
            <span>Payment : {order.paymentType}</span>
            <span>Total Amount : {currency}{order.amount}</span>
          </div>

          {/* Order Status Progress */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800">Order Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            {/* Progress Bar */}
            {order.status !== 'Cancelled' && (
              <div className="flex items-center justify-between relative">
                {getProgressSteps(order.status).map((step, stepIndex) => (
                  <div key={stepIndex} className="flex flex-col items-center flex-1 relative">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10
                      ${step.completed 
                        ? 'bg-green-500 text-white' 
                        : step.current 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-600'}
                    `}>
                      {step.completed ? '✓' : stepIndex + 1}
                    </div>
                    <span className={`text-xs mt-1 ${step.completed || step.current ? 'text-gray-800' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                    {stepIndex < getProgressSteps(order.status).length - 1 && (
                      <div className={`
                        absolute h-0.5 w-full top-4 left-1/2 transform translate-x-1/2
                        ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
                      `} style={{ width: 'calc(100% - 1rem)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Items */}
          {order.items.map((item, itemIndex) => {
            // Additional safety check for individual items
            if (!item.product || (!item.product._id && !item.product.id)) {
              return (
                <div key={itemIndex} className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                  <p className="text-red-600">Product information unavailable (possibly deleted)</p>
                </div>
              );
            }

            return (
              <div
                key={itemIndex}
                className={`relative bg-white text-gray-500/70 ${
                  order.items.length !== itemIndex + 1 && "border-b"
                } border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`}
              >
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <img 
                      src={item.product.image?.[0] || '/placeholder-image.jpg'} 
                      alt={item.product.name || 'Product'} 
                      className="w-16 h-16 object-cover" 
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-medium text-gray-800">
                      {item.product.name || 'Product Name Unavailable'}
                    </h2>
                    <p>Category: {item.product.category || 'Unknown'}</p>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0">
                  <p>Quantity: {item.quantity || "1"}</p>
                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  
                  {/* Show delivery dates if available */}
                  {order.shippedAt && (
                    <p className="text-sm text-yellow-600">
                      Shipped: {new Date(order.shippedAt).toLocaleDateString()}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-sm text-green-600">
                      Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <p className="text-primary text-lg font-medium">
                  Amount: {currency}{(item.product.offerPrice || item.product.price || 0) * (item.quantity || 1)}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MyOrders;