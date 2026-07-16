/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const [myOrders, setMyOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [message, setMessage] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Fetch my orders
  const fetchMyOrders = useCallback(async () => {
    try {
      const q = query(collection(db, 'orders'), where('delivery_id', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, doc_ref: doc, ...doc.data() });
      });
      setMyOrders(ordersList);
    } catch (err) {
      console.error('Error fetching my orders:', err);
    }
  }, [user?.uid]);

  // Fetch available orders
  const fetchAvailableOrders = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('delivery_id', '==', null),
        where('status', '==', 'confirmed')
      );
      const querySnapshot = await getDocs(q);
      const ordersList = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ order_id: doc.id, doc_ref: doc, ...doc.data() });
      });
      setAvailableOrders(ordersList);
    } catch (err) {
      console.error('Error fetching available orders:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      fetchMyOrders();
      fetchAvailableOrders();
    }
  }, [user?.uid, fetchMyOrders, fetchAvailableOrders]);

  const acceptOrder = async (order_id, docRef) => {
    try {
      await updateDoc(docRef, {
        delivery_id: user?.uid,
        status: 'out_for_delivery',
        updated_at: serverTimestamp()
      });
      setMessage(' Order accepted!');
      fetchMyOrders();
      fetchAvailableOrders();
      setActiveTab('myorders');
    } catch (err) {
      console.error('Error accepting order:', err);
      setMessage('Failed to accept order');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const updateLocation = async (order_id, docRef, status, location) => {
    try {
      await updateDoc(docRef, {
        status: status,
        last_location: location,
        updated_at: serverTimestamp()
      });
      setMessage('✅ Location updated!');
      fetchMyOrders();
    } catch (err) {
      console.error('Error updating location:', err);
      setMessage('Failed to update location');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const sendCustomLocation = async (order_id, docRef) => {
    if (!locationInput) return setMessage('Please enter a location!');
    try {
      await updateDoc(docRef, {
        last_location: locationInput,
        updated_at: serverTimestamp()
      });
      setMessage(` Location "${locationInput}" sent!`);
      setLocationInput('');
      fetchMyOrders();
    } catch (err) {
      setMessage('Failed to send location');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="dashboard">
      <div className="navbar">
        <h1> ZUT Deliver</h1>
        <div className="navbar-right">
          <span> {user?.displayName || 'Delivery'} (Delivery)</span>
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
             Available ({availableOrders.length})
          </button>
          <button className={`tab ${activeTab === 'myorders' ? 'active' : ''}`}
            onClick={() => setActiveTab('myorders')}>
             My Deliveries ({myOrders.length})
          </button>
        </div>

        {activeTab === 'available' && (
          <div>
            <p className="section-title">Available Orders to Pick Up</p>
            {availableOrders.map(order => (
              <div key={order.order_id} className="card">
                <h3>Order #{order.order_id}</h3>
                <p>Total: K{order.total_amount}</p>
                <p>Deliver to: {order.delivery_address}</p>
                <button className="btn btn-primary"
                  style={{marginTop:'12px', width:'auto', padding:'10px 20px'}}
                  onClick={() => acceptOrder(order.order_id, order.doc_ref)}>
                   Accept Delivery
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
                <p>Total: K{order.total_amount}</p>
                <p>Deliver to: {order.delivery_address}</p>
                <span className={`badge badge-${order.status}`}>
                  {order.status?.replace(/_/g, ' ').toUpperCase()}
                </span>

                {order.status === 'out_for_delivery' && (
                  <div style={{marginTop:'16px'}}>
                    <p style={{fontWeight:'600', marginBottom:'8px'}}>
                      Update Status:
                    </p>
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px'}}>
                      <button className="btn btn-secondary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, order.doc_ref, 'picked_up', 'Picked up from seller')}>
                         Picked Up
                      </button>
                      <button className="btn btn-secondary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, order.doc_ref, 'on_the_way', 'On the way to customer')}>
                         On The Way
                      </button>
                      <button className="btn btn-primary"
                        style={{width:'auto', padding:'8px 16px'}}
                        onClick={() => updateLocation(order.order_id, order.doc_ref, 'delivered', 'Delivered to customer')}>
                         Delivered
                      </button>
                    </div>

                    <p style={{fontWeight:'600', marginBottom:'8px'}}>
                       Send Custom Location:
                    </p>
                    <div className="input-group">
                      <input
                        placeholder="e.g. Near ZUT Main Gate"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                      />
                      <button className="btn btn-primary"
                        style={{width:'auto', padding:'10px 16px'}}
                        onClick={() => sendCustomLocation(order.order_id, order.doc_ref)}>
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