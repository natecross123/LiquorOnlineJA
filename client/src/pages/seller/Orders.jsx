import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';

const Orders = () => {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({});

  const fetchOrders = async () => {
    try {
      console.log('Fetching seller orders...');
      const { data } = await axios.get('/api/order/seller');
      console.log('Seller orders response:', data);
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(prev => ({ ...prev, [orderId]: true }));
    
    try {
      console.log('Updating order status:', { orderId, newStatus });
      const { data } = await axios.put(`/api/order/status/${orderId}`, {
        status: newStatus
      });
      
      console.log('Update response:', data);
      
      if (data.success) {
        toast.success(data.message);
        // Update the local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            (order._id === orderId || order.id === orderId)
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableActions = (currentStatus) => {
    switch (currentStatus) {
      case 'Order Placed':
        return [
          { status: 'Shipped', label: 'Mark as Shipped', color: 'bg-yellow-600 hover:bg-yellow-700' }
        ];
      case 'Shipped':
        return [
          { status: 'Delivered', label: 'Mark as Delivered', color: 'bg-green-600 hover:bg-green-700' }
        ];
      case 'Delivered':
        return [];
      case 'Cancelled':
        return [];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
      <div className="md:p-10 p-4 space-y-4">
        <h2 className="text-lg font-medium">Orders List</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        ) : (
          orders.map((order, index) => {
            const orderId = order._id || order.id;
            
            return (
              <div key={orderId || index} className="flex flex-col gap-5 p-5 max-w-6xl rounded-md border border-gray-300">
                
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-5 max-w-80">
                    <img className="w-12 h-12 object-cover" src={assets.box_icon} alt="boxIcon" />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order ID: {orderId}</p>
                      {order.items && order.items.map((item, itemIndex) => {
                        // Check if product exists
                        if (!item.product || (!item.product._id && !item.product.id)) {
                          return (
                            <div key={itemIndex} className="text-red-600 text-sm">
                              Product unavailable (possibly deleted)
                            </div>
                          );
                        }
                        
                        return (
                          <div key={itemIndex} className="flex flex-col">
                            <p className="font-medium">
                              {item.product.name || 'Unknown Product'}
                              <span className="text-primary"> x {item.quantity || 1}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Order Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="text-sm md:text-base text-black/60">
                    {order.address ? (
                      <>
                        <p className="text-black/80">
                          {order.address.firstName} {order.address.lastName}
                        </p>
                        <p>{order.address.street}, {order.address.city}</p>
                        <p>{order.address.parish}, {order.address.country}</p>
                        <p>{order.address.phone}</p>
                      </>
                    ) : (
                      <p className="text-red-600">Address information unavailable</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="font-medium text-lg">{currency}{order.amount}</p>
                    <div className="flex flex-col text-sm">
                      <p>Method: {order.paymentType}</p>
                      <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>Payment: {order.isPaid ? "Paid" : "Pending"}</p>
                      {order.user && <p>Customer: {order.user.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  {getAvailableActions(order.status).map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={() => updateOrderStatus(orderId, action.status)}
                      disabled={loading[orderId]}
                      className={`
                        px-4 py-2 text-white text-sm rounded-md font-medium
                        ${action.color}
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200
                      `}
                    >
                      {loading[orderId] ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        action.label
                      )}
                    </button>
                  ))}
                  
                  {/* Cancel Button - only show for non-delivered/non-cancelled orders */}
                  {!['Delivered', 'Cancelled'].includes(order.status) && (
                    <button
                      onClick={() => updateOrderStatus(orderId, 'Cancelled')}
                      disabled={loading[orderId]}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading[orderId] ? 'Updating...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;