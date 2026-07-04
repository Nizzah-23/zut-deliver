/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function BuyerDashboard() {
  const { user, token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingUpdates, setTrackingUpdates] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/buyer/products', { headers });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/buyer/orders', { headers });
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  // Listen for real-time location updates
  useEffect(() => {
    socket.on('order_location', (data) => {
      setTrackingUpdates(prev => ({
        ...prev,
        [data.order_id]: {
          location: data.location,
          status: data.status
        }
      }));
      setMessage(`🚴 Live update: ${data.location}`);
      setTimeout(() => setMessage(''), 5000);
    });
    return () => socket.off('order_location');
  }, []);

  const trackOrder = (order_id) => {
    socket.emit('track_order', order_id);
    setMessage(`📍 Now tracking Order #${order_id} in real-time!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.product_id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.product_id
        ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setMessage(`${product.name} added to cart!`);
    setTimeout(() => setMessage(''), 2000);
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter(i => i.product_id !== product_id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return setMessage('Your cart is empty!');
    if (!deliveryAddress) return setMessage('Please enter delivery address!');
    setLoading(true);
    try {
      const seller_id = cart[0].seller_id;
      const items = cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity
      }));
      await axios.post('http://localhost:5000/api/buyer/orders',
        { seller_id, delivery_address: deliveryAddress, items },
        { headers }
      );
      setMessage('✅ Order placed successfully!');
      setCart([]);
      setDeliveryAddress('');
      fetchOrders();
      setActiveTab('orders');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>🛵 ZUT Deliver</h1>
        <div className="navbar-right">
          <span>👤 {user?.name} (Buyer)</span>
          <button className="btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {message && (
          <div className="error-msg" style={{background:'#d4edda', color:'#155724'}}>
            {message}
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}>🛍️ Browse Products</button>
          <button className={`tab ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}>🛒 Cart ({cart.length})</button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}>📦 My Orders</button>
        </div>

        {activeTab === 'browse' && (
          <div>
            <p className="section-title">Available Products</p>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.product_id} className="product-card">
                  <h3>{product.name}</h3>
                  <div className="price">K{product.price}</div>
                  <p>{product.description}</p>
                  <p>Stock: {product.stock}</p>
                  <p>Seller: {product.seller_name}</p>
                  <button className="btn btn-primary" style={{marginTop:'12px'}}
                    onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              ))}
              {products.length === 0 && <p>No products available.</p>}
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div>
            <p className="section-title">Your Cart</p>
            {cart.length === 0 ? <p>Your cart is empty.</p> : (
              <div>
                {cart.map(item => (
                  <div key={item.product_id} className="card">
                    <h3>{item.name}</h3>
                    <p>Price: K{item.price} × {item.quantity}</p>
                    <p>Subtotal: K{(item.price * item.quantity).toFixed(2)}</p>
                    <button className="btn-danger" style={{marginTop:'8px'}}
                      onClick={() => removeFromCart(item.product_id)}>
                      Remove
                    </button>
                  </div>
                ))}
                <div className="card">
                  <h3>Total: K{getTotal()}</h3>
                  <div className="form-group" style={{marginTop:'16px'}}>
                    <label>Delivery Address</label>
                    <input
                      placeholder="e.g. Campus Hostel Block C, Room 12"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={placeOrder} disabled={loading}>
                    {loading ? 'Placing Order...' : `Place Order - K${getTotal()}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <p className="section-title">My Orders</p>
            {orders.map(order => (
              <div key={order.order_id} className="card">
                <h3>Order #{order.order_id}</h3>
                <p>Total: K{order.total_amount}</p>
                <p>Address: {order.delivery_address}</p>
                <p>Seller: {order.seller_name}</p>
                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                <span className={`badge badge-${order.status}`}>
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>

                {/* REAL-TIME TRACKING */}
                {order.status === 'out_for_delivery' && (
                  <div style={{marginTop:'12px', padding:'12px',
                    background:'#f0f8ff', borderRadius:'8px'}}>
                    <button className="btn btn-secondary"
                      style={{width:'auto', padding:'8px 16px', marginBottom:'8px'}}
                      onClick={() => trackOrder(order.order_id)}>
                      📍 Track Live
                    </button>
                    {trackingUpdates[order.order_id] && (
                      <div style={{marginTop:'8px'}}>
                        <p style={{fontWeight:'600', color:'#0f3460'}}>
                          🚴 Live Location:
                        </p>
                        <p>{trackingUpdates[order.order_id].location}</p>
                        <p>Status: {trackingUpdates[order.order_id].status}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && <p>No orders yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerDashboard;