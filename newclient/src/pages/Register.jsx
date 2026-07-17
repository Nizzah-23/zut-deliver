import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
    if (score === 4) return { strength: 80, label: 'Strong', color: '#10b981' };
    return { strength: 100, label: 'Very Strong', color: '#0d9488' };
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

    if (!form.name || !form.email || !form.password) {
      return setError('All fields are required!');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters!');
    }
    if (passwordStrength.strength < 60) {
      return setError('Password is too weak!');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: form.name });

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        created_at: new Date()
      });

      console.log('Registration successful!');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists!');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak!');
      } else {
        setError(err.message || 'Registration failed');
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
        maxWidth: '450px',
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
          Create your account
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

        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#0f172a',
            fontSize: '14px'
          }}>
            Full Name
          </label>
          <input
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
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

        <div style={{marginBottom: '20px'}}>
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
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
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

        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#0f172a',
            fontSize: '14px'
          }}>
            Phone
          </label>
          <input
            name="phone"
            placeholder="e.g. +260977000000"
            value={form.phone}
            onChange={handleChange}
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

        <div style={{marginBottom: '20px'}}>
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
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

          {form.password.length > 0 && (
            <div style={{marginTop: '12px'}}>
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
                <span style={{fontSize: '12px', color: '#0f766e'}}>
                  {passwordStrength.strength}%
                </span>
              </div>

              {passwordTips.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: '#f0fdfa',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <p style={{fontWeight: '600', marginBottom: '6px', color: '#0f766e'}}>
                    To strengthen your password:
                  </p>
                  {passwordTips.map((tip, i) => (
                    <p key={i} style={{color: '#dc2626', marginBottom: '3px'}}>
                      × {tip}
                    </p>
                  ))}
                </div>
              )}

              {passwordTips.length === 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  background: '#d1fae5',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0d9488',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Great password!
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{marginBottom: '28px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#0f172a',
            fontSize: '14px'
          }}>
            I am a...
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #d1fae5',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0d9488'}
            onBlur={(e) => e.target.style.borderColor = '#d1fae5'}
          >
            <option value="buyer">Buyer (I want to order)</option>
            <option value="seller">Seller (I want to sell)</option>
            <option value="delivery">Delivery Guy (I deliver orders)</option>
          </select>
        </div>

        <button
          onClick={handleRegister}
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: '#0f766e'
        }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
              color: '#0d9488',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}>
            Login here
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;