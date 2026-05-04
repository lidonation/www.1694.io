'use client';
import React, { useState, useEffect } from 'react';

const TableOfContents = () => {
  const [activeId, setActiveId] = useState<string>('');

  const sections = [
    { id: 'intro', label: 'Intro' },
    { id: 'lifecycle', label: 'Lifecycle' },
    { id: 'summary', label: 'Summary' },
    { id: 'motivation', label: 'Motivation' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'dreps', label: 'DReps' },
    { id: 'governance-actions', label: 'Gov Actions' },
    { id: 'rationale', label: 'Rationale' },
    { id: 'changelog', label: 'Changelog' },
    { id: 'path-to-active', label: 'Active Path' },
    { id: 'acknowledgments', label: 'Credits' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed right-2 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-end gap-3 p-2 bg-transparent border border-transparent rounded-2xl transition-all duration-300 group/nav hover:bg-white/95 hover:backdrop-blur-xl hover:border-violet-100 hover:shadow-2xl hover:p-4 hover:min-w-[140px]">
      <div className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-2 px-2 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300">
        Contents
      </div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleClick(section.id)}
          className="group flex items-center justify-end gap-3 text-right transition-all duration-300"
        >
          <span className={`text-[11px] font-bold transition-all duration-300 origin-right scale-0 opacity-0 group-hover/nav:scale-100 group-hover/nav:opacity-100 whitespace-nowrap ${
            activeId === section.id 
              ? 'text-violet-900' 
              : 'text-zinc-400 group-hover:text-violet-600'
          }`}>
            {section.label}
          </span>
          <div className={`h-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
            activeId === section.id 
              ? 'w-6 bg-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]' 
              : 'w-1.5 bg-zinc-300 group-hover:bg-violet-400'
          }`} />
        </button>
      ))}
    </nav>
  );
};

export default TableOfContents;
