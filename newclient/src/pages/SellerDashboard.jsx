/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';

function SellerDashboard() {
  const { user, token, logout } = useAuth();
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

  const headers = { Authorization: `Bearer ${token}` };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/seller/products', { headers });
      setProducts(res.data.products);
    } catch (err) {
      showMessage('Failed to load products', 'error');
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/seller/orders', { headers });
      setOrders(res.data.orders);
    } catch (err) {
      showMessage('Failed to load orders', 'error');
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name) return showMessage(' Product name is required!', 'error');
    if (!form.price) return showMessage(' Price is required!', 'error');
    if (!form.stock) return showMessage(' Stock quantity is required!', 'error');
    if (!form.description) return showMessage(' Description is required!', 'error');

    setLoading(true);
    try {
      if (editingId) {
        const res = await axios.put(
          `http://localhost:5000/api/seller/products/${editingId}`,
          form,
          { headers }
        );
        setProducts(prev => prev.map(p =>
          p.product_id === editingId ? res.data.product : p
        ));
        showMessage(' Product updated successfully!');
        setEditingId(null);
      } else {
        const res = await axios.post(
          'http://localhost:5000/api/seller/products',
          form,
          { headers }
        );
        setProducts(prev => [res.data.product, ...prev]);
        showMessage(' Product added successfully!');
      }
      setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
      setActiveTab('products');
    } catch (err) {
      showMessage(err.response?.data?.message || ' Failed to save product', 'error');
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
      await axios.delete(
        `http://localhost:5000/api/seller/products/${id}`,
        { headers }
      );
      setProducts(prev => prev.filter(p => p.product_id !== id));
      showMessage(' Product deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err.response?.data);
      showMessage(
        err.response?.data?.message || ' Failed to delete product.',
        'error'
      );
    }
  };

  const updateOrderStatus = async (order_id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/seller/orders/${order_id}/status`,
        { status },
        { headers }
      );
      setOrders(prev => prev.map(o =>
        o.order_id === order_id ? { ...o, status } : o
      ));
      showMessage(' Order status updated!');
    } catch (err) {
      showMessage(' Failed to update order', 'error');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
    setEditingId(null);
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1> ZUT Deliver</h1>
        <div className="navbar-right">
          <span> {user?.name} (Seller)</span>
          <button className="btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: '600',
            background: msgType === 'success' ? '#d4edda' : '#f8d7da',
            color: msgType === 'success' ? '#155724' : '#721c24'
          }}>
            {message}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
          <div className="stat-card">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
          <div className="stat-card">
            <h3>{orders.filter(o => o.status === 'pending').length}</h3>
            <p>Pending Orders</p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}>
             My Products ({products.length})
          </button>
          <button className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => { resetForm(); setActiveTab('add'); }}>
             {editingId ? 'Edit Product' : 'Add New Product'}
          </button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}>
             Orders ({orders.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            <p className="section-title">My Products</p>
            {products.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <p style={{fontSize:'18px', marginBottom:'16px'}}>No products yet!</p>
                <button className="btn btn-primary"
                  style={{width:'auto', padding:'12px 24px'}}
                  onClick={() => setActiveTab('add')}>
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.product_id} className="product-card">
                    <h3>{product.name}</h3>
                    <div className="price">K{product.price}</div>
                    <p>{product.description}</p>
                    <p style={{marginTop:'8px'}}>📦 Stock: <strong>{product.stock}</strong></p>
                    <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                      <button className="btn btn-secondary"
                        style={{flex:1, padding:'8px'}}
                        onClick={() => handleEdit(product)}>
                         Edit
                      </button>
                      <button
                        style={{flex:1, padding:'8px', borderRadius:'8px',
                          border:'none', cursor:'pointer',
                          background:'#e94560', color:'white', fontWeight:'600'}}
                        onClick={() => handleDelete(product.product_id)}>
                         Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="card">
            <p className="section-title">
              {editingId ? ' Edit Product' : '➕ Add New Product'}
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input name="name"
                  placeholder="e.g. Blue Pen, Nshima, Exercise Book"
                  value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Price (K) *</label>
                <input name="price" type="number" placeholder="e.g. 25"
                  value={form.price} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <input name="description"
                placeholder="e.g. Bic blue ballpoint pen"
                value={form.description} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stock Quantity *</label>
                <input name="stock" type="number" placeholder="e.g. 100"
                  value={form.stock} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Image URL (optional)</label>
                <input name="image_url" placeholder="https://..."
                  value={form.image_url} onChange={handleChange} />
              </div>
            </div>
            <div style={{display:'flex', gap:'12px', marginTop:'8px'}}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editingId ? '💾 Save Changes' : '➕ Add Product'}
              </button>
              <button className="btn btn-secondary"
                onClick={() => { resetForm(); setActiveTab('products'); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <p className="section-title">Customer Orders</p>
            {orders.length === 0 ? (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <p>No orders yet!</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.order_id} className="card">
                  <h3>Order #{order.order_id}</h3>
                  <p> Customer: <strong>{order.buyer_name}</strong></p>
                  <p> Phone: {order.buyer_phone}</p>
                  <p> Total: <strong>K{order.total_amount}</strong></p>
                  <p> Address: {order.delivery_address}</p>
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <span className={`badge badge-${order.status}`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {order.status === 'pending' && (
                    <div style={{marginTop:'12px'}}>
                      <button className="btn btn-primary"
                        style={{width:'auto', padding:'8px 20px'}}
                        onClick={() => updateOrderStatus(order.order_id, 'confirmed')}>
                        Confirm Order
                      </button>
                    </div>
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