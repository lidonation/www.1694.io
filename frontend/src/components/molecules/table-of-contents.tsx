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
    { id: 'governance-actions', label: 'Governance Actions' },
    { id: 'rationale', label: 'Rationale' },
    { id: 'changelog', label: 'Changelog' },
    { id: 'path-to-active', label: 'Path to Active' },
    { id: 'acknowledgments', label: 'Acknowledgments' },
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
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-3 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl max-w-[200px]">
      <div className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2 px-2">Contents</div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => handleClick(section.id)}
          className={`group flex items-center gap-3 text-left transition-all duration-300 ${
            activeId === section.id ? 'translate-x-1' : ''
          }`}
        >
          <div className={`h-1.5 rounded-full transition-all duration-300 ${
            activeId === section.id 
              ? 'w-6 bg-violet-600' 
              : 'w-1.5 bg-zinc-300 group-hover:w-3 group-hover:bg-violet-300'
          }`} />
          <span className={`text-xs font-medium transition-colors duration-300 ${
            activeId === section.id 
              ? 'text-violet-900' 
              : 'text-zinc-500 group-hover:text-violet-600'
          }`}>
            {section.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default TableOfContents;
