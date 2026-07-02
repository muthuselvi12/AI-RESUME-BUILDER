import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('All fields required.'); return; }
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      login(data.user, data.token);
      toast('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally { setLoading(false); }
  };

  const styles = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', position:'relative', overflow:'hidden' },
    bgOrb1: { position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', top:'-80px', left:'-80px', animation:'float 8s ease-in-out infinite' },
    bgOrb2: { position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', bottom:'-40px', right:'-40px', animation:'float 6s ease-in-out infinite reverse' },
    card: { background:'var(--gradient-card)', backdropFilter:'blur(20px)', border:'1px solid var(--border)', borderRadius:'20px', padding:'24px', width:'100%', maxWidth:'400px', boxShadow:'var(--shadow-lg)', position:'relative', overflow:'hidden' },
    cardGlow: { position:'absolute', top:'-50%', left:'-50%', width:'200%', height:'200%', background:'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50%)', pointerEvents:'none' },
    logo: { width:'60px', height:'60px', background:'var(--gradient-primary)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' },
    title: { fontSize:'24px', fontWeight:700, color:'var(--text)', marginBottom:'8px', textAlign:'center' },
    subtitle: { fontSize:'14px', color:'var(--text3)', textAlign:'center', marginBottom:'28px' },
    error: { background:'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:'12px', padding:'12px 16px', fontSize:'13px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' },
    inputGroup: { marginBottom:'20px' },
    label: { display:'block', fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' },
    input: { width:'100%', padding:'14px 16px', border:'1px solid var(--border)', borderRadius:'12px', background:'var(--bg)', color:'var(--text)', fontSize:'14px', outline:'none', transition:'all 0.2s ease', fontFamily:'inherit' },
    inputFocus: { borderColor:'var(--primary)', boxShadow:'0 0 0 4px var(--primary-light)' },
    btn: { width:'100%', padding:'14px', background:'var(--gradient-primary)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 16px rgba(99,102,241,0.4)', transition:'all 0.25s ease', marginTop:'8px' },
    btnHover: { transform:'translateY(-2px)', boxShadow:'0 8px 24px rgba(99,102,241,0.5)' },
    link: { color:'var(--primary)', fontWeight:600, textDecoration:'none', transition:'color 0.2s' },
    footer: { textAlign:'center', marginTop:'24px', fontSize:'13px', color:'var(--text3)' },
    features: { display:'flex', justifyContent:'center', gap:'24px', marginTop:'32px', paddingTop:'24px', borderTop:'1px solid var(--border)' },
    feature: { display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text3)' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.card}>
        <div style={styles.cardGlow} />
        <div style={styles.logo}>📄</div>
        <h2 style={styles.title}>Welcome back! 👋</h2>
        <p style={styles.subtitle}>Sign in to continue building amazing resumes</p>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e=>setForm({...form,email:e.target.value})}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••••••"
              value={form.password}
              onChange={e=>setForm({...form,password:e.target.value})}
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Signing in...</>
            ) : (
              <>✨ Sign In</>
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Create one free</Link>
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>🚀 <span>AI-Powered</span></div>
          <div style={styles.feature}>📄 <span>Free Export</span></div>
          <div style={styles.feature}>💬 <span>24/7 Support</span></div>
        </div>
      </div>
    </div>
  );
}