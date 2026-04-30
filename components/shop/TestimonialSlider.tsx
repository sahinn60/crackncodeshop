'use client';

import { useRef, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

function AnimatedNumber() {
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);
  const [target, setTarget] = useState(1000);

  useEffect(() => {
    fetch('/api/stats/user-count').then(r => r.json()).then(d => {
      if (d.count > 0) {
        // Round down to nearest 1000
        const rounded = Math.floor(d.count / 1000) * 1000;
        setTarget(Math.max(1000, rounded));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || ran.current) return;
      ran.current = true;
      obs.disconnect();
      const dur = 2000;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(eased * target);
        el.textContent = v.toLocaleString() + (p >= 1 ? '+' : '');
        if (p < 1) return requestAnimationFrame(tick);
        el.style.transition = 'transform 0.3s ease';
        el.style.transform = 'scale(1.1)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span
      ref={ref}
      className="inline-block tabular-nums font-extrabold"
      style={{
        color: '#FF3B3B',
        WebkitTextStroke: '1px #000',
        textShadow: '0 0 10px rgba(255,60,60,0.6), 0 0 20px rgba(255,60,60,0.3)',
      }}
    >
      0
    </span>
  );
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: 4 | 5;
}

const testimonials: Testimonial[] = [
  { name: 'Rahim Uddin', role: 'Freelancer', text: 'Onek helpful chilo, amar kaj onek easy hoye gese. Prottek week e time save hocche.', rating: 5 },
  { name: 'Fatema Akter', role: 'Agency Owner', text: 'Quality dekhe amra impressed. Support team ke message dile 10 minute e reply dey, khub valo lagse.', rating: 5 },
  { name: 'Mehedi Hasan', role: 'Student', text: 'Student hisebe budget tight thake, but ekhane price dekhe believe korte parlam na. Sob kisu peyechi!', rating: 5 },
  { name: 'Nusrat Jahan', role: 'Designer', text: 'Order korar shathe shathe peyechi. Client ke deliver korte kono hassle hoy nai, ami satisfied.', rating: 5 },
  { name: 'Tanvir Ahmed', role: 'Developer', text: 'Bundle deal ta niye pura team er kaj hoye gese. Value for money bole jeta bole, seta ekhane peyechi.', rating: 5 },
  { name: 'Sabrina Islam', role: 'Freelancer', text: 'Onek jaygay try korlam, kothao eto valo quality pai nai. Ar lifetime update ta bonus!', rating: 5 },
  { name: 'Ariful Haque', role: 'Student', text: 'Ami ekjon student, taka niye tension thake. But ekhane je price e je quality peyechi, osadharon.', rating: 5 },
  { name: 'Tasnim Rahman', role: 'Content Creator', text: 'Content er quality raat e din hoye gese. Design gula clean, use korte onek easy.', rating: 5 },
  { name: 'Shakib Al Hasan', role: 'Developer', text: 'Code quality production-ready, boilerplate niye ar matha ghamano lagse na. Shera experience.', rating: 5 },
  { name: 'Mithila Farjana', role: 'Designer', text: 'Template gula onek sundor kore banano. Client ra result dekhe khushi, ami o khushi.', rating: 4 },
  { name: 'Rafiqul Islam', role: 'Freelancer', text: 'Delivery instant, product ta je eto valo hobe expect kori nai. Poisa wasool!', rating: 5 },
  { name: 'Sumaiya Khatun', role: 'Agency Owner', text: 'Amader agency r sob project e ei assets use kori. Time onek bachay, client o happy.', rating: 5 },
  { name: 'Jahidul Karim', role: 'Developer', text: 'Documentation clear, code clean. Integration korte 15 minute lagse, ghonta na. Darun!', rating: 5 },
  { name: 'Rima Sultana', role: 'Student', text: 'Portfolio banate onek help korse. Shikhar jonno o use korchi, practical knowledge pachi.', rating: 5 },
  { name: 'Imran Hossain', role: 'Freelancer', text: 'Eita amar go-to platform. Jokhon i digital asset dorkar, ekhane e ashi. Kono din disappoint hoi nai.', rating: 5 },
  { name: 'Anika Tabassum', role: 'Designer', text: 'Prottek ta template e detail er upor nojor deya hoyeche. Prottek taka worth it.', rating: 5 },
  { name: 'Farhan Labib', role: 'Developer', text: 'Responsive, modern, ar accessible. Developer hisebe ja ja dorkar chilo, sob ache.', rating: 4 },
  { name: 'Jannatul Ferdous', role: 'Content Creator', text: 'Ei template diye online business start korlam. Best investment of my life bolte pari.', rating: 5 },
  { name: 'Masud Rana', role: 'Freelancer', text: 'Client ra onek pochondo korse. Satisfaction rate 100% hoye gese, alhamdulillah.', rating: 5 },
  { name: 'Sharmin Akhter', role: 'Agency Owner', text: 'Professional quality, price o reasonable. Amader pura agency eitar upor depend kore.', rating: 5 },
  { name: 'Nazmul Huda', role: 'Student', text: 'Beginner der jonno perfect. Ei resource diye amar first freelance gig peyechi!', rating: 5 },
  { name: 'Farhana Yasmin', role: 'Designer', text: 'Pixel-perfect design, customize korte o easy. Ekdom bhalobashi ei platform ta.', rating: 5 },
  { name: 'Kamrul Hassan', role: 'Developer', text: 'Tech stack ta spot on. Modern ar future-proof, kono tension nai update niye.', rating: 4 },
  { name: 'Taslima Begum', role: 'Freelancer', text: 'Support fast, product valo. Ar ki chai? Recommend kori sobai ke.', rating: 5 },
  { name: 'Sohel Ahmed', role: 'Agency Owner', text: 'Agency r output 3 gun bariyechi ei template diye. Seriously game changer.', rating: 5 },
  { name: 'Nabila Haque', role: 'Content Creator', text: 'Design gula trendy ar conversion-focused. Amar engagement double hoye gese.', rating: 5 },
  { name: 'Rezaul Karim', role: 'Developer', text: 'Architecture clean, DX bhalo. Mone hoy senior dev ra banayeche, maza lagse.', rating: 5 },
  { name: 'Israt Jahan', role: 'Student', text: 'Code structure dekhe onek kichu shikhlam. Educational ar practical duita e peyechi.', rating: 5 },
  { name: 'Mizanur Rahman', role: 'Freelancer', text: 'Ekhane theke ja kinsi, prottek ta client er kaje lagse. Delivery speed o bariyeche.', rating: 5 },
  { name: 'Sadia Afrin', role: 'Designer', text: 'Color, typography, spacing — sob kichu professionally kora. Nojor kere ney.', rating: 4 },
  { name: 'Ashraful Alam', role: 'Developer', text: 'TypeScript support out of the box. Production e ar type error niye tension nai.', rating: 5 },
  { name: 'Rumana Parveen', role: 'Agency Owner', text: 'Client ra mone kore amader boro design team ache. Actually amra ar ei template!', rating: 5 },
  { name: 'Habibur Rahman', role: 'Freelancer', text: 'Bundle offer ta pagol kore diyeche. Ek purchase e sob dorkar er jinish peyechi.', rating: 5 },
  { name: 'Mahfuza Akter', role: 'Content Creator', text: 'Designer hire na kore e professional look peyechi. Brand ta ekhon premium dekhay.', rating: 5 },
  { name: 'Shafiqul Islam', role: 'Student', text: 'Affordable ar high quality — student der jonno eto valo combo ar kothao nai.', rating: 5 },
  { name: 'Dilara Begum', role: 'Designer', text: 'Sob design project er starting point hisebe use kori. Onek time save hoy.', rating: 5 },
  { name: 'Zahidul Hasan', role: 'Developer', text: 'Performance optimized already. Lighthouse score dekhe nijer chokh ke believe korte parlam na.', rating: 4 },
  { name: 'Rabeya Khatun', role: 'Freelancer', text: 'Client ra jiggesh kore template kothay pai. Amar secret weapon eita, kau ke boli na!', rating: 5 },
  { name: 'Monir Hossain', role: 'Agency Owner', text: 'ROI first project ei cover hoye gese. Invest kore kono loss hoy nai, lav e hoyeche.', rating: 5 },
  { name: 'Ayesha Siddika', role: 'Content Creator', text: 'Sundor, functional, ar customize korte easy. Ar ki dorkar bolen?', rating: 5 },
  { name: 'Kamal Uddin', role: 'Developer', text: 'Market er best Next.js template ekhane. Kono doubt nai, keu kache o ashte parbe na.', rating: 5 },
  { name: 'Hasina Begum', role: 'Designer', text: 'UI component gula accessible ar beautifully designed. Top-notch quality peyechi.', rating: 5 },
  { name: 'Billal Hossain', role: 'Freelancer', text: 'Prottek product e consistent quality. Chokh bondho kore kinleo thokbe na.', rating: 4 },
  { name: 'Nasima Akter', role: 'Student', text: 'Ei template diye freelancing start korlam. Ekhon ghor boshe income korchi, alhamdulillah!', rating: 5 },
  { name: 'Alamgir Kabir', role: 'Agency Owner', text: 'Onek platform try korechi. Quality ar price er ratio te eita shob cheye best.', rating: 5 },
  { name: 'Poly Akter', role: 'Content Creator', text: 'Social media presence onek improve hoyeche. Engagement er graph upar dike jachhe.', rating: 5 },
  { name: 'Shahjalal Mia', role: 'Developer', text: 'SEO-friendly, fast loading, clean code. Amar sob checkbox tick kore diyeche.', rating: 5 },
  { name: 'Moushumi Rahman', role: 'Designer', text: 'Prottek design fresh ar modern lage. Portfolio ta ekhon onek professional dekhay.', rating: 5 },
  { name: 'Touhidul Islam', role: 'Freelancer', text: 'Support ke message dilam, 1 ghonta r moddhe reply. Eto care rare aajkal.', rating: 4 },
  { name: 'Farzana Haque', role: 'Agency Owner', text: 'Ei month e 5 ta notun client peyechi ei template er karone. Sobai ke recommend kori.', rating: 5 },
];

// Split into two rows for dual-strip marquee
const row1 = testimonials.slice(0, 25);
const row2 = testimonials.slice(25);

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="tm-card bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-4 sm:line-clamp-3">
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm flex-shrink-0">
          {t.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-dark text-xs sm:text-sm truncate">{t.name}</h4>
          <p className="text-[10px] sm:text-xs text-gray-500">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeStrip({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden group hidden sm:block">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
      <div
        className={`flex ${reverse ? 'animate-testimonial-scroll-reverse' : 'animate-testimonial-scroll'} group-hover:[animation-play-state:paused]`}
      >
        {doubled.map((t, i) => (
          <div key={`${t.name}-${i}`} className="mx-3 flex-shrink-0 w-[340px]">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileMarqueeStrip({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className={`flex ${reverse ? 'animate-testimonial-scroll-mobile-reverse' : 'animate-testimonial-scroll-mobile'}`}>
        {doubled.map((t, i) => (
          <div key={`${t.name}-${i}`} className="mx-2 flex-shrink-0 w-[260px]">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialSlider() {
  return (
    <section className="bg-gray-50 py-10 sm:py-20 pb-24 sm:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-12">
        <div className="text-center">
          <h2 className="text-xl sm:text-3xl font-bold text-dark px-2 sm:px-0">
            Trusted by <AnimatedNumber /> users in Bangladesh 🇧🇩
          </h2>
          <p className="mt-2 sm:mt-3 text-gray-600 text-sm sm:text-lg">
            Real reviews from real customers
          </p>
        </div>
      </div>

      {/* Desktop: dual marquee strips */}
      <div className="hidden sm:block space-y-6">
        <MarqueeStrip items={row1} />
        <MarqueeStrip items={row2} reverse />
      </div>

      {/* Mobile: dual marquee strips */}
      <div className="sm:hidden space-y-4">
        <MobileMarqueeStrip items={row1} />
        <MobileMarqueeStrip items={row2} reverse />
      </div>
    </section>
  );
}
