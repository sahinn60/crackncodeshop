'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard, Product } from '@/components/shop/ProductCard';
import { BundleCard, Bundle } from '@/components/shop/BundleCard';
import { Search, Mail, ChevronLeft, ChevronRight, Package, SlidersHorizontal, X } from 'lucide-react';
import { CategorySidebar } from '@/components/shop/CategorySidebar';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/axios';

const ITEMS_PER_PAGE = 16;

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

interface Category { id: string; name: string; slug: string; children: Category[] }

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const maxPriceInitialized = useRef(false);
  const searchParams = useSearchParams();

  // Debounce search input — waits 400ms after user stops typing
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  // Read URL params on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (q) setSearchInput(q);
    if (cat === 'bundles') {
      setIsBundleMode(true);
      setSelectedCategory('');
    } else if (cat) {
      setIsBundleMode(false);
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Fetch products — only depends on debounced search, not raw input
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isBundleMode) {
        const { data } = await apiClient.get('/bundles');
        const filtered = debouncedSearch
          ? data.filter((b: Bundle) => b.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
          : data;
        setBundles(filtered);
        setProducts([]);
        setTotal(filtered.length);
        setTotalPages(1);
      } else {
        const params: Record<string, any> = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
        if (sortBy) params.sort = sortBy;
        // Send price range to let server handle it if max is set and user changed it
        if (maxPriceInitialized.current && priceRange[1] < maxPrice) {
          params.maxPrice = priceRange[1];
        }

        const { data } = await apiClient.get('/products', { params });

        // Use server-provided maxPrice (aggregated across ALL products, not just this page)
        if (!maxPriceInitialized.current && data.maxPrice > 0) {
          const mp = Math.ceil(data.maxPrice);
          setMaxPrice(mp);
          setPriceRange([0, mp]);
          maxPriceInitialized.current = true;
        }

        setProducts(data.products);
        setBundles([]);
        setTotal(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error('[Products] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  // priceRange excluded from deps — only triggered via explicit apply
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory, currentPage, isBundleMode, sortBy, priceRange[1], maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategory = (cat: string) => {
    setIsBundleMode(false);
    setSelectedCategory(cat);
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handleBundleMode = () => {
    setIsBundleMode(true);
    setSelectedCategory('');
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setSortBy('');
    setSelectedCategory('All');
    setIsBundleMode(false);
    setCurrentPage(1);
    if (maxPrice) setPriceRange([0, maxPrice]);
    setShowMobileFilters(false);
  };

  const hasActiveFilters = sortBy || searchInput || selectedCategory !== 'All' || isBundleMode || (maxPrice > 0 && priceRange[1] < maxPrice);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const hasResults = isBundleMode ? bundles.length > 0 : products.length > 0;

  // Count active filter badges
  const activeFilterCount = [
    sortBy,
    maxPrice > 0 && priceRange[1] < maxPrice,
    selectedCategory !== 'All' && !isBundleMode,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col min-h-screen bg-light text-dark">
      <div className="container mx-auto px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-dark">{isBundleMode ? '📦 Bundle Offers' : 'All Products'}</h1>
            <p className="mt-1.5 sm:mt-2 text-base sm:text-lg text-gray-600">{isBundleMode ? 'Save more with our curated product bundles.' : 'Browse tools that help you work smarter, not harder.'}</p>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mt-6 sm:mt-12">
          {/* Sidebar — desktop only */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="hidden lg:block w-64 flex-shrink-0 space-y-8">
            {/* Search */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={isBundleMode ? 'Search bundles...' : 'Search products...'}
                className="block w-full rounded-lg border-0 py-3 pl-10 pr-3 text-dark ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm leading-6 shadow-sm bg-white"
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setCurrentPage(1); }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setCurrentPage(1); }} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              isBundleMode={isBundleMode}
              onSelectCategory={handleCategory}
              onSelectBundle={handleBundleMode}
            />
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Mobile: Search + Filter toggle */}
            <div className="lg:hidden flex gap-2 mb-4">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={isBundleMode ? 'Search bundles...' : 'Search products...'}
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-9 text-dark ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm shadow-sm bg-white"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setCurrentPage(1); }}
                />
                {searchInput && (
                  <button onClick={() => { setSearchInput(''); setCurrentPage(1); }} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex-shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {showMobileFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowMobileFilters(false)}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                  />
                  <motion.div
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden flex flex-col shadow-2xl"
                  >
                    {/* Drawer header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-dark">Filters</h3>
                      <button onClick={() => setShowMobileFilters(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Drawer body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {/* Sort */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="">Newest First</option>
                          <option value="price-asc">Price: Low → High</option>
                          <option value="price-desc">Price: High → Low</option>
                          <option value="rating">Top Rated</option>
                        </select>
                      </div>

                      {/* Price range */}
                      {maxPrice > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range</label>
                          <input
                            type="range"
                            min={0}
                            max={maxPrice}
                            value={priceRange[1]}
                            onChange={e => { setPriceRange([0, Number(e.target.value)]); setCurrentPage(1); }}
                            className="w-full h-2 accent-primary cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>৳0</span>
                            <span className="font-semibold text-dark">৳{priceRange[1]}</span>
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      <CategorySidebar
                        categories={categories}
                        selectedCategory={selectedCategory}
                        isBundleMode={isBundleMode}
                        onSelectCategory={handleCategory}
                        onSelectBundle={handleBundleMode}
                      />
                    </div>

                    {/* Drawer footer */}
                    <div className="p-4 border-t border-gray-200 flex gap-3">
                      <Button variant="outline" onClick={resetAllFilters} className="flex-1 text-sm">
                        Reset All
                      </Button>
                      <Button onClick={() => setShowMobileFilters(false)} className="flex-1 bg-primary hover:bg-[#E62828] text-white text-sm">
                        Show Results ({total})
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Desktop Filter Bar */}
            {!isBundleMode && (
              <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6 bg-white border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filter:
                </div>
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Newest First</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                {maxPrice > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-gray-500">Price:</span>
                    <input
                      type="range"
                      min={0}
                      max={maxPrice}
                      value={priceRange[1]}
                      onChange={e => { setPriceRange([0, Number(e.target.value)]); setCurrentPage(1); }}
                      className="w-28 h-1.5 accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-700 tabular-nums">৳{priceRange[1]}</span>
                  </div>
                )}
                {/* Active filter tags */}
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    &quot;{debouncedSearch}&quot;
                    <button onClick={() => { setSearchInput(''); setCurrentPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    {selectedCategory}
                    <button onClick={() => { setSelectedCategory('All'); setCurrentPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-primary hover:underline font-medium ml-auto"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Results count */}
            {!isLoading && !isBundleMode && (
              <p className="text-xs text-gray-500 mb-3">
                {total} {total === 1 ? 'product' : 'products'} found
                {debouncedSearch && <> for &quot;<span className="font-medium text-dark">{debouncedSearch}</span>&quot;</>}
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : hasResults ? (
              <>
                <motion.div key={`${isBundleMode}-${currentPage}-${sortBy}`} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-12">
                  {isBundleMode
                    ? bundles.map(bundle => (
                        <motion.div key={bundle.id} variants={itemVariants} layout className="h-full">
                          <BundleCard bundle={bundle} />
                        </motion.div>
                      ))
                    : products.map(product => (
                        <motion.div key={product.id} variants={itemVariants} layout className="h-full">
                          <ProductCard product={product} />
                        </motion.div>
                      ))
                  }
                </motion.div>

                {!isBundleMode && totalPages > 1 && (
                  <div className="mt-auto pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-medium text-dark">{startIndex + 1}</span> to <span className="font-medium text-dark">{Math.min(startIndex + ITEMS_PER_PAGE, total)}</span> of <span className="font-medium text-dark">{total}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const page = idx + 1;
                          return (
                            <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} className={currentPage === page ? 'w-10 bg-primary hover:bg-[#E62828] text-white' : 'w-10 text-gray-600'} onClick={() => handlePageChange(page)}>
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium text-dark">{isBundleMode ? 'No bundles available' : '❌ No products found'}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {isBundleMode ? 'Check back soon for bundle deals!' : 'Try adjusting your search or filters.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-6 border-gray-300 text-gray-700" onClick={resetAllFilters}>
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10 sm:mt-20 border-t border-gray-200 bg-white py-10 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark lg:text-4xl">Subscribe to our newsletter</h2>
            <p className="mt-4 text-lg text-gray-600">Get weekly updates on new resources, templates, and special offers.</p>
            <form className="mt-6 sm:mt-8 flex flex-col sm:flex-row max-w-md mx-auto gap-3 sm:gap-x-4">
              <input name="email" type="email" required className="min-w-0 flex-auto rounded-lg border-0 px-3.5 py-2 text-dark shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white" placeholder="Enter your email" />
              <Button type="submit" className="flex-none bg-primary hover:bg-[#E62828] text-white">Subscribe</Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return <Suspense><ProductsContent /></Suspense>;
}
