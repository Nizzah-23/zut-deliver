import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'buyer', phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { strength: 20, label: 'Very Weak', color: '#e74c3c' };
    if (score === 2) return { strength: 40, label: 'Weak', color: '#e67e22' };
    if (score === 3) return { strength: 60, label: 'Fair', color: '#f1c40f' };
    if (score === 4) return { strength: 80, label: 'Strong', color: '#2ecc71' };
    return { strength: 100, label: 'Very Strong', color: '#27ae60' };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const getPasswordTips = (password) => {
    const tips = [];
    if (password.length < 8) tips.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) tips.push('At least one uppercase letter');
    if (!/[0-9]/.test(password)) tips.push('At least one number');
  
    return tips;
  };

  const passwordTips = getPasswordTips(form.password);

  const handleRegister = async () => {
    setError('');

    // Validate password strength
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters!');
    }
    if (passwordStrength.strength < 60) {
      return setError('Password is too weak! Please make it stronger.');
    }

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
        <h2>ZUT Deliver</h2>
        <p>Create your account</p>
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label>Full Name</label>
          <input name="name" placeholder="Enter your full name"
            value={form.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" placeholder="Enter your email"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input name="phone" placeholder="e.g. 0977000000"
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div style={{position: 'relative'}}>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
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

          {/* PASSWORD STRENGTH BAR */}
          {form.password.length > 0 && (
            <div style={{marginTop: '10px'}}>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#e0e0e0',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${passwordStrength.strength}%`,
                  height: '100%',
                  background: passwordStrength.color,
                  borderRadius: '3px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: passwordStrength.color
                }}>
                  {passwordStrength.label}
                </span>
                <span style={{fontSize: '12px', color: '#888'}}>
                  {passwordStrength.strength}%
                </span>
              </div>

              {/* PASSWORD TIPS */}
              {passwordTips.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <p style={{fontWeight: '600', marginBottom: '6px', color: '#555'}}>
                    To strengthen your password:
                  </p>
                  {passwordTips.map((tip, i) => (
                    <p key={i} style={{color: '#e94560', marginBottom: '3px'}}>
                      x {tip}
                    </p>
                  ))}
                </div>
              )}

              {/* ALL GOOD MESSAGE */}
              {passwordTips.length === 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#d4edda',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#155724',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Great password!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>I am a...</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="buyer">Buyer (I want to order)</option>
            <option value="seller">Seller (I want to sell)</option>
            <option value="delivery">Delivery Guy (I deliver orders)</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={loading}>
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