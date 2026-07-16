import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../AuthContext';

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
    if (!email || !password) {
      return setError('Email and password are required!');
    }
    setLoading(true);
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Get user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userInfo = {
          uid: user.uid,
          name: userData.name,
          email: user.email,
          role: userData.role,
          phone: userData.phone
        };

        // Save to AuthContext
        login(userInfo, token);

        // Redirect based on role
        if (userData.role === 'buyer') navigate('/buyer');
        else if (userData.role === 'seller') navigate('/seller');
        else if (userData.role === 'delivery') navigate('/delivery');
        else if (userData.role === 'admin') navigate('/admin');
      } else {
        setError('User data not found!');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Email not found!');
      } else if (err.code === 'auth/wrong-password') {
        setError('Invalid password!');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password!');
      } else {
        setError(err.message || 'Login failed');
      }
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