import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Sparkles, Flame, ArrowLeft, ArrowRight, Tag, BookOpen, Star, Zap } from 'lucide-react';
import { useCampaign } from '@/contexts/CampaignContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useBooks } from '@/services/supabase.hooks';

export function PromotionalEventSection() {
  const { campaign, isActive, discountPercent, getPricing } = useCampaign();
  const { isRTL, language } = useLanguage();
  const { data: booksData } = useBooks({ status: 'published' });

  // Only render if a promotional campaign is active
  if (!isActive || !campaign) {
    return null;
  }

  // Curate top 4 books to highlight inside the event showcase
  const showcaseBooks = (booksData ?? []).slice(0, 4);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 my-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[2.8rem] overflow-hidden border-2 border-[#C89D35]/50 shadow-[0_30px_90px_rgba(139,29,61,0.28)]"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, #A81B34 0%, #7E1225 35%, #4A0B17 75%, #25040B 100%)',
        }}
      >
        {/* Animated Background Highlights & Ambient Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#C89D35]/25 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-500/20 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Subtle decorative geometric overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06] bg-repeat pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#C89D35 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Event Typography & Call to Action (Left/Right based on RTL) */}
            <div className={`lg:col-span-7 ${isRTL ? 'text-right' : 'text-left'}`}>
              
              {/* Event Live Badge */}
              <motion.div 
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-[#C89D35]/40 text-[#E6C362] font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg mb-6 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <motion.span 
                  animate={{ scale: [1, 1.3, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2.5 h-2.5 rounded-full bg-[#E6C362] shadow-[0_0_12px_#E6C362]"
                />
                <Sparkles size={16} className="text-[#E6C362]" />
                <span className="font-arabic font-black">
                  {isRTL ? 'فعالية ترويجية كبرى كبرى الآن' : 'MAJOR PROMOTIONAL EVENT'}
                </span>
              </motion.div>

              {/* Event Name Headline */}
              <h2 
                className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.08] tracking-tight mb-4 ${
                  isRTL ? 'font-arabic' : 'font-cinematic'
                }`}
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {campaign.name}
              </h2>

              {/* Discount Percentage Pill & Catchphrase */}
              <div className={`flex flex-wrap items-center gap-4 mb-6 ${isRTL ? 'justify-start' : 'justify-start'}`}>
                <div 
                  className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-2xl font-black text-2xl sm:text-3xl text-[#2A0E17] shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #FFDF79 0%, #C89D35 60%, #9A741E 100%)',
                    boxShadow: '0 8px 30px rgba(200,157,53,0.4)',
                  }}
                >
                  <Flame size={28} className="fill-[#7A1226] text-[#7A1226] animate-bounce" />
                  <span className="font-cinematic font-black tracking-tight">
                    {discountPercent}% OFF
                  </span>
                </div>

                <span className="text-white/90 font-arabic font-extrabold text-lg sm:text-xl drop-shadow-sm">
                  {isRTL ? 'خصم فوري على جميع الكتب' : 'Instant Site-Wide Discount'}
                </span>
              </div>

              {/* Subtitle / Description */}
              <p className={`text-white/80 font-arabic font-bold text-base sm:text-xl leading-relaxed mb-8 max-w-xl ${isRTL ? 'mr-0 ml-auto' : ''}`}>
                {isRTL
                  ? 'اغتنم الفرصة الآن لاقتناء أروع الروايات والكتب الأدبية من دار زحمة كتاب بأسعار استثنائية دون الحاجة لأي كود خصم.'
                  : 'Seize the moment to expand your library with extraordinary literary works at unprecedented prices. Discount applies automatically at checkout.'}
              </p>

              {/* Interactive CTA Button */}
              <div className={`flex flex-wrap items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Link href="/store">
                  <motion.div
                    className="inline-flex items-center gap-3.5 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-[#2A0E17] font-arabic font-black text-lg sm:text-xl cursor-pointer select-none shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #FFE89E 0%, #C89D35 50%, #B88B22 100%)',
                      boxShadow: '0 15px 40px rgba(200,157,53,0.45)',
                      border: '1.5px solid rgba(255,255,255,0.6)',
                    }}
                    whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(200,157,53,0.6)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span>{isRTL ? 'تسوق عروض الفعالية الآن' : 'Shop Event Collection'}</span>
                    <span className="w-8 h-8 rounded-full bg-[#2A0E17]/15 flex items-center justify-center text-[#2A0E17]">
                      {isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </span>
                  </motion.div>
                </Link>

                <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm font-arabic font-bold px-3 py-2">
                  <Zap size={16} className="text-[#C89D35]" />
                  <span>{isRTL ? 'تطبق التخفيضات تلقائياً في السلة' : 'Auto-applied at checkout'}</span>
                </div>
              </div>
            </div>

            {/* Showcase Visual: Event Books Grid Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl p-6 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-[#C89D35] font-arabic font-black text-sm flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{isRTL ? 'مختارات الفعالية' : 'Featured Deals'}</span>
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-[#C89D35]/20 text-[#E6C362] text-xs font-black">
                    -{discountPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {showcaseBooks.map((book) => {
                    const pricing = getPricing(book.price, book.original_price);
                    const title = language === 'ar' ? book.title_ar : book.title_en;
                    return (
                      <Link key={book.id} href={`/book/${book.id}`}>
                        <div className="group cursor-pointer bg-white/10 hover:bg-white/15 rounded-2xl p-2.5 transition-all duration-300 border border-white/5 hover:border-[#C89D35]/40 flex flex-col">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-md">
                            <img
                              src={book.cover_url || ''}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#8B1D3D] text-white font-black text-[10px] rounded-md shadow-md">
                              -{pricing.discountPercent || discountPercent}%
                            </div>
                          </div>
                          <p className="text-white font-arabic font-bold text-xs line-clamp-1 mb-1 group-hover:text-[#C89D35] transition-colors">
                            {title}
                          </p>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="text-[#FFDF79] font-black text-xs font-arabic">
                              {pricing.effectivePrice} {isRTL ? 'ج.م' : 'EGP'}
                            </span>
                            {pricing.originalPrice && (
                              <span className="text-white/40 line-through text-[10px] font-bold">
                                {pricing.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}

