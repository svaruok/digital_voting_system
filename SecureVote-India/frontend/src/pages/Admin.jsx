// frontend/src/pages/Admin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', party: '', partySymbol: '', constituency: '', manifesto: ''
  });

  const adminName = localStorage.getItem('adminName') || 'Admin';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, r] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, { headers }),
        axios.get(`${API}/api/admin/candidates`, { headers }),
        axios.get(`${API}/api/results`)
      ]);
      setStats(s.data);
      setCandidates(c.data);
      setResults(r.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVoters = async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/voters`, { headers });
      setVoters(data);
    } catch {
      toast.error('Failed to fetch voters');
    }
  };

  const handleAddCandidate = async () => {
    if (!form.name || !form.party || !form.constituency) {
      return toast.error('Name, party and constituency are required');
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/candidates`, form, { headers });
      toast.success('Candidate added! ✅');
      setForm({ name: '', party: '', partySymbol: '', constituency: '', manifesto: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = async (id, name) => {
    if (!window.confirm(`Delete candidate "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/candidates/${id}`, { headers });
      toast.success('Candidate removed');
      fetchAll();
    } catch {
      toast.error('Failed to delete candidate');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out');
  };

  const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    page: { minHeight: 'calc(100vh - 160px)', background: '#0A0F2C', display: 'flex' },
    sidebar: {
      width: '220px',
      background: 'rgba(255,255,255,0.03)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      padding: '24px 0',
      flexShrink: 0,
    },
    sideItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 24px',
      color: active ? '#FF9933' : 'rgba(255,255,255,0.5)',
      background: active ? 'rgba(255,153,51,0.08)' : 'transparent',
      borderLeft: active ? '3px solid #FF9933' : '3px solid transparent',
      cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? '600' : '400',
      transition: 'all 0.2s', border: 'none', width: '100%', textAlign: 'left',
      fontFamily: 'Outfit, sans-serif',
    }),
    main: { flex: 1, padding: '28px', overflowY: 'auto' },
    card: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px', padding: '20px',
    },
    statCard: (accent) => ({
      background: `linear-gradient(135deg, ${accent}15 0%, ${accent}05 100%)`,
      border: `1px solid ${accent}30`,
      borderRadius: '14px', padding: '20px',
    }),
    label: { display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '6px', marginTop: '14px' },
    input: {
      width: '100%', padding: '11px 14px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px', color: '#fff', fontSize: '0.9rem',
      outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
    },
    btn: {
      background: 'linear-gradient(135deg, #FF9933 0%, #e8850f 100%)',
      border: 'none', color: '#fff', padding: '12px 24px', borderRadius: '10px',
      cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif',
    },
  };

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
          <p style={{ margin: 0, color: '#FF9933', fontWeight: '700', fontSize: '0.9rem' }}>{adminName}</p>
          <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Super Admin</p>
        </div>
        {[
          ['dashboard', '📊', 'Dashboard'],
          ['candidates', '👥', 'Candidates'],
          ['results', '📈', 'Live Results'],
          ['voters', '🗂️', 'Voters'],
        ].map(([key, icon, label]) => (
          <button key={key} style={s.sideItem(activeTab === key)} onClick={() => {
            setActiveTab(key);
            if (key === 'voters') fetchVoters();
          }}>
            <span>{icon}</span> {label}
          </button>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '12px', paddingTop: '12px' }}>
          <button style={s.sideItem(false)} onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{ color: '#fff', margin: '0 0 20px', fontFamily: 'Playfair Display, serif' }}>Election Dashboard</h2>
            {loading ? (
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading stats...</p>
            ) : stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {[
                    ['Total Voters', stats.totalVoters, '#FF9933', '👥'],
                    ['Votes Cast', stats.votesCast, '#138808', '🗳️'],
                    ['Turnout', stats.turnout + '%', '#4f9cf9', '📊'],
                    ['Candidates', stats.totalCandidates, '#a855f7', '🏛️'],
                    ['Active Elections', stats.activeElections, '#f43f5e', '⚡'],
                    ['Constituencies', stats.totalConstituencies, '#f59e0b', '🗺️'],
                  ].map(([label, value, accent, icon]) => (
                    <div key={label} style={s.statCard(accent)}>
                      <div style={{ fontSize: '1.6rem' }}>{icon}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: accent, margin: '6px 0 2px' }}>{value}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ ...s.card, marginTop: '8px' }}>
                  <h3 style={{ color: '#FF9933', margin: '0 0 12px', fontSize: '0.9rem' }}>⚡ Quick Actions</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button style={s.btn} onClick={() => setActiveTab('candidates')}>➕ Add Candidate</button>
                    <button style={{ ...s.btn, background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }} onClick={() => setActiveTab('results')}>
                      📈 View Results
                    </button>
                    <button style={{ ...s.btn, background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }} onClick={() => { setActiveTab('voters'); fetchVoters(); }}>
                      🗂️ Manage Voters
                    </button>
                    <button style={{ ...s.btn, background: 'rgba(19,136,8,0.2)', border: '1px solid #138808', boxShadow: 'none' }}
                      onClick={() => window.open(`${API}/api/init-demo`, '_blank')}>
                      🔄 Re-init Demo Data
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ── Add Candidate ── */}
        {activeTab === 'candidates' && (
          <>
            <h2 style={{ color: '#fff', margin: '0 0 20px', fontFamily: 'Playfair Display, serif' }}>Manage Candidates</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Form */}
              <div style={s.card}>
                <h3 style={{ color: '#FF9933', margin: '0 0 4px', fontSize: '1rem' }}>➕ Add Candidate</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0 0 8px' }}>Add a candidate to a constituency</p>

                {[
                  ['name', 'Candidate Full Name *', 'text', 'e.g. Arjun Sharma'],
                  ['party', 'Party Name *', 'text', 'e.g. National Democratic Party'],
                  ['partySymbol', 'Party Symbol (emoji)', 'text', 'e.g. 🪷'],
                  ['constituency', 'Constituency *', 'text', 'e.g. Bangalore North'],
                  ['manifesto', 'Manifesto / Tagline', 'text', 'Brief description'],
                ].map(([field, label, type, placeholder]) => (
                  <div key={field}>
                    <label style={s.label}>{label}</label>
                    <input style={s.input} type={type} placeholder={placeholder} value={form[field]}
                      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                      onFocus={e => e.target.style.borderColor = '#FF9933'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                  </div>
                ))}

                <button style={{ ...s.btn, marginTop: '18px', width: '100%', opacity: submitting ? 0.7 : 1 }}
                  onClick={handleAddCandidate} disabled={submitting}>
                  {submitting ? '⏳ Adding...' : '✅ Add Candidate'}
                </button>
              </div>

              {/* Candidate list */}
              <div>
                <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: '1rem' }}>
                  All Candidates ({candidates.length})
                </h3>
                {candidates.length === 0 ? (
                  <div style={{ ...s.card, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>
                    <div style={{ fontSize: '2rem' }}>👥</div>
                    <p>No candidates yet. Add one!</p>
                  </div>
                ) : candidates.map(c => (
                  <div key={c._id} style={{ ...s.card, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{c.partySymbol || '🗳️'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{c.name}</p>
                      <p style={{ margin: '2px 0 0', color: '#FF9933', fontSize: '0.78rem' }}>{c.party}</p>
                      <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{c.constituency}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#4ade80', fontWeight: '700' }}>{c.votes}</p>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>votes</p>
                    </div>
                    <button onClick={() => handleDeleteCandidate(c._id, c.name)} style={{
                      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem'
                    }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Results ── */}
        {activeTab === 'results' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Playfair Display, serif' }}>Live Results</h2>
              <button style={{ ...s.btn, padding: '8px 16px', fontSize: '0.82rem' }} onClick={fetchAll}>🔄 Refresh</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 20px', fontSize: '0.85rem' }}>
              Total votes cast: <strong style={{ color: '#FF9933' }}>{totalVotes}</strong>
            </p>

            {results.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '3rem' }}>📊</div>
                <p>No results yet. Votes will appear here as they are cast.</p>
              </div>
            ) : results.map((c, i) => {
              const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={c._id} style={{ ...s.card, marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{medals[i] || `#${i + 1}`}</span>
                    <span style={{ fontSize: '1.5rem' }}>{c.partySymbol || '🗳️'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: '600' }}>{c.name}</p>
                      <p style={{ margin: '2px 0 0', color: '#FF9933', fontSize: '0.82rem' }}>{c.party} · {c.constituency}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#4ade80', fontWeight: '700', fontSize: '1.2rem' }}>{c.votes}</p>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{pct}%</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '6px' }}>
                    <div style={{
                      height: '100%', borderRadius: '100px',
                      background: i === 0 ? '#FF9933' : i === 1 ? '#4f9cf9' : '#a855f7',
                      width: `${pct}%`, transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── Voters ── */}
        {activeTab === 'voters' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Playfair Display, serif' }}>
                Registered Voters ({voters.length})
              </h2>
              <button style={{ ...s.btn, padding: '8px 16px', fontSize: '0.82rem' }} onClick={fetchVoters}>🔄 Refresh</button>
            </div>

            {voters.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '3rem' }}>🗂️</div>
                <p>No voters registered yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {['Voter ID', 'Name', 'Constituency', 'State', 'Voted', 'Blockchain TX'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.75rem',
                          borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map(v => (
                      <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 14px', color: '#FF9933', fontFamily: 'monospace' }}>{v.voterId}</td>
                        <td style={{ padding: '12px 14px', color: '#fff' }}>{v.fullName}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{v.constituency}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{v.state}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: v.hasVoted ? 'rgba(19,136,8,0.2)' : 'rgba(255,255,255,0.08)',
                            color: v.hasVoted ? '#4ade80' : 'rgba(255,255,255,0.4)',
                            padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem'
                          }}>
                            {v.hasVoted ? '✅ Voted' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {v.txHash ? `${v.txHash.slice(0, 10)}...` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Admin;
