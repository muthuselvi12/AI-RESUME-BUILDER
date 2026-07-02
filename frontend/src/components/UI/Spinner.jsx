import React from 'react';

export default function Spinner({ fullPage = false, size = 24 }) {
  const style = {
    width: size, height: size,
    border: '2.5px solid #e2e8f0',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  };

  if (fullPage) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div style={style} />
      </div>
    );
  }
  return <div style={style} />;
}
