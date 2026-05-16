"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <div
          key={faq.q}
          className="glass-panel rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="text-white font-bold text-sm">{faq.q}</span>
            <ChevronDown
              size={16}
              className={`text-brand-muted shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-brand-muted text-sm leading-relaxed border-t border-white/5 pt-3">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
