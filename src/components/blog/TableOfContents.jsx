import React, { useEffect, useState } from 'react';
import { ListTree, ChevronRight } from 'lucide-react';

export const TableOfContents = ({ contentHtml }) => {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!contentHtml) return;

    // Parse H2 and H3 from the content
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const elements = doc.querySelectorAll('h2, h3');
    
    const items = Array.from(elements).map((el, index) => {
      const text = el.textContent || '';
      const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}`;
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
    <div className="p-5 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <ListTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Table of Contents</span>
      </div>

      <nav className="space-y-1.5 text-xs">
        {headings.map(h => (
          <button
            key={h.id}
            onClick={() => scrollToHeading(h.id)}
            className={`w-full text-left flex items-start gap-1.5 py-1 px-2 rounded-lg transition-colors ${
              h.level === 3 ? 'pl-4 text-neutral-500 hover:text-neutral-900 dark:hover:text-white' : 'font-semibold text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400'
            } ${activeId === h.id ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''}`}
          >
            <ChevronRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activeId === h.id ? 'text-blue-600' : 'text-neutral-400'}`} />
            <span className="line-clamp-1">{h.text}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
