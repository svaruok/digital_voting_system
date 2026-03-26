import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './LoginPage.css';

const API = 'https://digital-voting-system-2-p2gy.onrender.com';

// ─── OTP Input ─────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const r0 = useRef(null); const r1 = useRef(null); const r2 = useRef(null);
  const r3 = useRef(null); const r4 = useRef(null); const r5 = useRef(null);
  const refs = [r0, r1, r2, r3, r4, r5];
  const digits = (value || '').split('');

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const arr = [...digits]; arr[i] = char;
    onChange(arr.join('').slice(0, 6));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const arr = [...digits]; arr[i] = '';
      onChange(arr.join(''));
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); refs[Math.min(pasted.length, 5)].current?.focus(); }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: '52px', height: '60px', textAlign: 'center',
            fontSize: '1.5rem', fontWeight: '700',
            background: 'rgba(255,255,255,0.06)',
            border: digits[i] ? '2px solid #138808' : '2px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', color: '#fff', outline: 'none',
            transition: 'border-color 0.2s', cursor: 'text',
            fontFamily: 'Outfit, sans-serif'
          }}
          onFocus={e => { e.target.style.borderColor='#FF9933'; e.target.style.boxShadow='0 0 0 3px rgba(255,153,51,0.2)'; }}
          onBlur={e  => { e.target.style.borderColor=digits[i]?'#138808':'rgba(255,255,255,0.15)'; e.target.style.boxShadow='none'; }}
        />
      ))}
    </div>
  );
};

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voter');
  const [loading, setLoading]     = useState(false);

  // Voter
  const [voterStep, setVoterStep]     = useState(1);
  const [email, setEmail]              = useState('');
  const [voterId, setVoterId]          = useState('');
  const [dob, setDob]                  = useState('');
  const [voterOtp, setVoterOtp]        = useState('');
  const [voterUserId, setVoterUserId]  = useState('');

  // Admin
  const [adminStep, setAdminStep]         = useState(1);
  const [adminId, setAdminId]             = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtp, setAdminOtp]           = useState('');
  const [adminMongoId, setAdminMongoId]   = useState('');

  // Register
  const [reg, setReg] = useState({
    voterId: '', fullName: '', dateOfBirth: '', email: '',
    phone: '', state: '', constituency: '', address: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('userRole');
    if (token) navigate(['super','district','booth'].includes(role) ? '/admin' : '/dashboard');
  }, [navigate]);

  // ── Voter handlers ──────────────────────────────────────────────────────────
  const handleVoterLogin = async () => {
    if (!email.trim() || !voterId.trim() || !dob) return toast.error('Enter Gmail, Voter ID and DOB');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/user/login`, { 
        email: email.trim().toLowerCase(), 
        voterId: voterId.trim(), 
        dateOfBirth: dob 
      });
      setVoterUserId(data.userId);
      setVoterStep(2);
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleVoterOtp = async () => {
    if (voterOtp.length !== 6) return toast.error('Enter the full 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/user/verify-otp`, { userId: voterUserId, otp: voterOtp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', 'voter');
      localStorage.setItem('constituency', data.constituency);
      localStorage.setItem('fullName', data.fullName);
      toast.success('Welcome, ' + data.fullName + '! 🎉');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'OTP verification failed'); }
    finally { setLoading(false); }
  };

  // ── Admin handlers ──────────────────────────────────────────────────────────
  const handleAdminLogin = async () => {
    if (!adminId.trim() || !adminPassword) return toast.error('Enter Admin ID and Password');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/login`, { adminId: adminId.trim(), password: adminPassword });
      
      // Direct login for super-admin (ADMIN001/admin123) - no OTP needed
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.admin.role);
        localStorage.setItem('adminName', data.admin.name);
        toast.success(`Direct login successful! Welcome, ${data.admin.name} 👑`);
        navigate('/admin');
        return;
      }

      // Regular admin: Proceed to OTP
      setAdminMongoId(data.adminMongoId);
      setAdminStep(2);
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.error || 'Admin login failed'); }
    finally { setLoading(false); }
  };

  const handleAdminOtp = async () => {
    if (adminOtp.length !== 6) return toast.error('Enter the full 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/verify-otp`, { adminMongoId, otp: adminOtp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.admin.role);
      localStorage.setItem('adminName', data.admin.name);
      toast.success('Welcome, ' + data.admin.name + '! 🎉');
      navigate('/admin');
    } catch (err) { toast.error(err.response?.data?.error || 'OTP verification failed'); }
    finally { setLoading(false); }
  };

  // ── Register handler ────────────────────────────────────────────────────────
  const handleRegister = async () => {
    const { voterId, fullName, dateOfBirth, email, phone, state, constituency } = reg;
    if (!voterId || !fullName || !dateOfBirth || !email || !phone || !state || !constituency) {
      return toast.error('Please fill all required fields');
    }
    if (voterId.trim().length < 5) return toast.error('Voter ID must be at least 5 characters');
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error('Enter a valid email address');
    if (phone.replace(/\D/g,'').length < 10) return toast.error('Enter a valid 10-digit phone number');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/user/register`, { ...reg, voterId: reg.voterId.trim() });
      toast.success(data.message);
      setActiveTab('voter');
      setVoterId(reg.voterId.trim());
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    card: {
      width: '100%', maxWidth: '480px',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,153,51,0.2)',
      borderRadius: '20px', overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    },
    hdr: {
      background: 'linear-gradient(135deg, #FF9933 0%, #e8850f 100%)',
      padding: '24px', textAlign: 'center',
    },
    tabs: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    tab: (a) => ({
      flex: 1, padding: '13px 6px', background: 'transparent', border: 'none',
      borderBottom: a ? '2px solid #FF9933' : '2px solid transparent',
      color: a ? '#FF9933' : 'rgba(255,255,255,0.5)',
      fontWeight: a ? '600' : '400', cursor: 'pointer', fontSize: '0.82rem',
      transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif',
    }),
    body: { padding: '28px' },
    label: { display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px', marginTop: '14px' },
    input: {
      width: '100%', padding: '12px 14px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none',
      boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
    },
    select: {
      width: '100%', padding: '12px 14px',
      background: '#1a1f3e',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none',
      boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
    },
    btn: {
      width: '100%', padding: '13px',
      background: 'linear-gradient(135deg, #FF9933 0%, #e8850f 100%)',
      border: 'none', borderRadius: '10px', color: '#fff',
      fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
      marginTop: '20px', fontFamily: 'Outfit, sans-serif',
    },
    back: {
      background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
      padding: '7px 16px', cursor: 'pointer', fontSize: '0.82rem',
      marginBottom: '14px', fontFamily: 'Outfit, sans-serif',
    },
    dot: (a, d) => ({
      width: '10px', height: '10px', borderRadius: '50%',
      background: d ? '#138808' : a ? '#FF9933' : 'rgba(255,255,255,0.2)',
    }),
    line: (d) => ({ flex: 1, height: '2px', background: d ? '#138808' : 'rgba(255,255,255,0.1)' }),
  };

  const focusIn  = e => e.target.style.borderColor = '#FF9933';
  const focusOut = e => e.target.style.borderColor = 'rgba(255,255,255,0.12)';

  const indianStates = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'];

  return (
    <div className="login-page">
      <div style={S.card}>

        {/* Header */}

        <div style={S.hdr}>

          <img src="/logo192.png" alt="Govt of India" style={{ width: '80px', height: '80px' }} />

          <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: '1.3rem', fontFamily: 'Playfair Display, serif' }}>
            Government of India<br /><small style={{ fontSize: '0.85em', fontWeight: '400' }}>Digital Voting Portal</small>
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}>
            Election Commission of India · Secure & Blockchain Protected
          </p>
        </div>


        {/* Tabs */}
        <div style={S.tabs}>
          {[['voter','👤 Voter Login'],['admin','🔐 Admin'],['register','📝 Register']].map(([k,l]) => (
            <button key={k} style={S.tab(activeTab===k)} onClick={() => setActiveTab(k)}>{l}</button>
          ))}
        </div>

        <div style={S.body}>

          {/* ── Voter Login ── */}
          {activeTab === 'voter' && (
            <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
              <div style={S.dot(voterStep===1, voterStep>1)} />
              <div style={S.line(voterStep>1)} />
              <div style={S.dot(voterStep===2, false)} />
            </div>

            {voterStep === 1 ? <>
              <h3 style={{ color:'#fff', margin:'0 0 2px', fontSize:'1.05rem' }}>{t('voterCredentials') || 'Voter Credentials'}</h3>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', margin:'0 0 6px' }}>Enter your Gmail, Voter ID and DOB - OTP sent to Gmail</p>
              <label style={S.label}>{t('email') || 'Gmail Address'} *</label>
              <input style={S.input} type="email" placeholder="your.email@gmail.com" value={email}
                onChange={e=>setEmail(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
              <label style={S.label}>{t('voterId') || 'Voter ID'} *</label>
              <input style={S.input} placeholder="e.g. KA/01/123/456789" value={voterId}
                onChange={e=>setVoterId(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
              <label style={S.label}>{t('dob') || 'Date of Birth'} *</label>
              <input style={S.input} type="date" value={dob}
                onChange={e=>setDob(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
              <button style={{ ...S.btn, opacity: loading?0.7:1 }} onClick={handleVoterLogin} disabled={loading}>
                {loading ? '⏳ Sending OTP...' : 'Send OTP to Gmail →'}
              </button>
            </> : <>
              <button style={S.back} onClick={() => { setVoterStep(1); setVoterOtp(''); }}>← Back</button>
              <h3 style={{ color:'#fff', margin:'0 0 2px', fontSize:'1.05rem' }}>Enter OTP</h3>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', margin:0 }}>
                Check your Gmail inbox (or server console for dev)
              </p>
              <OtpInput value={voterOtp} onChange={setVoterOtp} />
              <button style={{ ...S.btn, marginTop:'8px', opacity: loading?0.7:1 }} onClick={handleVoterOtp} disabled={loading}>
                {loading ? '⏳ Verifying...' : '✓ Login'}
              </button>
            </>}
            </div>
          )}

          {/* ── Admin Login ── */}
          {activeTab === 'admin' && <>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
              <div style={S.dot(adminStep===1, adminStep>1)} />
              <div style={S.line(adminStep>1)} />
              <div style={S.dot(adminStep===2, false)} />
            </div>

            {adminStep === 1 ? <>
              <h3 style={{ color:'#fff', margin:'0 0 2px', fontSize:'1.05rem' }}>Admin Access</h3>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', margin:'0 0 6px' }}>Restricted to authorized personnel only</p>
              <label style={S.label}>Admin ID *</label>
              <input style={S.input} placeholder="e.g. ADMIN001" value={adminId}
                onChange={e=>setAdminId(e.target.value)} onFocus={focusIn} onBlur={focusOut} />
              <label style={S.label}>Password *</label>
              <input style={S.input} type="password" placeholder="Enter your password" value={adminPassword}
                onChange={e=>setAdminPassword(e.target.value)} onFocus={focusIn} onBlur={focusOut}
                onKeyDown={e => e.key==='Enter' && handleAdminLogin()} />
              <button style={{ ...S.btn, opacity: loading?0.7:1 }} onClick={handleAdminLogin} disabled={loading}>
                {loading ? '⏳ Verifying...' : 'Continue →'}
              </button>
            </> : <>
              <button style={S.back} onClick={() => { setAdminStep(1); setAdminOtp(''); }}>← Back</button>
              <h3 style={{ color:'#fff', margin:'0 0 2px', fontSize:'1.05rem' }}>Two-Factor Verification</h3>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', margin:0 }}>
                OTP sent to your registered email. Check server terminal if email is not configured.
              </p>
              <OtpInput value={adminOtp} onChange={setAdminOtp} />
              <button style={{ ...S.btn, marginTop:'8px', opacity: loading?0.7:1 }} onClick={handleAdminOtp} disabled={loading}>
                {loading ? '⏳ Verifying...' : '✓ Verify & Enter Dashboard'}
              </button>
            </>}
          </>}

          {/* ── Register ── */}
          {activeTab === 'register' && <>
            <h3 style={{ color:'#fff', margin:'0 0 2px', fontSize:'1.05rem' }}>Voter Registration</h3>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', margin:'0 0 6px' }}>Register with your official voter details</p>

            {[
              ['voterId',     'Voter ID *',           'text',  'e.g. KA/01/123/456789'],
              ['fullName',    'Full Name *',           'text',  'As on official records'],
              ['dateOfBirth', 'Date of Birth *',       'date',  ''],
              ['email',       'Email Address *',       'email', 'For OTP delivery'],
              ['phone',       'Mobile Number *',       'tel',   '10-digit mobile number'],
              ['address',     'Residential Address',   'text',  'Optional'],
            ].map(([field, label, type, placeholder]) => (
              <div key={field}>
                <label style={S.label}>{label}</label>
                <input style={S.input} type={type} placeholder={placeholder}
                  value={reg[field]} onChange={e => setReg(p => ({ ...p, [field]: e.target.value }))}
                  onFocus={focusIn} onBlur={focusOut} />
              </div>
            ))}

            <label style={S.label}>State *</label>
            <select style={S.select} value={reg.state} onChange={e => setReg(p => ({ ...p, state: e.target.value }))}>
              <option value="">Select your state</option>
              {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label style={S.label}>Constituency *</label>
            <input style={S.input} placeholder="Your constituency name"
              value={reg.constituency} onChange={e => setReg(p => ({ ...p, constituency: e.target.value }))}
              onFocus={focusIn} onBlur={focusOut} />

            <button style={{ ...S.btn, opacity: loading?0.7:1 }} onClick={handleRegister} disabled={loading}>
              {loading ? '⏳ Registering...' : '✅ Register Voter'}
            </button>
            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'0.76rem', marginTop:'10px' }}>
              Already registered? Switch to Voter Login tab
            </p>
          </>}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
