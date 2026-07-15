/* eslint-disable */ import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{fontFamily: 'Inter, sans-serif', overflowX: 'hidden'}}>
      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{fontSize: '24px', fontWeight: '800',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          ZUT Deliver
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 24px', borderRadius: '10px', border: '2px solid #0d9488',
            background: 'none', color: '#0d9488', fontWeight: '600',
            fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>Login</button>
          <button onClick={() => navigate('/register')} style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            color: 'white', fontWeight: '600', fontSize: '15px',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 15px rgba(13,148,136,0.4)'
          }}>Get Started</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        padding: '100px 48px', textAlign: 'center', color: 'white'
      }}>
        <h1 style={{
          fontSize: '56px', fontWeight: '800', marginBottom: '24px',
          lineHeight: '1.1', letterSpacing: '-1px'
        }}>
          Campus Delivery<br/>Made Simple
        </h1>
        <p style={{
          fontSize: '20px', opacity: '0.9', marginBottom: '40px',
          maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6'
        }}>
          Order food, books, and supplies from campus vendors. Track your delivery in real-time. Fast, easy, and reliable.
        </p>
        <div style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
          <button onClick={() => navigate('/register')} style={{
            padding: '16px 40px', borderRadius: '14px', border: 'none',
            background: 'white', color: '#0d9488', fontWeight: '700',
            fontSize: '18px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
          }}>
            Start Ordering
          </button>
          <button onClick={() => navigate('/login')} style={{
            padding: '16px 40px', borderRadius: '14px',
            border: '2px solid rgba(255,255,255,0.5)',
            background: 'transparent', color: 'white', fontWeight: '700',
            fontSize: '18px', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}>
            Login
          </button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding: '80px 48px', background: '#f0fdfa', textAlign: 'center'}}>
        <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '16px', color: '#0f172a'}}>
          How It Works
        </h2>
        <p style={{color: '#0f766e', fontSize: '18px', marginBottom: '60px'}}>
          Three simple steps to get your order delivered
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '32px', maxWidth: '900px', margin: '0 auto'
        }}>
          {[
            { step: '1', title: 'Browse Products', desc: 'Explore products from campus sellers — food, books, stationery and more' },
            { step: '2', title: 'Place Your Order', desc: 'Add items to your cart, enter your delivery address and checkout instantly' },
            { step: '3', title: 'Track Live', desc: 'Watch your delivery guy in real-time as your order comes to you' }
          ].map(item => (
            <div key={item.step} style={{
              background: 'white', borderRadius: '20px', padding: '40px 32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #d1fae5'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #0d9488, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: 'white', fontWeight: '800', fontSize: '20px'
              }}>{item.step}</div>
              <h3 style={{fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#0f172a'}}>
                {item.title}
              </h3>
              <p style={{color: '#0f766e', lineHeight: '1.6', fontSize: '15px'}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES SECTION */}
      <section style={{padding: '80px 48px', background: 'white', textAlign: 'center'}}>
        <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '16px', color: '#0f172a'}}>
          Who Is It For?
        </h2>
        <p style={{color: '#0f766e', fontSize: '18px', marginBottom: '60px'}}>
          ZUT Deliver serves everyone on campus
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px', maxWidth: '1000px', margin: '0 auto'
        }}>
          {[
            { title: 'Buyers', color: '#0d9488', desc: 'Students who want to order food, books and supplies delivered to their hostel or classroom' },
            { title: 'Sellers', color: '#10b981', desc: 'Campus vendors who want to list their products and reach more students easily' },
            { title: 'Delivery Guys', color: '#0f766e', desc: 'Students who want to earn money by delivering orders around campus' },
            { title: 'Admin', color: '#059669', desc: 'Platform manager who monitors all users, orders and products for quality control' }
          ].map(item => (
            <div key={item.title} style={{
              background: '#f0fdfa', borderRadius: '20px', padding: '36px 24px',
              border: '2px solid #d1fae5'
            }}>
              <h3 style={{fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: item.color}}>
                {item.title}
              </h3>
              <p style={{color: '#0f766e', lineHeight: '1.6', fontSize: '14px'}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{
        padding: '80px 48px',
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        textAlign: 'center', color: 'white'
      }}>
        <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '16px'}}>
          Why ZUT Deliver?
        </h2>
        <p style={{opacity: '0.9', fontSize: '18px', marginBottom: '60px'}}>
          Built specifically for ZUT students and staff
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px', maxWidth: '1000px', margin: '0 auto'
        }}>
          {[
            { title: 'Real-Time Tracking', desc: 'Watch your delivery live on the map' },
            { title: 'Secure Platform', desc: 'JWT authentication keeps your data safe' },
            { title: 'Easy to Use', desc: 'Simple interface anyone can use' },
            { title: 'Zambian Kwacha', desc: 'All prices in ZMW for local users' },
            { title: 'Multiple Sellers', desc: 'Shop from many vendors at once' },
            { title: 'Order History', desc: 'Track all your past orders easily' }
          ].map(item => (
            <div key={item.title} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '28px 20px', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{fontSize: '16px', fontWeight: '700', marginBottom: '8px'}}>{item.title}</h3>
              <p style={{opacity: '0.8', fontSize: '13px', lineHeight: '1.5'}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{padding: '80px 48px', background: '#f0fdfa', textAlign: 'center'}}>
        <h2 style={{fontSize: '40px', fontWeight: '800', marginBottom: '16px', color: '#0f172a'}}>
          Ready to Get Started?
        </h2>
        <p style={{color: '#0f766e', fontSize: '18px', marginBottom: '40px'}}>
          Join hundreds of ZUT students already using ZUT Deliver
        </p>
        <button onClick={() => navigate('/register')} style={{
          padding: '18px 48px', borderRadius: '14px', border: 'none',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          color: 'white', fontWeight: '700', fontSize: '18px',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          boxShadow: '0 8px 30px rgba(13,148,136,0.4)'
        }}>
          Create Free Account
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0f172a', color: 'white',
        padding: '40px 48px', textAlign: 'center'
      }}>
        <div style={{
          fontSize: '22px', fontWeight: '800', marginBottom: '16px',
          background: 'linear-gradient(135deg, #0d9488, #10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          ZUT Deliver
        </div>
        <p style={{color: '#64748b', fontSize: '14px', marginBottom: '8px'}}>
          Campus Delivery System — Zambia University of Technology
        </p>
        <p style={{color: '#64748b', fontSize: '14px'}}>
          © 2026 NKH. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;