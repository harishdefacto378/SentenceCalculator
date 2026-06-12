import React from 'react';

export function Spec({ k, v }) {
  const na = v === "NA" || v === "—" || v === "" || v == null;
  return (
    <div className="spec-row">
      <div className="k" dangerouslySetInnerHTML={{ __html: k }} />
      <div className={"v " + (na ? "na" : "")}>{na ? "NA" : v}</div>
    </div>
  );
}
