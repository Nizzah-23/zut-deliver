import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'buyer', phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🛵 SchoolDeliver</h2>
        <p>Create your account</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>Full Name</label>
          <input
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            name="phone"
            placeholder="e.g. 0977000000"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>I am a...</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="buyer">Buyer (I want to order)</option>
            <option value="seller">Seller (I want to sell)</option>
            <option value="delivery">Delivery Guy (I deliver orders)</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        <div className="auth-switch">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Login here</span>
        </div>
      </div>
    </div>
  );
};

export default Register;