import React from 'react';

export function WarningModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, maxWidth: 480, width: "90%",
        boxShadow: "0 8px 32px rgba(91,44,142,0.22)",
        overflow: "hidden",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#5b2c8e 0%,#8146bf 100%)",
          padding: "16px 24px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 17 }}>Commercial Quantity Warning</span>
        </div>
        <div style={{ padding: "20px 24px", fontSize: 14, lineHeight: 1.6, color: "#333" }}>
          This calculator is designed only for small and intermediate quantities. In commercial quantities
          the minimum sentence that the courts can impose is imprisonment for <strong>10 years</strong> and
          fine of rupees <strong>1,00,000</strong>.
        </div>
        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg,#5b2c8e 0%,#8146bf 100%)",
              color: "#fff", border: "none", borderRadius: 6,
              padding: "8px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >OK</button>
        </div>
      </div>
    </div>
  );
}
