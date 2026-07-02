/**
 * components/UI/Layout.js — Responsive app shell: sidebar + topbar + page outlet
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const s = {
  shell: { display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' },

  // Sidebar - Desktop
  sidebar: {
    width:'260px',
    background:'linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)',
    borderRight:'1px solid var(--border)',
    display:'flex',
    flexDirection:'column',
    flexShrink:0,
    transition:'transform 0.3s ease, width 0.3s ease',
    position:'relative',
    zIndex: 1000,
  },

  // Mobile sidebar overlay
  sidebarMobile: {
    position:'fixed',
    top:0,
    left:0,
    bottom:0,
    width:'280px',
    transform:'translateX(-100%)',
  },
  sidebarMobileOpen: {
    transform:'translateX(0)',
  },

  sidebarGlow: {
    position:'absolute',
    top:'-50%',
    left:'-50%',
    width:'200%',
    height:'200%',
    background:'radial-gradient(circle at 50% 30%, rgba(99,102,241,0.06) 0%, transparent 50%)',
    pointerEvents:'none',
  },
  logo: { padding:'24px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'14px', position:'relative' },
  logoIcon: {
    fontSize:'26px',
    background:'var(--gradient-primary)',
    width:'44px',
    height:'44px',
    borderRadius:'12px',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    boxShadow:'0 6px 16px rgba(99,102,241,0.3)',
  },
  logoText: {
    fontWeight:700,
    fontSize:'20px',
    background:'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    WebkitBackgroundClip:'text',
    WebkitTextFillColor:'transparent',
  },
  nav: { flex:1, padding:'16px', overflowY:'auto' },
  navSection: {
    fontSize:'10px',
    fontWeight:600,
    color:'var(--text3)',
    textTransform:'uppercase',
    letterSpacing:'0.1em',
    padding:'16px 12px 8px',
  },
  navItem: {
    display:'flex',
    alignItems:'center',
    gap:'12px',
    padding:'12px 16px',
    borderRadius:'12px',
    cursor:'pointer',
    color:'var(--text2)',
    fontSize:'14px',
    marginBottom:'4px',
    textDecoration:'none',
    transition:'all 0.2s ease',
    position:'relative',
  },
  navIcon: { fontSize:'18px', width:'20px', flexShrink:0 },
  navBadge: {
    marginLeft:'auto',
    padding:'3px 10px',
    borderRadius:'20px',
    fontSize:'10px',
    fontWeight:600,
    background:'var(--gradient-primary)',
    color:'#fff',
    boxShadow:'0 2px 8px rgba(99,102,241,0.3)',
  },
  footer: {
    padding:'20px',
    borderTop:'1px solid var(--border)',
    display:'flex',
    alignItems:'center',
    gap:'14px',
    background:'var(--bg)',
  },
  avatar: {
    width:'40px',
    height:'40px',
    borderRadius:'12px',
    background:'var(--gradient-primary)',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    color:'#fff',
    fontWeight:700,
    fontSize:'15px',
    flexShrink:0,
    boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
  },
  userName:{ fontSize:'14px', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'140px' },
  userRole:{ fontSize:'11px', color:'var(--text3)', textTransform:'capitalize' },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: {
    height:'64px',
    borderBottom:'1px solid var(--border)',
    background:'var(--bg)',
    display:'flex',
    alignItems:'center',
    justifyContent:'space-between',
    padding:'0 16px',
    flexShrink:0,
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
  },
  topbarLeft: { display:'flex', alignItems:'center', gap:'12px' },
  topbarRight: { display:'flex', alignItems:'center', gap:'8px' },
  menuBtn: {
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    padding:'8px',
    border:'1px solid var(--border)',
    borderRadius:'10px',
    background:'var(--bg2)',
    cursor:'pointer',
    fontSize:'20px',
    transition:'all 0.2s ease',
  },
  iconBtn: {
    padding:'8px 12px',
    border:'1px solid var(--border)',
    borderRadius:'10px',
    background:'var(--bg2)',
    cursor:'pointer',
    fontSize:'18px',
    transition:'all 0.2s ease',
  },
  logoutBtn: {
    padding:'8px 14px',
    border:'1px solid var(--border)',
    borderRadius:'10px',
    background:'var(--bg2)',
    cursor:'pointer',
    fontSize:'13px',
    color:'var(--text2)',
    fontWeight:500,
    transition:'all 0.2s ease',
    display:'flex',
    alignItems:'center',
    gap:'6px',
  },
  content: { flex:1, overflowY:'auto', padding:'16px' },

  // Overlay for mobile
  overlay: {
    position:'fixed',
    inset:0,
    background:'rgba(0,0,0,0.5)',
    zIndex: 999,
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
  },
  overlayVisible: {
    opacity: 1,
    visibility: 'visible',
  },
};

const NAV = [
  { path:'/dashboard', label:'Dashboard',      icon:'📊' },
  { path:'/builder',   label:'Resume Builder', icon:'📝', badge:'AI' },
  { path:'/chat',      label:'Chat Assistant', icon:'💬', badge:'AI' },
  { path:'/history',   label:'History',        icon:'📁' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeStyle = {
    background:'var(--primary-light)',
    color:'var(--primary)',
    fontWeight:600,
    boxShadow:'0 2px 12px rgba(99,102,241,0.2)',
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div style={s.shell}>
      {/* Mobile Overlay */}
      <div
        style={{...s.overlay, ...(sidebarOpen ? s.overlayVisible : {})}}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside style={{
        ...s.sidebar,
        ...s.sidebarMobile,
        ...(sidebarOpen ? s.sidebarMobileOpen : {}),
      }}>
        <div style={s.sidebarGlow} />
        <div style={s.logo}>
          <span style={s.logoIcon}>📄</span>
          <span style={s.logoText}>ResumeAI</span>
        </div>

        <nav style={s.nav}>
          <p style={s.navSection}>Main Menu</p>
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? activeStyle : {}) })}
              onClick={closeSidebar}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.badge && <span style={s.navBadge}>{item.badge}</span>}
            </NavLink>
          ))}

          {user?.role === 'admin' && <>
            <p style={s.navSection}>Admin</p>
            <NavLink
              to="/admin"
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? activeStyle : {}) })}
              onClick={closeSidebar}
            >
              <span style={s.navIcon}>🛡️</span>
              <span>Admin Panel</span>
            </NavLink>
          </>}
        </nav>

        <div style={s.footer}>
          <div style={s.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={s.userName}>{user?.name}</p>
            <p style={s.userRole}>{user?.role}</p>
          </div>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <div style={s.topbarLeft}>
            <button
              style={s.menuBtn}
              onClick={toggleSidebar}
              className="show-mobile"
            >
              ☰
            </button>
            <span style={{ fontSize:'15px', fontWeight:600, color:'var(--text)' }}>AI Resume Builder</span>
          </div>
          <div style={s.topbarRight}>
            <button
              style={s.iconBtn}
              onClick={toggleTheme}
              className="hide-mobile"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              style={s.iconBtn}
              onClick={toggleTheme}
              className="show-mobile"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              style={s.logoutBtn}
              onClick={handleLogout}
            >
              ↪
            </button>
          </div>
        </header>
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}