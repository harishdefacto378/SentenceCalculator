import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrl from '../../../assets/logo.png';
import YouTubePlayer from './YouTubePlayer';
import './AboutPage.css';

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="ab-page">
      <header className="header">
        <div className="header-inner">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <img className="seal" src={logoUrl} alt="Sentence Calculator" />
          <div className="header-title">
            <h1>Sentence Calculator</h1>
            <div className="actname">The Narcotic Drugs and Psychotropic Substances Act, 1985 (India)</div>
          </div>
          <button className="pill-warn"><span>⚠</span> Consider without Relying</button>
        </div>
      </header>

      <div className="ticker">
        Output is indicative across several factors, but must not be treated as decisive or replace the Court's independent reasoning.
        <span className="dot">●</span>
        Courts have not yet adopted this tool as a basis for determining a median-based sentence following a finding of guilt. Its use, if any, must therefore be the user's personal choice.
      </div>

      <div className="shell">
        <div className="card">

          <div className="msgbar" role="status">
            <span className="ic">✓</span>
            <div>This website has undergone <b>Vulnerability Assessment and Penetration Testing (VAPT)</b> as part of internal security compliance requirements.</div>
          </div>

          <h2 className="page-title">About calculator</h2>


         


          {/* User videos */}
          <section className="sec">
            <h3>User videos</h3>
            <div className="video-grid">
              <div className="video-card">
                <div className="video-lang">English</div>
                <YouTubePlayer
                  videoId="kLSAzAuhBps"
                  title="Sentence Calculator — English walkthrough"
                />
                <div className="video-caption">A complete tour — proportional, discretion, factors.</div>
              </div>
              <div className="video-card">
                <div className="video-lang">Hindi · हिन्दी</div>
                <YouTubePlayer
                  videoId="_nogx00NBUI"
                  title="Sentence Calculator — Hindi walkthrough · सम्पूर्ण मार्गदर्शिका"
                />
                <div className="video-caption">हिन्दी में पूरा डेमो।</div>
              </div>
              <div className="video-card">
                <div className="video-lang">Punjabi · ਪੰਜਾਬੀ</div>
                <YouTubePlayer
                  videoId="pglI1bHJYbs"
                  title="Sentence Calculator — Punjabi walkthrough · ਪੂਰਾ ਡੈਮੋ"
                />
                <div className="video-caption">ਪੰਜਾਬੀ ਵਿੱਚ ਕਦਮ-ਦਰ-ਕਦਮ ਜਾਣ-ਪਛਾਣ।</div>
              </div>
            </div>
          </section>


          {/* Support */}
          <section className="sec">
            <h3>Support</h3>
            <div className="support-grid">
              <div className="support-list">
                <div className="row"><span className="k">Available</span><span className="v">Monday — Friday</span></div>
                <div className="row">
                  <span className="k">Timing</span>
                  <span className="v">9:00 AM &nbsp;—&nbsp; 6:00 PM <span className="timezone-tag">IST</span></span>
                </div>
                <div className="row"><span className="k">Phone</span><span className="v"><a href="tel:+919648760019">+91&nbsp;9648&nbsp;760&nbsp;019</a></span></div>
                <div className="row"><span className="k">Email</span><span className="v"><a href="mailto:customer.support@defactoinfotech.com">customer.support@defactoinfotech.com</a></span></div>
                <div className="row"><span className="k">Feedback</span><span className="v"><a href="mailto:sentencecalculator.in@gmail.com">sentencecalculator.in@gmail.com</a></span></div>
                <div className="pill-set">
                  <a className="chip" href="#">About the calculator <span className="arr">→</span></a>
                  <a className="chip" href="#">Accuracy demonstrator <span className="arr">→</span></a>
                  <a className="chip" href="#">User manual (PDF) <span className="arr">↗</span></a>
                </div>
              </div>

              <div className="hours-card" aria-hidden="true">
                <div className="support-window-label">Weekly support window</div>
                <div className="day-row"><span className="day">MON</span><div className="bar"><i></i></div><span className="when">9 — 6</span></div>
                <div className="day-row"><span className="day">TUE</span><div className="bar"><i></i></div><span className="when">9 — 6</span></div>
                <div className="day-row"><span className="day">WED</span><div className="bar"><i></i></div><span className="when">9 — 6</span></div>
                <div className="day-row"><span className="day">THU</span><div className="bar"><i></i></div><span className="when">9 — 6</span></div>
                <div className="day-row"><span className="day">FRI</span><div className="bar"><i></i></div><span className="when">9 — 6</span></div>
                <div className="day-row off"><span className="day">SAT</span><div className="bar"></div><span className="when">closed</span></div>
                <div className="day-row off"><span className="day">SUN</span><div className="bar"></div><span className="when">closed</span></div>
              </div>
            </div>
          </section>

          {/* People */}
          <section className="sec">
            <h3>Conceived &amp; developed</h3>

            <div className="people-hero">
              <div className="avatar gold">AC</div>
              <div className="body">
                <div className="name">
                  Justice Anoop Chitkara
                  <a className="ic-link" href="#" aria-label="LinkedIn">in</a>
                  <a className="ic-link mail" href="#" aria-label="Email">@</a>
                </div>
                <div className="role">Conceived the calculator</div>
              </div>
            </div>

            <div className="people-hero people-hero--last">
              <div className="avatar">SA</div>
              <div className="body">
                <div className="name">
                  Sakshi Attri
                  <a className="ic-link mail" href="mailto:sakshiattri448@gmail.com" aria-label="Email">@</a>
                </div>
                <div className="role">Project lead · <a href="mailto:sakshiattri448@gmail.com">sakshiattri448@gmail.com</a></div>
              </div>
            </div>

            <div className="group-label">Research &amp; design team</div>
            <div className="roster-grid">
              <div className="roster-card"><div className="avatar small">NS</div><div><div className="name"><a href="#">Er. Navdeep Singh</a></div><div className="role">Engineering</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">AR</div><div><div className="name">Ashwani Ranaut</div><div className="role">Research</div></div></div>
              <div className="roster-card"><div className="avatar small">AS</div><div><div className="name"><a href="#">Ambika Sinha</a></div><div className="role">Research</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">SS</div><div><div className="name"><a href="#">Somya Sharma</a></div><div className="role">Research</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">SK</div><div><div className="name"><a href="#">Simranjeet Kaur</a></div><div className="role">Research</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">SC</div><div><div className="name"><a href="#">Sanjeeta Choudhary</a></div><div className="role">Research</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">SA</div><div><div className="name"><a href="#">Samrat Krishan Arora</a></div><div className="role">Research</div><div className="links"><a className="ic-link" href="#">in</a><a className="ic-link mail" href="#">@</a></div></div></div>
            </div>

            <div className="group-label">de facto infotech</div>
            <div className="ceo-row">
              <div className="avatar gold">SS</div>
              <div className="body">
                <div className="who">Er. Sukhvinder Singh <a className="ic-link" href="#" aria-label="LinkedIn">in</a></div>
                <div className="where">CEO · <b>de facto infotech</b> — and the engineering team</div>
              </div>
            </div>
            <div className="roster-grid">
              <div className="roster-card"><div className="avatar small">DK</div><div><div className="name"><a href="#">Diksha Kanwar</a></div><div className="role">Engineering</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">AV</div><div><div className="name"><a href="#">Abhishek Verma</a></div><div className="role">Engineering</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">GS</div><div><div className="name"><a href="#">Gurinder Singh</a></div><div className="role">Engineering</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">DS</div><div><div className="name"><a href="#">Diksha Suri</a></div><div className="role">QA</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
              <div className="roster-card"><div className="avatar small">HR</div><div><div className="name"><a href="#">Hemant Singh Rawat</a></div><div className="role">Engineering</div><div className="links"><a className="ic-link" href="#">in</a></div></div></div>
            </div>
          </section>

        </div>
      </div>

      <footer className="site">
        <div className="pip">Justice Anoop Chitkara <span className="copyright-sym">©</span></div>
        <div className="pip">Send feedback: <a href="mailto:sentencecalculator.in@gmail.com">sentencecalculator.in@gmail.com</a></div>
        <div className="pip"><a href="#">📊 Participate in Survey</a></div>
        <div className="pip">For any query: <a href="mailto:customer.support@defactoinfotech.com">customer.support@defactoinfotech.com</a></div>
        <div className="pip"><a href="#">Cookies</a></div>
      </footer>
    </div>
  );
}
