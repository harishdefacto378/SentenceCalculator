import React from 'react';

export default function InfoSection() {
  return (
    <div className="lp-info">
      <h3>Using the calculator</h3>
      <p>
        Select a notified substance from the drop-down, enter the seized quantity
        with the right unit, and pick the offence date. The base sentence and fine
        are computed proportionally across the small-quantity / intermediate /
        commercial bands defined under the NDPS Act, 1985.
      </p>
      <p>
        Use the <strong>Discretion</strong> sliders to express the Court's increase
        or decrease percentage, and tick the <strong>Aggravating</strong> and{' '}
        <strong>Mitigating</strong> factors that apply. The live{' '}
        <strong>Report</strong> tab summarises the inputs, the chemical and
        statutory specification, and the resulting sentence and fine.
      </p>
      <p>
        For comparing multiple hypotheticals — different substances, different
        quantities, or the same case under varying judicial discretion — open the{' '}
        <strong>Comparison</strong> page.
      </p>
    </div>
  );
}
