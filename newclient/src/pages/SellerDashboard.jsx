/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function SellerDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', image_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const q = query(collection(db, 'products'), where('seller_id', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const productsList = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ product_id: doc.id, ...doc.data() });
      });
      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching products:', err);
      showMessage('Failed to load products', 'error');
    }
  }, [user?.uid]);

  // Real-time listener for orders
  useEffect(() => {
    if (!user?.uid) return;

    fetchProducts();

    const q = query(collection(db, 'orders'), where('seller_id', '==', user?.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, ...doc.data() });
      });

      // Alert seller when new order arrives
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          if (order.status === 'pending') {
            setNewOrderAlert(`New order received! Total: K${order.total_amount}`);
            setTimeout(() => setNewOrderAlert(null), 6000);
          }
        }
      });

      setOrders(ordersList);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name) return showMessage('Product name is required!', 'error');
    if (!form.price) return showMessage('Price is required!', 'error');
    if (!form.stock) return showMessage('Stock quantity is required!', 'error');
    if (!form.description) return showMessage('Description is required!', 'error');

    setLoading(true);
    try {
      if (editingId) {
        const productRef = doc(db, 'products', editingId);
        await updateDoc(productRef, {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseFloat(form.stock),
          image_url: form.image_url,
          updated_at: serverTimestamp()
        });
        showMessage('Product updated successfully!');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'products'), {
          seller_id: user?.uid,
          seller_name: user?.name || user?.displayName || 'Unknown Seller',
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseFloat(form.stock),
          image_url: form.image_url,
          created_at: serverTimestamp()
        });
        showMessage('Product added successfully!');
      }
      setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
      fetchProducts();
      setActiveTab('products');
    } catch (err) {
      console.error('Error:', err);
      showMessage('Failed to save product', 'error');
    }
    setLoading(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || ''
    });
    setEditingId(product.product_id);
    setActiveTab('add');
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.product_id !== id));
      showMessage('Product deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('Failed to delete product', 'error');
    }
  };

  // FIXED: Use doc() directly with order_id
  const updateOrderStatus = async (order_id, status) => {
    try {
      const orderRef = doc(db, 'orders', order_id);
      await updateDoc(orderRef, {
        status: status,
        updated_at: serverTimestamp()
      });
      setOrders(prev => prev.map(o =>
        o.order_id === order_id ? { ...o, status } : o
      ));
      showMessage(`Order ${status === 'confirmed' ? 'confirmed' : 'updated'} successfully!`);
    } catch (err) {
      console.error('Update error:', err);
      showMessage('Failed to update order', 'error');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', color: '#d97706' };
    if (status === 'confirmed') return { bg: '#d1fae5', color: '#0d9488' };
    if (status === 'cancelled') return { bg: '#fee2e2', color: '#dc2626' };
    return { bg: '#d1fae5', color: '#0d9488' };
  };

  return (
    <div style={{minHeight: '100vh', background: '#f0fdfa', fontFamily: 'Inter, sans-serif'}}>

      {/* NEW ORDER ALERT */}
      {newOrderAlert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
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
          <span style={{fontSize: '20px'}}>!</span>
          <div>
            <p style={{margin: 0, fontWeight: '700', marginBottom: '4px'}}>New Order!</p>
            <p style={{margin: 0, fontSize: '13px', opacity: 0.9}}>{newOrderAlert}</p>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
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
            {user?.name || user?.displayName || 'Seller'} (Seller)
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
            background: msgType === 'success' ? '#d1fae5' : '#fee2e2',
            color: msgType === 'success' ? '#0d9488' : '#dc2626',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            {label: 'Total Products', value: products.length},
            {label: 'Total Orders', value: orders.length},
            {label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length},
            {label: 'Confirmed Orders', value: orders.filter(o => o.status === 'confirmed').length}
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              border: '2px solid #0d9488'
            }}>
              <h3 style={{fontSize: '32px', fontWeight: '800', color: '#0d9488', margin: '0 0 8px 0'}}>
                {stat.value}
              </h3>
              <p style={{color: '#0f766e', margin: 0}}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '2px solid #d1fae5',
          paddingBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {[
            {id: 'products', label: `My Products (${products.length})`},
            {id: 'add', label: editingId ? 'Edit Product' : 'Add New Product'},
            {id: 'orders', label: `Orders (${orders.length})`}
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'add') resetForm();
                setActiveTab(tab.id);
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #0d9488, #10b981)'
                  : 'white',
                color: activeTab === tab.id ? 'white' : '#0f766e',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {tab.label}
              {/* Badge for pending orders */}
              {tab.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>My Products</h2>
            {products.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                border: '2px solid #d1fae5'
              }}>
                <p style={{fontSize: '18px', color: '#0f766e', marginBottom: '16px'}}>
                  No products yet!
                </p>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0d9488, #10b981)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
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
                    <p style={{color: '#0f766e', fontSize: '14px', marginBottom: '12px'}}>
                      {product.description}
                    </p>
                    <p style={{color: '#0f766e', fontSize: '13px', marginBottom: '16px'}}>
                      Stock: <strong>{product.stock}</strong>
                    </p>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #0d9488, #10b981)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT TAB */}
        {activeTab === 'add' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            border: '2px solid #d1fae5'
          }}>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a'}}>
                  Product Name *
                </label>
                <input
                  name="name"
                  placeholder="e.g. Blue Pen, Nshima, Exercise Book"
                  value={form.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #d1fae5',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a'}}>
                  Price (K) *
                </label>
                <input
                  name="price"
                  type="number"
                  placeholder="e.g. 25"
                  value={form.price}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #d1fae5',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a'}}>
                Description *
              </label>
              <input
                name="description"
                placeholder="e.g. Bic blue ballpoint pen"
                value={form.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid #d1fae5',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a'}}>
                  Stock Quantity *
                </label>
                <input
                  name="stock"
                  type="number"
                  placeholder="e.g. 100"
                  value={form.stock}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #d1fae5',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a'}}>
                  Image URL (optional)
                </label>
                <input
                  name="image_url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #d1fae5',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0d9488, #10b981)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('products');
                }}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  border: '2px solid #d1fae5',
                  background: 'white',
                  color: '#0f766e',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>Customer Orders</h2>
            {orders.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                border: '2px solid #d1fae5'
              }}>
                <p style={{color: '#0f766e'}}>No orders yet!</p>
              </div>
            ) : (
              orders.map(order => {
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
                      alignItems: 'start',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <h3 style={{color: '#0f172a', marginBottom: '12px'}}>
                          Order #{order.order_id.slice(0, 8)}...
                        </h3>
                        <p style={{color: '#0f766e', marginBottom: '8px'}}>
                          Total: <strong style={{color: '#0d9488'}}>K{order.total_amount}</strong>
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

                      <span style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>

                    {/* CONFIRM BUTTON - only for pending orders */}
                    {order.status === 'pending' && (
                      <div style={{
                        background: '#f0fdfa',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #d1fae5'
                      }}>
                        <p style={{
                          color: '#0f766e',
                          fontSize: '14px',
                          marginBottom: '12px',
                          fontWeight: '500'
                        }}>
                          Confirm this order to notify the buyer!
                        </p>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'confirmed')}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
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
                            Confirm Order
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === 'confirmed' && (
                      <div style={{
                        background: '#d1fae5',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#0d9488',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        Order confirmed! Buyer has been notified.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;