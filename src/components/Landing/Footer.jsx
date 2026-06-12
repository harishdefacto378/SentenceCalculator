import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="lp-footer">
      <span>Justice Anoop Chitkara <span className="copyright-sym">©</span></span>
      <span>
        Feedback:{' '}
        <a href="mailto:sentencecalculator.in@gmail.com">
          sentencecalculator.in@gmail.com
        </a>
      </span>
      <span>
        Support:{' '}
        <a href="mailto:customer.support@defactoinfotech.com">
          customer.support@defactoinfotech.com
        </a>
      </span>
    </footer>
  );
}
