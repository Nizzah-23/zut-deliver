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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

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

        login(userInfo, token);

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '800',
          marginBottom: '12px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ZUT Deliver
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#0f766e',
          marginBottom: '32px',
          fontSize: '15px'
        }}>
          Login to your account
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{marginBottom: '24px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#0f172a',
            fontSize: '14px'
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #d1fae5',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0d9488'}
            onBlur={(e) => e.target.style.borderColor = '#d1fae5'}
          />
        </div>

        <div style={{marginBottom: '32px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#0f172a',
            fontSize: '14px'
          }}>
            Password
          </label>
          <div style={{position: 'relative'}}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '50px',
                border: '2px solid #d1fae5',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d9488'}
              onBlur={(e) => e.target.style.borderColor = '#d1fae5'}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#0f766e',
                fontWeight: '600'
              }}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px rgba(13,148,136,0.3)'
          }}
          onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: '#0f766e'
        }}>
          Don't have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{
              color: '#0d9488',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}>
            Register here
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;