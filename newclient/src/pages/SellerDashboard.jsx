/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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

  const fetchProducts = useCallback(async () => {
    try {
      const q = query(collection(db, 'products'), where('seller_id', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const productsList = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ product_id: doc.id, doc_ref: doc, ...doc.data() });
      });
      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching products:', err);
      showMessage('Failed to load products', 'error');
    }
  }, [user?.uid]);

  const fetchOrders = useCallback(async () => {
    try {
      const q = query(collection(db, 'orders'), where('seller_id', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, doc_ref: doc, ...doc.data() });
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
        showMessage('✅ Product updated successfully!');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'products'), {
          seller_id: user?.uid,
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseFloat(form.stock),
          image_url: form.image_url,
          created_at: serverTimestamp()
        });
        showMessage('✅ Product added successfully!');
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
      showMessage('✅ Product deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('Failed to delete product', 'error');
    }
  };

  const updateOrderStatus = async (order_id, status, docRef) => {
    try {
      await updateDoc(docRef, { status });
      setOrders(prev => prev.map(o => o.order_id === order_id ? { ...o, status } : o));
      showMessage('✅ Order status updated!');
    } catch (err) {
      console.error('Update error:', err);
      showMessage('Failed to update order', 'error');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
    setEditingId(null);
  };

  return (
    <div style={{minHeight: '100vh', background: '#f0fdfa', fontFamily: 'Inter, sans-serif'}}>
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
          🛵 ZUT Deliver
        </h1>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
          <span style={{color: '#0f766e', fontWeight: '600'}}>
            👤 {user?.name} (Seller)
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
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
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
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px'}}>
          {[
            {label: 'Total Products', value: products.length},
            {label: 'Total Orders', value: orders.length},
            {label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length}
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              border: '2px solid #0d9488'
            }}>
              <h3 style={{fontSize: '32px', fontWeight: '800', color: '#0d9488', margin: '0 0 8px 0'}}>{stat.value}</h3>
              <p style={{color: '#0f766e', margin: 0}}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '2px solid #d1fae5', paddingBottom: '16px', flexWrap: 'wrap'}}>
          {[
            {id: 'products', label: `📦 My Products (${products.length})`},
            {id: 'add', label: editingId ? '✏️ Edit Product' : '➕ Add New Product'},
            {id: 'orders', label: `📋 Orders (${orders.length})`}
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
                background: activeTab === tab.id ? 'linear-gradient(135deg, #0d9488, #10b981)' : 'white',
                color: activeTab === tab.id ? 'white' : '#0f766e',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
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
                <p style={{fontSize: '18px', color: '#0f766e', marginBottom: '16px'}}>No products yet!</p>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{
                    padding: '12px 24px',
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
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px'}}>
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
                    <div style={{fontSize: '24px', fontWeight: '800', color: '#0d9488', marginBottom: '12px'}}>
                      K{product.price}
                    </div>
                    <p style={{color: '#0f766e', fontSize: '14px', marginBottom: '12px'}}>{product.description}</p>
                    <p style={{color: '#0f766e', fontSize: '13px', marginBottom: '16px'}}>
                      📦 Stock: <strong>{product.stock}</strong>
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
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
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
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#fecaca'}
                        onMouseOut={(e) => e.target.style.background = '#fee2e2'}
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
              {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
            </h2>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px'}}>
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

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px'}}>
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
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {loading ? 'Saving...' : editingId ? '💾 Save Changes' : '➕ Add Product'}
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
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#f0fdfa'}
                onMouseOut={(e) => e.target.style.background = 'white'}
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
              orders.map(order => (
                <div
                  key={order.order_id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '16px',
                    border: '2px solid #d1fae5'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
                    <div>
                      <h3 style={{color: '#0f172a', marginBottom: '12px'}}>Order #{order.order_id}</h3>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>👤 Customer: <strong>{order.buyer_name || 'Unknown'}</strong></p>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>📞 Phone: {order.buyer_phone || 'N/A'}</p>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>💰 Total: <strong style={{color: '#0d9488'}}>K{order.total_amount}</strong></p>
                      <p style={{color: '#0f766e', marginBottom: '8px'}}>📍 Address: {order.delivery_address}</p>
                      {order.created_at && (
                        <p style={{color: '#0f766e', fontSize: '13px'}}>
                          📅 Date: {new Date(order.created_at.toDate()).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span style={{
                      background: 'linear-gradient(135deg, #0d9488, #10b981)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.order_id, 'confirmed', order.doc_ref)}
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
                      ✓ Confirm Order
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;