/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function BuyerDashboard() {
  const { user, token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch products from Firestore
  const fetchProducts = useCallback(async () => {
    try {
      const q = query(collection(db, 'products'), where('stock', '>', 0));
      const querySnapshot = await getDocs(q);
      const productsList = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ product_id: doc.id, ...doc.data() });
      });
      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching products:', err);
      setMessage('Failed to load products');
    }
  }, []);

  // Fetch orders from Firestore
  const fetchOrders = useCallback(async () => {
    try {
      const q = query(collection(db, 'orders'), where('buyer_id', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, ...doc.data() });
      });
      setOrders(ordersList);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchProducts();
      fetchOrders();
    }
  }, [user?.uid, fetchProducts, fetchOrders]);

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
        quantity: i.quantity,
        price: i.price
      }));

      await addDoc(collection(db, 'orders'), {
        buyer_id: user?.uid,
        seller_id: seller_id,
        items: items,
        total_amount: parseFloat(getTotal()),
        delivery_address: deliveryAddress,
        status: 'pending',
        created_at: serverTimestamp()
      });

      setMessage('✅ Order placed successfully!');
      setCart([]);
      setDeliveryAddress('');
      fetchOrders();
      setActiveTab('orders');
    } catch (err) {
      console.error('Order error:', err);
      setMessage('Failed to place order');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>🛵 ZUT Deliver</h1>
        <div className="navbar-right">
          <span>👤 {user?.displayName || 'User'} (Buyer)</span>
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
                  <p>Seller: {product.seller_name || 'Unknown'}</p>
                  <button className="btn btn-primary" style={{marginTop:'12px'}}
                    onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              ))}
              {products.length === 0 && <p>No products available. Add some to Firestore!</p>}
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
                <p>Status: {order.status?.toUpperCase()}</p>
                {order.created_at && (
                  <p>Date: {new Date(order.created_at.toDate()).toLocaleDateString()}</p>
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