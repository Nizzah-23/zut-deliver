/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ user_id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (err) {
      showMessage('Failed to load users', 'error');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, ...doc.data() });
      });
      setOrders(ordersList);
    } catch (err) {
      showMessage('Failed to load orders', 'error');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ product_id: doc.id, ...doc.data() });
      });
      setProducts(productsList);
    } catch (err) {
      showMessage('Failed to load products', 'error');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchProducts();
  }, [fetchUsers, fetchOrders, fetchProducts]);

  const handleBan = async (id, is_banned) => {
    const action = is_banned ? 'ban' : 'unban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await updateDoc(doc(db, 'users', id), { is_banned });
      setUsers(prev => prev.map(u => u.user_id === id ? { ...u, is_banned } : u));
      showMessage(`User ${action}ned successfully!`);
    } catch (err) {
      showMessage('Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.user_id !== id));
      showMessage('User deleted successfully!');
    } catch (err) {
      showMessage('Failed to delete user', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.product_id !== id));
      showMessage('Product deleted successfully!');
    } catch (err) {
      showMessage('Failed to delete product', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeColor = (role) => {
    if (role === 'seller') return { background: '#d1fae5', color: '#0d9488' };
    if (role === 'buyer') return { background: '#a7f3d0', color: '#0f766e' };
    if (role === 'delivery') return { background: '#d1fae5', color: '#059669' };
    if (role === 'admin') return { background: '#0d9488', color: 'white' };
    return {};
  };

  // Stats
  const stats = {
    total_users: users.filter(u => u.role !== 'admin').length,
    total_sellers: users.filter(u => u.role === 'seller').length,
    total_buyers: users.filter(u => u.role === 'buyer').length,
    total_delivery: users.filter(u => u.role === 'delivery').length,
    total_orders: orders.length,
    total_products: products.length,
    total_revenue: orders.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0),
    banned_users: users.filter(u => u.is_banned).length
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
          ZUT Deliver — Admin Panel
        </h1>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
          <span style={{color: '#0f766e', fontWeight: '600'}}>
            {user?.name} (Admin)
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
              cursor: 'pointer'
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
            {id: 'overview', label: 'Overview'},
            {id: 'users', label: `Users (${users.length})`},
            {id: 'orders', label: `Orders (${orders.length})`},
            {id: 'products', label: `Products (${products.length})`}
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>Platform Overview</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {[
                {label: 'Total Users', value: stats.total_users},
                {label: 'Sellers', value: stats.total_sellers},
                {label: 'Buyers', value: stats.total_buyers},
                {label: 'Delivery Guys', value: stats.total_delivery},
                {label: 'Total Orders', value: stats.total_orders},
                {label: 'Total Products', value: stats.total_products},
                {label: 'Total Revenue', value: `K${stats.total_revenue.toFixed(2)}`},
                {label: 'Banned Users', value: stats.banned_users}
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '2px solid #0d9488'
                }}>
                  <h3 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#0d9488',
                    margin: '0 0 8px 0'
                  }}>
                    {stat.value}
                  </h3>
                  <p style={{color: '#0f766e', margin: 0, fontSize: '14px'}}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* USER BREAKDOWN */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '2px solid #d1fae5'
            }}>
              <h3 style={{color: '#0f172a', marginBottom: '16px'}}>User Breakdown</h3>
              {['buyer', 'seller', 'delivery'].map(role => (
                <div key={role} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0fdfa'
                }}>
                  <span style={{textTransform: 'capitalize', fontWeight: '600', color: '#0f172a'}}>
                    {role}s
                  </span>
                  <span style={{
                    ...getRoleBadgeColor(role),
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {users.filter(u => u.role === role).length} users
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>All Users</h2>

            {/* SEARCH & FILTER */}
            <div style={{display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'}}>
              <input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #d1fae5',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  minWidth: '200px',
                  outline: 'none'
                }}
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #d1fae5',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            {filteredUsers.map(u => (
              <div key={u.user_id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                border: '2px solid #d1fae5',
                borderLeft: u.is_banned ? '4px solid #ef4444' : '4px solid #0d9488'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <h3 style={{color: '#0f172a', marginBottom: '8px'}}>
                      {u.name}
                      {u.is_banned && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          BANNED
                        </span>
                      )}
                    </h3>
                    <p style={{color: '#0f766e', marginBottom: '4px'}}>{u.email}</p>
                    <p style={{color: '#0f766e', marginBottom: '4px'}}>{u.phone || 'No phone'}</p>
                    <span style={{
                      ...getRoleBadgeColor(u.role),
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginTop: '8px'
                    }}>
                      {u.role?.toUpperCase()}
                    </span>
                  </div>

                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    <button
                      onClick={() => handleBan(u.user_id, !u.is_banned)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        background: u.is_banned ? '#d1fae5' : '#fef3c7',
                        color: u.is_banned ? '#0d9488' : '#d97706',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.user_id, u.name)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                border: '2px solid #d1fae5'
              }}>
                <p style={{color: '#0f766e'}}>No users found.</p>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>All Platform Orders</h2>
            {orders.map(order => (
              <div key={order.order_id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '16px',
                border: '2px solid #d1fae5'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <h3 style={{color: '#0f172a', marginBottom: '12px'}}>
                      Order #{order.order_id}
                    </h3>
                    <p style={{color: '#0f766e', marginBottom: '8px'}}>
                      Buyer: <strong>{order.buyer_name || order.buyer_id}</strong>
                    </p>
                    <p style={{color: '#0f766e', marginBottom: '8px'}}>
                      Seller: <strong>{order.seller_name || order.seller_id}</strong>
                    </p>
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
                    background: 'linear-gradient(135deg, #0d9488, #10b981)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                border: '2px solid #d1fae5'
              }}>
                <p style={{color: '#0f766e'}}>No orders yet.</p>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <h2 style={{color: '#0f172a', marginBottom: '24px'}}>All Platform Products</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {products.map(product => (
                <div key={product.product_id} style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '2px solid #d1fae5',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
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
                    Stock: <strong>{product.stock}</strong>
                  </p>
                  <p style={{color: '#0f766e', fontSize: '13px', marginBottom: '16px'}}>
                    Seller: <strong>{product.seller_name || product.seller_id}</strong>
                  </p>
                  <button
                    onClick={() => handleDeleteProduct(product.product_id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: '#fee2e2',
                      color: '#dc2626',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#fecaca'}
                    onMouseOut={(e) => e.target.style.background = '#fee2e2'}
                  >
                    Delete Product
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p style={{color: '#0f766e', gridColumn: '1 / -1', textAlign: 'center'}}>
                  No products yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;