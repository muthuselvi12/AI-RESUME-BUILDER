import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, sub, icon, colorClass, delay }) => {
  const colorClasses = {
    primary:   { bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', glow: 'rgba(99,102,241,0.2)' },
    success:   { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16,185,129,0.2)' },
    accent:    { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', glow: 'rgba(6,182,212,0.2)' },
    secondary: { bg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', glow: 'rgba(236,72,153,0.2)' },
  };
  const colors = colorClasses[colorClass] || colorClasses.primary;

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeIn 0.5s ease forwards',
      animationDelay: delay,
      opacity: 0,
    }}>
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: colors.glow, filter: 'blur(20px)',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', position: 'relative' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>📈 {sub}</p>
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: colors.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '20px',
          boxShadow: `0 6px 16px ${colors.glow}`,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    historyService.getStats()
      .then(r => setStats(r.data.stats))
      .catch(() => setStats({ totalResumes: 0, totalChats: 0, recentResumes: [], templateUsage: {} }))
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: '📝', label: 'New Resume',     sub: 'AI-powered builder',   path: '/builder' },
    { icon: '💬', label: 'Chat Assistant', sub: 'Ask career questions', path: '/chat' },
    { icon: '📁', label: 'View History',   sub: 'Browse past resumes',  path: '/history' },
  ];

  const cardAnim = (delay) => ({
    animation: 'fadeIn 0.5s ease forwards',
    animationDelay: delay,
    opacity: 0,
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Greeting ── */}
      <div style={{ marginBottom: '24px', ...cardAnim('0.05s') }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '24px' }}>👋</span>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginLeft: '34px' }}>
          Here's your resume activity overview
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <StatCard label="Resumes Created" value={stats?.totalResumes ?? 0}                        icon="📄" sub="All time" colorClass="primary"   delay="0.1s" />
        <StatCard label="Chat Sessions"   value={stats?.totalChats ?? 0}                          icon="💬" sub="All time" colorClass="accent"    delay="0.2s" />
        <StatCard label="Templates Used"  value={Object.keys(stats?.templateUsage || {}).length}  icon="🎨" sub="Unique"   colorClass="secondary" delay="0.3s" />
      </div>

      {/* ── Main Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Recent Resumes */}
        <div className="card" style={cardAnim('0.4s')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📋 Recent Resumes</h3>
            <span
              style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => navigate('/history')}
            >View all →</span>
          </div>

          {!stats?.recentResumes?.length ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.5 }}>📄</div>
              <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px' }}>No resumes yet</p>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => navigate('/builder')}>
                Create resume →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stats.recentResumes.slice(0, 4).map(r => (
                <div key={r._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s ease' }}
                  onClick={() => navigate(`/builder/${r._id}`)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{r.template} • {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ color: 'var(--primary)' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Usage */}
        <div className="card" style={cardAnim('0.5s')}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>📊 Template Usage</h3>
          {['modern', 'classic', 'minimal', 'ats-optimal', 'technical', 'executive'].map(t => {
            const count = stats?.templateUsage?.[t] || 0;
            const total = stats?.totalResumes || 1;
            const pct   = Math.round((count / total) * 100);
            const clr   = { modern: '#6366f1', classic: '#1a1a2e', minimal: '#6b7280', 'ats-optimal': '#059669', technical: '#0891b2', executive: '#7c3aed' };
            return (
              <div key={t} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text)', fontWeight: 500, fontSize: '12px' }}>{t}</span>
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '7px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: clr[t] || '#6366f1', width: `${pct}%`, borderRadius: '4px', transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card" style={cardAnim('0.6s')}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>🚀 Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          {quickActions.map(q => (
            <div key={q.path}
              style={{ padding: '16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease' }}
              onClick={() => navigate(q.path)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{q.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{q.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{q.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}