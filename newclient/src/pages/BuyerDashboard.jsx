/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function BuyerDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [cart, setCart] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // REAL-TIME LISTENER for orders
  useEffect(() => {
    if (!user?.uid) return;

    fetchProducts();

    const q = query(collection(db, 'orders'), where('buyer_id', '==', user?.uid));

    // onSnapshot listens for real-time changes
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, ...doc.data() });
      });

      // Check for status changes and notify buyer
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedOrder = change.doc.data();
          const orderId = change.doc.id;

          if (updatedOrder.status === 'confirmed') {
            showNotification(
              `Your order #${orderId.slice(0, 8)}... has been CONFIRMED by the seller!`,
              'success'
            );
          } else if (updatedOrder.status === 'cancelled') {
            showNotification(
              `Your order #${orderId.slice(0, 8)}... has been CANCELLED.`,
              'error'
            );
          } else if (updatedOrder.status === 'out_for_delivery') {
            showNotification(
              `Your order #${orderId.slice(0, 8)}... is OUT FOR DELIVERY!`,
              'success'
            );
          } else if (updatedOrder.status === 'delivered') {
            showNotification(
              `Your order #${orderId.slice(0, 8)}... has been DELIVERED!`,
              'success'
            );
          }
        }
      });

      setOrders(ordersList);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [user?.uid]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 6000);
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
  name: i.name,
  quantity: i.quantity,
  price: i.price
}));
      

      await addDoc(collection(db, 'orders'), {
  buyer_id: user?.uid,
  buyer_name: user?.name || user?.displayName || 'Unknown',
  buyer_phone: user?.phone || 'N/A',
  seller_id: seller_id,
  items: items,
  total_amount: parseFloat(getTotal()),
  delivery_address: deliveryAddress,
  status: 'pending',
  created_at: serverTimestamp()
});
      

      setMessage('Order placed successfully!');
      setCart([]);
      setDeliveryAddress('');
      setActiveTab('orders');
    } catch (err) {
      console.error('Order error:', err);
      setMessage('Failed to place order');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', color: '#d97706' };
    if (status === 'confirmed') return { bg: '#d1fae5', color: '#0d9488' };
    if (status === 'out_for_delivery') return { bg: '#dbeafe', color: '#2563eb' };
    if (status === 'delivered') return { bg: '#d1fae5', color: '#059669' };
    if (status === 'cancelled') return { bg: '#fee2e2', color: '#dc2626' };
    return { bg: '#d1fae5', color: '#0d9488' };
  };

  return (
    <div style={{minHeight: '100vh', background: '#f0fdfa', fontFamily: 'Inter, sans-serif'}}>

      {/* REAL-TIME NOTIFICATION BANNER */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'success'
            ? 'linear-gradient(135deg, #0d9488, #10b981)'
            : '#ef4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          maxWidth: '350px',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'slideIn 0.5s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{fontSize: '20px'}}>
            {notification.type === 'success' ? '✓' : '!'}
          </span>
          <div>
            <p style={{margin: 0, fontWeight: '700', marginBottom: '4px'}}>
              Order Update
            </p>
            <p style={{margin: 0, fontSize: '13px', opacity: 0.9}}>
              {notification.msg}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              marginLeft: 'auto'
            }}
          >
            x
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        background: 'white',
        padding: '20px 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          ZUT Deliver
        </h1>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
          <span style={{color: '#0f766e', fontWeight: '600'}}>
            {user?.name || user?.displayName || 'User'} (Buyer)
          </span>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#ef4444',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>
        {message && (
          <div style={{
            background: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
            color: message.includes('successfully') ? '#0d9488' : '#dc2626',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '2px solid #d1fae5',
          paddingBottom: '16px'
        }}>
          {['browse', 'cart', 'orders'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab
                  ? 'linear-gradient(135deg, #0d9488, #10b981)'
                  : 'white',
                color: activeTab === tab ? 'white' : '#0f766e',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab === 'browse' && 'Browse Products'}
              {tab === 'cart' && `Cart (${cart.length})`}
              {tab === 'orders' && `My Orders (${orders.length})`}
            </button>
          ))}
        </div>

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>Available Products</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {products.map(product => (
                <div
                  key={product.product_id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '2px solid #d1fae5',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(13,148,136,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <h3 style={{color: '#0f172a', marginBottom: '8px'}}>{product.name}</h3>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: '#0d9488',
                    marginBottom: '12px'
                  }}>
                    K{product.price}
                  </div>
                  <p style={{color: '#0f766e', fontSize: '14px', marginBottom: '8px'}}>
                    {product.description}
                  </p>
                  <p style={{color: '#0f766e', fontSize: '13px', marginBottom: '4px'}}>
                    Stock: {product.stock}
                  </p>
                  <p style={{color: '#0f766e', fontSize: '13px', marginBottom: '16px'}}>
                    Seller: {product.seller_name || 'Unknown'}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0d9488, #10b981)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p style={{color: '#0f766e', gridColumn: '1 / -1', textAlign: 'center'}}>
                  No products available.
                </p>
              )}
            </div>
          </div>
        )}

        {/* CART TAB */}
        {activeTab === 'cart' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>Your Cart</h2>
            {cart.length === 0 ? (
              <p style={{color: '#0f766e', textAlign: 'center', padding: '40px'}}>
                Your cart is empty.
              </p>
            ) : (
              <div>
                {cart.map(item => (
                  <div
                    key={item.product_id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '16px',
                      border: '2px solid #d1fae5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{color: '#0f172a', marginBottom: '8px'}}>{item.name}</h3>
                      <p style={{color: '#0f766e', fontSize: '14px', marginBottom: '4px'}}>
                        Price: K{item.price} x {item.quantity}
                      </p>
                      <p style={{color: '#0d9488', fontWeight: '600'}}>
                        Subtotal: K{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div style={{
                  background: 'linear-gradient(135deg, #f0fdfa, #d1fae5)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px',
                  border: '2px solid #d1fae5'
                }}>
                  <h3 style={{color: '#0d9488', fontSize: '24px', marginBottom: '20px'}}>
                    Total: K{getTotal()}
                  </h3>
                  <div style={{marginBottom: '16px'}}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#0f172a'
                    }}>
                      Delivery Address
                    </label>
                    <input
                      placeholder="e.g. Campus Hostel Block C, Room 12"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '2px solid #0d9488',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0d9488, #10b981)',
                      color: 'white',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      fontSize: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? 'Placing Order...' : `Place Order - K${getTotal()}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>My Orders</h2>
            {orders.map(order => {
              const statusStyle = getStatusColor(order.status);
              return (
                <div
                  key={order.order_id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '16px',
                    border: '2px solid #d1fae5',
                    borderLeft: `4px solid ${statusStyle.color}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div>
                      <h3 style={{color: '#0f172a', marginBottom: '12px'}}>
                        Order #{order.order_id.slice(0, 8)}...
                      </h3>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>
                        Total: <span style={{fontWeight: '600', color: '#0d9488'}}>
                          K{order.total_amount}
                        </span>
                      </p>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>
                        Address: {order.delivery_address}
                      </p>
                      {order.created_at && (
                        <p style={{color: '#0f766e', fontSize: '13px'}}>
                          Date: {new Date(order.created_at.toDate()).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* STATUS BADGE */}
                    <div style={{textAlign: 'right'}}>
                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        {order.status?.toUpperCase().replace(/_/g, ' ')}
                      </span>

                      {/* STATUS MESSAGE */}
                      {order.status === 'pending' && (
                        <p style={{fontSize: '12px', color: '#d97706'}}>
                          Waiting for seller...
                        </p>
                      )}
                      {order.status === 'confirmed' && (
                        <p style={{fontSize: '12px', color: '#0d9488', fontWeight: '600'}}>
                          Seller confirmed your order!
                        </p>
                      )}
                      {order.status === 'delivered' && (
                        <p style={{fontSize: '12px', color: '#059669', fontWeight: '600'}}>
                          Order delivered!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && (
              <p style={{color: '#0f766e', textAlign: 'center', padding: '40px'}}>
                No orders yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerDashboard;