import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg3)',flexDirection:'column',gap:'12px',textAlign:'center',padding:'20px' }}>
      <div style={{ fontSize:'60px' }}>404</div>
      <h2 style={{ fontSize:'20px',color:'var(--text)' }}>Page Not Found</h2>
      <p style={{ color:'var(--text3)',fontSize:'13px' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ padding:'9px 18px',background:'var(--primary)',color:'#fff',borderRadius:'8px',textDecoration:'none',fontSize:'13px',fontWeight:500 }}>← Go Home</Link>
    </div>
  );
}
