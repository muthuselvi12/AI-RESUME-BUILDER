import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name||!form.email||!form.password) { setError('All fields required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await authService.register({ name:form.name, email:form.email, password:form.password });
      toast('Account created! Please sign in to continue.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const styles = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden' },
    bgOrb1: { position:'absolute', width:'350px', height:'350px', borderRadius:'50%', background:'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', top:'-80px', right:'-80px', animation:'float 7s ease-in-out infinite' },
    bgOrb2: { position:'absolute', width:'250px', height:'250px', borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', bottom:'-60px', left:'-60px', animation:'float 9s ease-in-out infinite reverse' },
    card: { background:'var(--gradient-card)', backdropFilter:'blur(20px)', border:'1px solid var(--border)', borderRadius:'24px', padding:'40px', width:'100%', maxWidth:'440px', boxShadow:'var(--shadow-lg)', position:'relative', overflow:'hidden' },
    cardGlow: { position:'absolute', top:'-50%', left:'-50%', width:'200%', height:'200%', background:'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 50%)', pointerEvents:'none' },
    logo: { width:'60px', height:'60px', background:'var(--gradient-primary)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(139,92,246,0.4)' },
    title: { fontSize:'24px', fontWeight:700, color:'var(--text)', marginBottom:'8px', textAlign:'center' },
    subtitle: { fontSize:'14px', color:'var(--text3)', textAlign:'center', marginBottom:'28px' },
    error: { background:'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:'12px', padding:'12px 16px', fontSize:'13px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px' },
    inputGroup: { marginBottom:'18px' },
    label: { display:'block', fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' },
    input: { width:'100%', padding:'14px 16px', border:'1px solid var(--border)', borderRadius:'12px', background:'var(--bg)', color:'var(--text)', fontSize:'14px', outline:'none', transition:'all 0.2s ease', fontFamily:'inherit' },
    inputFocus: { borderColor:'var(--primary)', boxShadow:'0 0 0 4px var(--primary-light)' },
    btn: { width:'100%', padding:'14px', background:'var(--gradient-primary)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 16px rgba(139,92,246,0.4)', transition:'all 0.25s ease', marginTop:'8px' },
    btnHover: { transform:'translateY(-2px)', boxShadow:'0 8px 24px rgba(139,92,246,0.5)' },
    link: { color:'var(--primary)', fontWeight:600, textDecoration:'none', transition:'color 0.2s' },
    footer: { textAlign:'center', marginTop:'24px', fontSize:'13px', color:'var(--text3)' },
    benefits: { display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'16px', marginTop:'28px', paddingTop:'24px', borderTop:'1px solid var(--border)' },
    benefit: { display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text3)', background:'var(--bg2)', padding:'6px 12px', borderRadius:'20px' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.card}>
        <div style={styles.cardGlow} />
        <div style={styles.logo}>🚀</div>
        <h2 style={styles.title}>Create your account</h2>
        <p style={styles.subtitle}>Start building professional resumes with AI</p>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              placeholder="Alex Chen"
              value={form.name}
              onChange={e=>setForm({...form,name:e.target.value})}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
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
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e=>setForm({...form,password:e.target.value})}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••••••"
              value={form.confirm}
              onChange={e=>setForm({...form,confirm:e.target.value})}
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Creating account...</>
            ) : (
              <>✨ Create Account</>
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>

        <div style={styles.benefits}>
          <div style={styles.benefit}>🎯 <span>AI Resume Builder</span></div>
          <div style={styles.benefit}>📥 <span>PDF Export</span></div>
          <div style={styles.benefit}>💬 <span>Career Chat</span></div>
        </div>
      </div>
    </div>
  );
}