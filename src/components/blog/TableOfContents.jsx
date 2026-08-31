import React, { useEffect, useState } from 'react';
import { ListTree, ChevronDown, ChevronUp, Hash } from 'lucide-react';

export const TableOfContents = ({ contentHtml }) => {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isExpanded, setIsExpanded] = useState(true); // Default open / expanded as requested

  useEffect(() => {
    if (!contentHtml) return;

    // Parse H2 and H3 from the content
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const elements = doc.querySelectorAll('h2, h3');
    
    const items = Array.from(elements).map((el, index) => {
      const text = el.textContent || '';
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}`;
      return {
        id,
        text,
        level: el.tagName.toLowerCase() === 'h2' ? 2 : 3
      };
    });

    setHeadings(items);

    // Add IDs to actual DOM headings after render
    setTimeout(() => {
      const liveHeadings = document.querySelectorAll('.editorial-prose h2, .editorial-prose h3');
      liveHeadings.forEach((el, index) => {
        if (items[index]) {
          el.id = items[index].id;
        }
      });
    }, 100);

  }, [contentHtml]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id) => {
    setActiveId(id);
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -90;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-[#111622] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-3">
      {/* Header with Title and Toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-neutral-100 dark:border-neutral-800"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
          <ListTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Table of Contents ({headings.length} Sections)</span>
        </div>
        <button 
          type="button" 
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md"
          aria-label={isExpanded ? 'Collapse Table of Contents' : 'Expand Table of Contents'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Full Expanded Navigation List - Full Text, Never Truncated */}
      {isExpanded && (
        <nav className="space-y-2 pt-1 animate-fadeIn">
          {headings.map((h, idx) => (
            <button
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              className={`w-full text-left flex items-start gap-2 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                h.level === 3 
                  ? 'pl-6 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400' 
                  : 'text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400'
              } ${activeId === h.id ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border-l-2 border-blue-600 pl-2' : ''}`}
            >
              <Hash className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-50 ${activeId === h.id ? 'text-blue-600 opacity-100' : ''}`} />
              <span className="break-words leading-relaxed flex-1">
                {h.text}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
