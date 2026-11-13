import React, { useState } from 'react';
import { Users, Calendar, DollarSign, Scale, Tag, Info, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * =========================================================================
 * AMICUS EXTRACTED ENTITY PANEL
 * =========================================================================
 * RATIONALE: Scannable entity cards using inline micro-badges for confidence
 * scores and clean quoted context blocks, avoiding visual clutter.
 * =========================================================================
 */
export const EntitySidebar = ({ entities = [], onSelectEntity, selectedEntityText }) => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const parties = entities.filter((e) => e.entity_type === 'PARTY');
  const dates = entities.filter((e) => e.entity_type === 'DATE');
  const monies = entities.filter((e) => e.entity_type === 'MONEY');
  const laws = entities.filter((e) => e.entity_type === 'GOVERNING_LAW');

  const sections = [
    { type: 'PARTY', title: 'Contracting Parties', icon: Users, items: parties },
    { type: 'DATE', title: 'Dates & Deadlines', icon: Calendar, items: dates },
    { type: 'MONEY', title: 'Financial Retainers & Fees', icon: DollarSign, items: monies },
    { type: 'GOVERNING_LAW', title: 'Governing Jurisdiction', icon: Scale, items: laws },
  ];

  const filteredSections = selectedFilter === 'ALL'
    ? sections
    : sections.filter(s => s.type === selectedFilter);

  return (
    <div className="flex flex-col h-full bg-surface p-4 space-y-4 overflow-y-auto">
      
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-2.5 py-1 rounded font-semibold transition-all whitespace-nowrap text-xs ${
            selectedFilter === 'ALL'
              ? 'bg-accent text-accent-fg shadow-subtle'
              : 'text-muted hover:text-heading hover:bg-subtle'
          }`}
        >
          All ({entities.length})
        </button>
        {sections.map((sec) => (
          <button
            key={sec.type}
            onClick={() => setSelectedFilter(sec.type)}
            className={`px-2 py-1 rounded font-semibold transition-all whitespace-nowrap text-[11px] ${
              selectedFilter === sec.type
                ? 'bg-accent text-accent-fg shadow-subtle'
                : 'text-muted hover:text-heading hover:bg-subtle'
            }`}
          >
            {sec.title.split(' ')[0]} ({sec.items.length})
          </button>
        ))}
      </div>

      {/* Entity Cards List */}
      {entities.length === 0 ? (
        <div className="p-6 rounded-xl bg-canvas border border-border text-center text-xs text-muted">
          <Info className="w-5 h-5 text-muted mx-auto mb-2" />
          No specific entity tokens extracted for this document.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSections.map((sec) => {
            if (sec.items.length === 0) return null;
            const IconComp = sec.icon;

            return (
              <div key={sec.title} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5 text-accent" />
                    <h4 className="text-xs font-bold text-heading">{sec.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-muted">
                    {sec.items.length} items
                  </span>
                </div>

                <div className="space-y-2">
                  {sec.items.map((item, idx) => {
                    const isSelected = selectedEntityText === item.text;

                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectEntity(item.text)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 shadow-subtle ${
                          isSelected
                            ? 'bg-accent-soft border-accent ring-1 ring-accent'
                            : 'bg-canvas border-border hover:border-border-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-heading truncate">
                            {item.text}
                          </span>
                        </div>

                        {item.context && (
                          <div className="p-2 rounded bg-surface border border-border/70 text-[11px] text-body italic leading-relaxed">
                            "{item.context.replace(/^\.\.\.|\.\.\.$/g, '').trim()}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
