import React, { useRef } from 'react';

/** Convert yyyy-mm-dd → M/dd/yyyy for display */
function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${month}/${String(day).padStart(2, '0')}/${year}`;
}

export function DatePicker({ value, onChange, max, placeholder = 'M/dd/yyyy' }) {
  const inputRef = useRef(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  }

  return (
    <div className="date-picker-wrap">
      <div
        className="date-picker-display"
        onClick={openPicker}
        tabIndex={0}
        role="button"
        aria-label={value ? formatDisplayDate(value) : placeholder}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } }}
      >
        <span className={value ? 'date-picker-value' : 'date-picker-placeholder'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <span className="date-picker-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </span>
      </div>
      <input
        ref={inputRef}
        type="date"
        className="date-picker-native"
        max={max}
        value={value}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
