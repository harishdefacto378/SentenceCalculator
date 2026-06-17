import React from 'react';
import { fmtRupees, daysToYMD } from '../../utils/formatters';
import { Spec } from './Spec';

function notifLinkNode(url) {
  if (!url || url === "—" || url === "NA") return "NA";
  const fileName = decodeURIComponent(url.split("/").pop() || url);
  return <a href={url} target="_blank" rel="noopener noreferrer">📄 {fileName}</a>;
}

export function ReportCard({ substance, base, discretion, final, tab, setTab, onCopy }) {
  const sub = substance;
  const na  = "NA";
  return (
    <div className="card">
      <div className="report-head">
        <h2>Report</h2>
        <div className="report-tabs">
          <button className={"btn tab " + (tab === "sentence" ? "active" : "")} onClick={() => setTab("sentence")}>Copy with Sentence</button>
          <button className={"btn tab " + (tab === "basic"    ? "active" : "")} onClick={() => setTab("basic")}>Copy Basic</button>
          <button className={"btn tab " + (tab === "factors"  ? "active" : "")} onClick={() => setTab("factors")}>Copy With Sentence &amp; Factors</button>
          <button className="btn" onClick={onCopy}>Copy</button>
        </div>
      </div>
      <div className="report-body">
        <div className="report-section">
          <h3>Specified as Small &amp; Commercial in S.2(viia) &amp; 2(xxiiia) NDPS Act, 1985</h3>
          <Spec k="Notification Link" v={notifLinkNode(sub?.cr3e9_df_notificationlink)} />
          <Spec k="Notification No." v={sub?.cr3e9_df_notificationno_under_viia_xxiiia_of_s2 || na} />
          <Spec k="Dated" v={sub?.cr3e9_df_notificationdate_under_viia_xxiiia_of_s2 || "01-01-1970"} />
          <Spec k="SR. No." v={sub?.cr3e9_df_slno != null ? String(sub.cr3e9_df_slno) : na} />
          <Spec k="Common Name (Name of Narcotic Drug and Psychotropic Substance — International non-proprietary name (INN))" v={sub?.cr3e9_df_drugtype || na} />
          <Spec k="Other Non-proprietary Name" v={sub?.cr3e9_df_othername_defined_in_s2xxiii || na} />
          <Spec k="Chemical Name" v={sub?.cr3e9_df_chemicalname_defined_in_s2xxiii || na} />
          <Spec k="Small Quantity" v={sub ? `≤ ${sub.cr3e9_df_smallquantitygram} Gram` : "< 0 Gram"} />
          <Spec k="Commercial Quantity" v={sub ? `≥ ${sub.cr3e9_df_commercialquantitygram} Gram` : "> 0 Gram"} />
        </div>

        <div className="report-section">
          <h3>Declared as punishable under NDPS Act and as per schedule defined in S.2(viia) &amp; 2(xxiiia) NDPS Act, 1985</h3>
          <Spec k="Notification Link" v={notifLinkNode(sub?.cr3e9_df_notificationlink2)} />
          <Spec k="Notification No." v={sub?.cr3e9_df_notification_under_s2xxiii || na} />
          <Spec k="Dated" v={sub?.cr3e9_df_notificationdate_under_s2xxiii || "—"} />
          <Spec k="SR. No." v={sub?.cr3e9_df_ndpsact_srno != null ? String(sub.cr3e9_df_ndpsact_srno) : na} />
          <Spec k="Common Name (Name of Narcotic Drug and Psychotropic Substance — International non-proprietary name (INN))" v={sub?.cr3e9_df_drugtype || na} />
          <Spec k="Other Non-proprietary Name" v={sub?.cr3e9_df_otherpropname_under_s2viia_xxiiia || na} />
          <Spec k="Chemical Name" v={sub?.cr3e9_df_chemicalname_under_s2viia_xxiiia || na} />
          <div className="disclaimer-box">
            <span className="ic">⚠</span>
            <div className="body"><b>Disclaimer</b> You are advised to re-verify all details from the Gazette of India and official notifications.</div>
          </div>
        </div>

        <div className="report-section">
          <h3>Drug's Small &amp; Commercial Qty. suggested by Committee Report</h3>
          <Spec k="Notification No. &amp; Date" v={sub?.cr3e9_df_notificationreportanddate || na} />
          <Spec k="Notification Link" v={notifLinkNode(sub?.cr3e9_df_notificationcommitteereport)} />
          <Spec k="IUPAC — Weblink" v={sub?.cr3e9_df_iupaclink || "—"} />
          <Spec k="IUPAC Name" v={sub?.cr3e9_df_iupacname || na} />
        </div>

        {sub && tab !== "basic" && (
          <div className="report-section">
            <h3>Computed Sentence Summary</h3>
            <Spec k="Punishable Under Section" v={base.section} />
            <Spec k="Quantity Type" v={base.quantityType} />
            <Spec k="Base Sentence" v={base.sentenceInYearsMonthsDays} />
            <Spec k="Base Fine" v={base.fine} />
            <Spec k="After Discretion (Sentence)" v={daysToYMD(discretion.sentenceDays)} />
            <Spec k="After Discretion (Fine)" v={fmtRupees(discretion.fine)} />
            {tab === "factors" && (
              <>
                <Spec k="Final Sentence (with Factors)" v={daysToYMD(final.sentenceDays)} />
                <Spec k="Final Fine (with Factors)" v={fmtRupees(final.fine)} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
