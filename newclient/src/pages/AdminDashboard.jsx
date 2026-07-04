/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';

function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const headers = { Authorization: `Bearer ${token}` };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats', { headers });
      setStats(res.data.stats);
    } catch (err) {
      showMessage('Failed to load stats', 'error');
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', { headers });
      setUsers(res.data.users);
    } catch (err) {
      showMessage('Failed to load users', 'error');
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/orders', { headers });
      setOrders(res.data.orders);
    } catch (err) {
      showMessage('Failed to load orders', 'error');
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/products', { headers });
      setProducts(res.data.products);
    } catch (err) {
      showMessage('Failed to load products', 'error');
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchOrders();
    fetchProducts();
  }, [fetchStats, fetchUsers, fetchOrders, fetchProducts]);

  const handleBan = async (id, is_banned) => {
    const action = is_banned ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${id}/ban`,
        { is_banned },
        { headers }
      );
      setUsers(prev => prev.map(u =>
        u.user_id === id ? { ...u, is_banned } : u
      ));
      showMessage(`✅ User ${action}ned successfully!`);
      fetchStats();
    } catch (err) {
      showMessage('❌ Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This cannot be undone!`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { headers });
      setUsers(prev => prev.filter(u => u.user_id !== id));
      showMessage('✅ User deleted successfully!');
      fetchStats();
    } catch (err) {
      showMessage('❌ Failed to delete user', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/products/${id}`, { headers });
      setProducts(prev => prev.filter(p => p.product_id !== id));
      showMessage('✅ Product deleted successfully!');
      fetchStats();
    } catch (err) {
      showMessage('❌ Failed to delete product', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeColor = (role) => {
    if (role === 'seller') return { background: '#d1ecf1', color: '#0c5460' };
    if (role === 'buyer') return { background: '#d4edda', color: '#155724' };
    if (role === 'delivery') return { background: '#fff3cd', color: '#856404' };
    if (role === 'admin') return { background: '#f8d7da', color: '#721c24' };
    return {};
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>🛵 ZUT Deliver — Admin Panel</h1>
        <div className="navbar-right">
          <span>👑 {user?.name} (Admin)</span>
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

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}>👥 Users ({users.length})</button>
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}>📦 Orders ({orders.length})</button>
          <button className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}>🛍️ Products ({products.length})</button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <p className="section-title">Platform Overview</p>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{stats.total_users || 0}</h3>
                <p>Total Users</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_sellers || 0}</h3>
                <p>Sellers</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_buyers || 0}</h3>
                <p>Buyers</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_delivery || 0}</h3>
                <p>Delivery Guys</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_orders || 0}</h3>
                <p>Total Orders</p>
              </div>
              <div className="stat-card">
                <h3>{stats.total_products || 0}</h3>
                <p>Total Products</p>
              </div>
              <div className="stat-card">
                <h3>K{Number(stats.total_revenue || 0).toFixed(2)}</h3>
                <p>Total Revenue</p>
              </div>
              <div className="stat-card">
                <h3>{stats.banned_users || 0}</h3>
                <p>Banned Users</p>
              </div>
            </div>

            {/* QUICK SUMMARY */}
            <div className="card" style={{marginTop:'24px'}}>
              <h3 style={{marginBottom:'16px'}}>👥 User Breakdown</h3>
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {['buyer', 'seller', 'delivery'].map(role => (
                  <div key={role} style={{display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f0f0f0'}}>
                    <span style={{textTransform:'capitalize', fontWeight:'600'}}>{role}s</span>
                    <span style={{
                      ...getRoleBadgeColor(role),
                      padding:'4px 12px', borderRadius:'20px', fontSize:'14px', fontWeight:'600'
                    }}>
                      {users.filter(u => u.role === role).length} users
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <p className="section-title">All Users</p>

            {/* SEARCH & FILTER */}
            <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
              <input
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{flex:1, padding:'10px 14px', border:'2px solid #e0e0e0',
                  borderRadius:'8px', fontSize:'14px', outline:'none', minWidth:'200px'}}
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{padding:'10px 14px', border:'2px solid #e0e0e0',
                  borderRadius:'8px', fontSize:'14px', outline:'none'}}>
                <option value="all">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            {filteredUsers.map(u => (
              <div key={u.user_id} className="card" style={{
                borderLeft: u.is_banned ? '4px solid #e94560' : '4px solid #0f3460'
              }}>
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', flexWrap:'wrap', gap:'12px'}}>
                  <div>
                    <h3 style={{marginBottom:'4px'}}>
                      {u.name}
                      {u.is_banned && (
                        <span style={{marginLeft:'8px', fontSize:'12px',
                          background:'#f8d7da', color:'#721c24',
                          padding:'2px 8px', borderRadius:'10px'}}>
                          BANNED
                        </span>
                      )}
                    </h3>
                    <p>📧 {u.email}</p>
                    <p>📞 {u.phone || 'No phone'}</p>
                    <p>📅 Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                    <span style={{
                      ...getRoleBadgeColor(u.role),
                      display:'inline-block', padding:'4px 12px',
                      borderRadius:'20px', fontSize:'12px',
                      fontWeight:'600', marginTop:'8px'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <button
                      onClick={() => handleBan(u.user_id, !u.is_banned)}
                      style={{
                        padding:'8px 16px', borderRadius:'8px', border:'none',
                        cursor:'pointer', fontWeight:'600', fontSize:'13px',
                        background: u.is_banned ? '#d4edda' : '#fff3cd',
                        color: u.is_banned ? '#155724' : '#856404'
                      }}>
                      {u.is_banned ? '✅ Unban' : '🚫 Ban'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.user_id, u.name)}
                      style={{
                        padding:'8px 16px', borderRadius:'8px', border:'none',
                        cursor:'pointer', fontWeight:'600', fontSize:'13px',
                        background:'#e94560', color:'white'
                      }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <p>No users found.</p>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <p className="section-title">All Platform Orders</p>
            {orders.map(order => (
              <div key={order.order_id} className="card">
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', flexWrap:'wrap'}}>
                  <div>
                    <h3>Order #{order.order_id}</h3>
                    <p>👤 Buyer: <strong>{order.buyer_name}</strong></p>
                    <p>🏪 Seller: <strong>{order.seller_name}</strong></p>
                    <p>🚴 Delivery: <strong>{order.delivery_name || 'Not assigned'}</strong></p>
                    <p>💰 Total: <strong>K{order.total_amount}</strong></p>
                    <p>📍 Address: {order.delivery_address}</p>
                    <p>📅 Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge badge-${order.status}`}>
                    {order.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="card" style={{textAlign:'center', padding:'40px'}}>
                <p>No orders yet.</p>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <p className="section-title">All Platform Products</p>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.product_id} className="product-card">
                  <h3>{product.name}</h3>
                  <div className="price">K{product.price}</div>
                  <p>{product.description}</p>
                  <p>📦 Stock: <strong>{product.stock}</strong></p>
                  <p>🏪 Seller: <strong>{product.seller_name}</strong></p>
                  <button
                    style={{
                      width:'100%', marginTop:'12px', padding:'8px',
                      borderRadius:'8px', border:'none', cursor:'pointer',
                      background:'#e94560', color:'white', fontWeight:'600'
                    }}
                    onClick={() => handleDeleteProduct(product.product_id)}>
                    🗑️ Delete Product
                  </button>
                </div>
              ))}
              {products.length === 0 && <p>No products yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;