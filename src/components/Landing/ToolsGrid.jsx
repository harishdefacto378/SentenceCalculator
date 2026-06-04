import React from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard, { THUMB_ICONS } from './ToolCard';

const TOOLS = [
  {
    thumbClass: 'lp-thumb-calc',
    svgIcon: THUMB_ICONS.calc,
    title: 'Calculator',
    description: 'Proportional sentence & fine based on substance, quantity, and date. Includes judicial discretion and aggravating / mitigating factors.',
    features: 'Substance picker · Qty + unit · Discretion ± % · Factor tables · Live report',
    openLabel: 'Open calculator',
    metaItems: ['📐 Section 21(c), 20(b)(ii), 17(c), 22(c)', '⚖ NDPS Act 1985'],
    target: 'calculator',
  },
  {
    thumbClass: 'lp-thumb-cmp',
    svgIcon: THUMB_ICONS.cmp,
    title: 'Comparison',
    description: 'Build up to six scenarios and compare them side-by-side. Sentence range, fine range, and a 0–20 year statutory spectrum.',
    features: 'Scenario chips · KPI strip · Table view · Chart view · Spectrum view',
    openLabel: 'Open comparison',
    metaItems: ['📊 3 views', '↕ Up to 6 scenarios'],
    target: 'comparison',
  },
  {
    thumbClass: 'lp-thumb-about',
    svgIcon: THUMB_ICONS.about,
    title: 'About',
    description: 'Team, methodology, instructional videos in English / Hindi / Punjabi, and contact for support and feedback.',
    features: 'Conceived by Justice Anoop Chitkara · de facto infotech · Research team',
    openLabel: 'Open about',
    metaItems: ['🎥 3 videos', '👥 Team & credits'],
    target: 'about',
  },
];

export default function ToolsGrid() {
  const navigate = useNavigate();
  return (
    <>
      <h2 className="lp-section-heading">Choose a tool</h2>
      <div className="lp-grid">
        {TOOLS.map(tool => (
          <ToolCard
            key={tool.target}
            thumbClass={tool.thumbClass}
            svgIcon={tool.svgIcon}
            title={tool.title}
            description={tool.description}
            features={tool.features}
            openLabel={tool.openLabel}
            isCalculator={tool.target === 'calculator'} 
            metaItems={tool.metaItems}
            onClick={() => navigate('/' + tool.target)}
          />
        ))}
      </div>
    </>
  );
}