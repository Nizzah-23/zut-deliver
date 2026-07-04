/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function DeliveryDashboard() {
  const { user, token, logout } = useAuth();
  const [myOrders, setMyOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [message, setMessage] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/delivery/orders', { headers });
      setMyOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchAvailableOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/delivery/orders/available', { headers });
      setAvailableOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchMyOrders();
    fetchAvailableOrders();
  }, [fetchMyOrders, fetchAvailableOrders]);

  const acceptOrder = async (order_id) => {
    try {
      await axios.put(`http://localhost:5000/api/delivery/orders/${order_id}/accept`,
        {}, { headers });
      setMessage('✅ Order accepted!');
      fetchMyOrders();
      fetchAvailableOrders();
      setActiveTab('myorders');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to accept order');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const updateLocation = async (order_id, status, location) => {
    try {
      await axios.put(`http://localhost:5000/api/delivery/orders/${order_id}/location`,
        { status, current_location: location }, { headers });

      // Send real-time update via Socket.io
      socket.emit('location_update', {
        order_id,
        location,
        status
      });

      setMessage('✅ Location updated & sent to buyer!');
      fetchMyOrders();
    } catch (err) {
      setMessage('Failed to update location');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const sendCustomLocation = (order_id) => {
    if (!locationInput) return setMessage('Please enter a location!');
    socket.emit('location_update', {
      order_id,
      location: locationInput,
      status: 'on_the_way'
    });
    setMessage(`📍 Location "${locationInput}" sent to buyer!`);
    setLocationInput('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1>🛵 ZUT Deliver</h1>
        <div className="navbar-right">
          <span>👤 {user?.name} (Delivery)</span>
          <button className="btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        {message && (
          <div className="error-msg" style={{background:'#d4edda', color:'#155724'}}>
            {message}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{availableOrders.length}</h3>
            <p>Available Orders</p>
          </div>
          <div className="stat-card">
            <h3>{myOrders.length}</h3>
            <p>My Deliveries</p>
          </div>
          <div className="stat-card">
            <h3>{myOrders.filter(o => o.status === 'delivered').length}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}>
            📋 Available ({availableOrders.length})
          </button>
          <button className={`tab ${activeTab === 'myorders' ? 'active' : ''}`}
            onClick={() => setActiveTab('myorders')}>
            🚴 My Deliveries ({myOrders.length})
          </button>
        </div>

        {activeTab === 'available' && (
          <div>
            <p className="section-title">Available Orders to Pick Up</p>
            {availableOrders.map(order => (
              <div key={order.order_id} className="card">
                <h3>Order #{order.order_id}</h3>
                <p>Customer: {order.buyer_name}</p>
                <p>Phone: {order.buyer_phone}</p>
                <p>Seller: {order.seller_name}</p>
                <p>Total: K{order.total_amount}</p>
                <p>Deliver to: {order.delivery_address}</p>
                <button className="btn btn-primary"
                  style={{marginTop:'12px', width:'auto', padding:'10px 20px'}}
                  onClick={() => acceptOrder(order.order_id)}>
                  🚴 Accept Delivery
                </button>
              </div>
            ))}
            {availableOrders.length === 0 && (
              <p>No available orders right now.</p>
            )}
          </div>
        )}

        {activeTab === 'myorders' && (
          <div>
            <p className="section-title">My Active Deliveries</p>
            {myOrders.map(order => (
              <div key={order.order_id} className="card">
                <h3>Order #{order.order_id}</h3>
                <p>Customer: {order.buyer_name}</p>
                <p>Phone: {order.buyer_phone}</p>
                <p>Total: K{order.total_amount}</p>
                <p>Deliver to: {order.delivery_address}</p>
                <span className={`badge badge-${order.status}`}>
                  {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>

                {order.status === 'out_for_delivery' && (
                  <div style={{marginTop:'16px'}}>
                    <p style={{fontWeight:'600', marginBottom:'8px'}}>
                      Update Status:
                    </p>
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px'}}>
                      <button className="btn btn-secondary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, 'picked_up', 'Picked up from seller')}>
                        📦 Picked Up
                      </button>
                      <button className="btn btn-secondary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, 'on_the_way', 'On the way to customer')}>
                        🚴 On The Way
                      </button>
                      <button className="btn btn-primary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, 'delivered', 'Delivered to customer')}>
                        ✅ Delivered
                      </button>
                    </div>

                    {/* SEND CUSTOM LOCATION */}
                    <p style={{fontWeight:'600', marginBottom:'8px'}}>
                      📍 Send Custom Location:
                    </p>
                    <div className="input-group">
                      <input
                        placeholder="e.g. Near ZUT Main Gate"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                      />
                      <button className="btn btn-primary"
                        style={{width:'auto', padding:'10px 16px'}}
                        onClick={() => sendCustomLocation(order.order_id)}>
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {myOrders.length === 0 && (
              <p>No active deliveries. Accept an order to get started!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryDashboard;