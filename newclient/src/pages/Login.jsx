import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email, password
      });
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === 'buyer') navigate('/buyer');
      else if (role === 'seller') navigate('/seller');
      else if (role === 'delivery') navigate('/delivery');
      else if (role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>ZUT Deliver</h2>
        <p>Login to your account</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{position: 'relative'}}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{paddingRight: '50px'}}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#888',
                fontWeight: '600'
              }}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="auth-switch">
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')}>Register here</span>
        </div>
      </div>
    </div>
  );
};

export default Login;