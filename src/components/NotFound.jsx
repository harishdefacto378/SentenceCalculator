import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'var(--font-sans, sans-serif)' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>404 — Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        style={{ padding: '10px 24px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
      >
        Back to Home
      </button>
    </div>
  );
}
