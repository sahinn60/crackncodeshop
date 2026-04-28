'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  children: { id: string; name: string; slug: string }[];
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  isBundleMode: boolean;
  onSelectCategory: (name: string) => void;
  onSelectBundle: () => void;
}

export function CategorySidebar({ categories, selectedCategory, isBundleMode, onSelectCategory, onSelectBundle }: CategorySidebarProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Auto-expand parent if a subcategory is selected
  useEffect(() => {
    if (!selectedCategory || isBundleMode) return;
    for (const cat of categories) {
      if (cat.children.some(sub => sub.name === selectedCategory)) {
        setExpandedCat(cat.id);
        return;
      }
    }
  }, [selectedCategory, isBundleMode, categories]);

  const isActive = (name: string) => !isBundleMode && selectedCategory === name;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-fit shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Categories</h3>
      </div>

      {/* Category list */}
      <div className="py-1">
        {/* All */}
        <button
          onClick={() => onSelectCategory('All')}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm w-full transition-colors ${
            isActive('All') ? 'text-primary font-semibold bg-primary/5' : 'text-gray-800 hover:bg-primary/5 hover:text-primary'
          }`}
        >
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          All Products
        </button>

        {/* Bundle Offers */}
        <button
          onClick={onSelectBundle}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm w-full transition-colors ${
            isBundleMode ? 'text-primary font-semibold bg-primary/5' : 'text-gray-800 hover:bg-primary/5 hover:text-primary'
          }`}
        >
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          Bundle Offers
        </button>

        {categories.map(cat => (
          <div key={cat.id}>
            {/* Parent category row */}
            <div className="flex items-center">
              <button
                onClick={() => onSelectCategory(cat.name)}
                className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                  isActive(cat.name) ? 'text-primary font-semibold bg-primary/5' : 'text-gray-800 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt="" className="h-4 w-4 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className="h-4 w-4 rounded bg-gray-100 flex items-center justify-center text-[9px] font-medium text-gray-400 flex-shrink-0">{cat.name.charAt(0)}</span>
                )}
                {cat.name}
              </button>
              {cat.children.length > 0 && (
                <button
                  onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  className="px-3 py-2.5 text-gray-400 hover:text-primary transition-colors"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedCat === cat.id ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Subcategories accordion */}
            <AnimatePresence>
              {expandedCat === cat.id && cat.children.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-50/60 border-t border-gray-100">
                    {cat.children.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => onSelectCategory(sub.name)}
                        className={`flex items-center gap-2 pl-11 pr-4 py-2 text-xs w-full transition-colors ${
                          isActive(sub.name) ? 'text-primary font-semibold bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-gray-300 flex-shrink-0" />
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
