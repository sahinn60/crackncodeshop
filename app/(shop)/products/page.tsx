'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard, Product } from '@/components/shop/ProductCard';
import { BundleCard, Bundle } from '@/components/shop/BundleCard';
import { Search, SlidersHorizontal, Mail, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/axios';

const ITEMS_PER_PAGE = 16;

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

interface Category { id: string; name: string; slug: string; children: Category[] }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
    if (cat === 'bundles') {
      setIsBundleMode(true);
      setSelectedCategory('');
    } else if (cat) {
      setIsBundleMode(false);
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isBundleMode) {
        const { data } = await apiClient.get('/bundles');
        console.log('[Products] Bundles from admin:', data?.length, data);
        const filtered = searchQuery
          ? data.filter((b: Bundle) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
          : data;
        setBundles(filtered);
        setProducts([]);
        setTotal(filtered.length);
        setTotalPages(1);
      } else {
        const { data } = await apiClient.get('/products', {
          params: { search: searchQuery, category: selectedCategory, page: currentPage, limit: ITEMS_PER_PAGE },
        });
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
  }, [searchQuery, selectedCategory, currentPage, isBundleMode]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategory = (cat: string) => {
    setIsBundleMode(false);
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleBundleMode = () => {
    setIsBundleMode(true);
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const hasResults = isBundleMode ? bundles.length > 0 : products.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-light text-dark font-light">
      <div className="container mx-auto px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-dark">{isBundleMode ? '📦 Bundle Offers' : 'All Products'}</h1>
            <p className="mt-1.5 sm:mt-2 text-base sm:text-lg text-gray-500 font-light">{isBundleMode ? 'Save more with our curated product bundles.' : 'Find the perfect digital asset for your next big project.'}</p>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mt-6 sm:mt-12">
          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="w-full lg:w-64 flex-shrink-0 space-y-4 sm:space-y-8">
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" placeholder={isBundleMode ? 'Search bundles...' : 'Search products...'} className="block w-full rounded-lg border-0 py-2.5 sm:py-3 pl-10 pr-3 text-dark ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 shadow-sm bg-white" value={searchQuery} onChange={handleSearch} />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-xs sm:text-sm font-semibold text-dark flex items-center gap-2 mb-3 sm:mb-4 uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4" /> Categories
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-1">
                <button onClick={() => handleCategory('All')} className={`text-left px-3 py-2 sm:py-2.5 rounded-lg text-sm transition-colors font-medium ${!isBundleMode && selectedCategory === 'All' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-dark'}`}>
                  All
                </button>
                <button onClick={handleBundleMode} className={`text-left px-3 py-2 sm:py-2.5 rounded-lg text-sm transition-colors font-medium flex items-center gap-1.5 ${isBundleMode ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-dark'}`}>
                  <Package className="h-3.5 w-3.5" /> Bundle Offers
                </button>
                {categories.map(cat => (
                  <div key={cat.id}>
                    <button onClick={() => handleCategory(cat.name)} className={`text-left px-3 py-2 sm:py-2.5 rounded-lg text-sm transition-colors font-medium w-full ${!isBundleMode && selectedCategory === cat.name ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-dark'}`}>
                      {cat.name}
                    </button>
                    {cat.children.map(sub => (
                      <button key={sub.id} onClick={() => handleCategory(sub.name)} className={`text-left px-3 py-1.5 pl-6 rounded-lg text-xs transition-colors w-full ${!isBundleMode && selectedCategory === sub.name ? 'bg-primary/10 text-primary font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-dark'}`}>
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : hasResults ? (
              <>
                <motion.div key={`${isBundleMode}-${currentPage}`} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-12">
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
                <h3 className="text-lg font-medium text-dark">{isBundleMode ? 'No bundles available' : 'No products found'}</h3>
                <p className="mt-2 text-sm text-gray-500">{isBundleMode ? 'Check back soon for bundle deals!' : 'Try adjusting your search or filters.'}</p>
                <Button variant="outline" className="mt-6 border-gray-300 text-gray-700" onClick={() => { setSearchQuery(''); setIsBundleMode(false); setSelectedCategory('All'); }}>
                  Clear all filters
                </Button>
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
            <p className="mt-4 text-lg text-gray-500 font-light">Get weekly updates on new resources, templates, and special offers.</p>
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
