import { create } from 'zustand';

export interface ElementStyle {
  bg?: string;
  color?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  shadow?: string;
  textAlign?: string;
  fontSize?: string;
  fontWeight?: string;
}

export interface BuilderElement {
  id: string;
  type: string;
  content: Record<string, any>;
  style: ElementStyle;
  animation: { type: string; delay: number; duration: number };
  isActive: boolean;
}

interface BuilderState {
  elements: BuilderElement[];
  selectedId: string | null;
  history: BuilderElement[][];
  historyIndex: number;
  viewport: 'desktop' | 'tablet' | 'mobile';
  isDragging: boolean;
  dragType: string | null;

  setElements: (els: BuilderElement[]) => void;
  select: (id: string | null) => void;
  setViewport: (v: 'desktop' | 'tablet' | 'mobile') => void;

  addElement: (type: string, index?: number) => void;
  updateElement: (id: string, patch: Partial<BuilderElement>) => void;
  updateContent: (id: string, content: Record<string, any>) => void;
  updateStyle: (id: string, style: Partial<ElementStyle>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (from: number, to: number) => void;
  toggleActive: (id: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  startDrag: (type: string) => void;
  endDrag: () => void;
}

const DEFAULTS: Record<string, () => Record<string, any>> = {
  heading:     () => ({ text: 'Your Headline Here', tag: 'h2' }),
  text:        () => ({ text: 'Write your content here. Click to edit.' }),
  button:      () => ({ text: 'Buy Now', link: '/checkout', variant: 'primary', size: 'lg' }),
  image:       () => ({ src: '', alt: '', width: '100%' }),
  video:       () => ({ youtubeUrl: '', autoplay: false }),
  spacer:      () => ({ height: '40' }),
  divider:     () => ({ color: '#e5e7eb', thickness: '1' }),
  hero:        () => ({ headline: 'Your Amazing Product', subheadline: 'The best solution for your needs', buttonText: 'Buy Now', buttonLink: '/checkout', images: [], overlay: true }),
  features:    () => ({ title: 'Why Choose Us', items: [{ icon: '⚡', title: 'Fast', description: 'Lightning fast delivery' }, { icon: '🛡️', title: 'Secure', description: '100% secure checkout' }, { icon: '💎', title: 'Premium', description: 'Top quality products' }] }),
  pricing:     () => ({ title: 'Special Offer', price: 0, oldPrice: 0, features: ['Instant delivery', 'Lifetime access', 'Free updates'], buttonText: 'Order Now', buttonLink: '/checkout', countdown: { enabled: true, isDaily: true, endTime: '' } }),
  testimonial: () => ({ name: 'Customer Name', text: 'This product is amazing!', rating: 5, avatar: '' }),
  reviews:     () => ({ title: 'What Our Customers Say', items: [] }),
  faq:         () => ({ title: 'Frequently Asked Questions', items: [{ question: 'How do I get my product?', answer: 'You will receive instant access after payment.' }] }),
  cta:         () => ({ headline: "Don't Miss Out!", subheadline: 'Limited time offer', buttonText: 'Get It Now', buttonLink: '/checkout', secondaryButtonText: '', secondaryButtonLink: '' }),
  countdown:   () => ({ isDaily: true, endTime: '', label: 'Offer ends in' }),
  productCard: () => ({ productId: '' }),
  gallery:     () => ({ images: [] }),
};

const DEFAULT_STYLE: ElementStyle = { bg: '', color: '', padding: '16', margin: '0', borderRadius: '0', shadow: 'none', textAlign: 'left', fontSize: '', fontWeight: '' };
const DEFAULT_ANIM = { type: 'fade', delay: 0, duration: 0.6 };

function pushHistory(state: BuilderState): Partial<BuilderState> {
  const past = state.history.slice(0, state.historyIndex + 1);
  past.push(JSON.parse(JSON.stringify(state.elements)));
  if (past.length > 50) past.shift();
  return { history: past, historyIndex: past.length - 1 };
}

export const useBuilderStore = create<BuilderState>()((set, get) => ({
  elements: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
  viewport: 'desktop',
  isDragging: false,
  dragType: null,

  setElements: (els) => set({ elements: els, history: [JSON.parse(JSON.stringify(els))], historyIndex: 0, selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setViewport: (v) => set({ viewport: v }),

  addElement: (type, index) => set(s => {
    const el: BuilderElement = {
      id: crypto.randomUUID(),
      type,
      content: (DEFAULTS[type] || (() => ({})))(),
      style: { ...DEFAULT_STYLE },
      animation: { ...DEFAULT_ANIM },
      isActive: true,
    };
    const arr = [...s.elements];
    if (index !== undefined) arr.splice(index, 0, el); else arr.push(el);
    return { elements: arr, selectedId: el.id, ...pushHistory({ ...s, elements: arr }) };
  }),

  updateElement: (id, patch) => set(s => {
    const elements = s.elements.map(e => e.id === id ? { ...e, ...patch } : e);
    return { elements, ...pushHistory({ ...s, elements }) };
  }),

  updateContent: (id, content) => set(s => {
    const elements = s.elements.map(e => e.id === id ? { ...e, content: { ...e.content, ...content } } : e);
    return { elements, ...pushHistory({ ...s, elements }) };
  }),

  updateStyle: (id, style) => set(s => {
    const elements = s.elements.map(e => e.id === id ? { ...e, style: { ...e.style, ...style } } : e);
    return { elements, ...pushHistory({ ...s, elements }) };
  }),

  removeElement: (id) => set(s => {
    const elements = s.elements.filter(e => e.id !== id);
    return { elements, selectedId: s.selectedId === id ? null : s.selectedId, ...pushHistory({ ...s, elements }) };
  }),

  duplicateElement: (id) => set(s => {
    const idx = s.elements.findIndex(e => e.id === id);
    if (idx === -1) return s;
    const clone: BuilderElement = JSON.parse(JSON.stringify(s.elements[idx]));
    clone.id = crypto.randomUUID();
    const arr = [...s.elements];
    arr.splice(idx + 1, 0, clone);
    return { elements: arr, selectedId: clone.id, ...pushHistory({ ...s, elements: arr }) };
  }),

  moveElement: (from, to) => set(s => {
    const arr = [...s.elements];
    const [el] = arr.splice(from, 1);
    arr.splice(to, 0, el);
    return { elements: arr, ...pushHistory({ ...s, elements: arr }) };
  }),

  toggleActive: (id) => set(s => {
    const elements = s.elements.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e);
    return { elements };
  }),

  undo: () => set(s => {
    if (s.historyIndex <= 0) return s;
    const i = s.historyIndex - 1;
    return { elements: JSON.parse(JSON.stringify(s.history[i])), historyIndex: i, selectedId: null };
  }),

  redo: () => set(s => {
    if (s.historyIndex >= s.history.length - 1) return s;
    const i = s.historyIndex + 1;
    return { elements: JSON.parse(JSON.stringify(s.history[i])), historyIndex: i, selectedId: null };
  }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  startDrag: (type) => set({ isDragging: true, dragType: type }),
  endDrag: () => set({ isDragging: false, dragType: null }),
}));
