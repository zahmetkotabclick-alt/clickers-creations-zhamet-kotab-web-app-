import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Play, ChevronLeft, ChevronRight, Sparkles, BookOpen, Globe } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { WorldCard } from '@/components/WorldCard';
import { AuthorCard } from '@/components/AuthorCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useLanguage } from '@/i18n/LanguageContext';
import { useBooks, useAuthors, useWorlds } from '@/services/supabase.hooks';
import { SEO } from '@/components/SEO';
import heroBg from '/hero-bg.png';

function HeroSection() {
  const { isRTL } = useLanguage();

  return (
    <section
      className="relative min-h-0 lg:min-h-screen flex flex-col lg:flex-row items-center bg-[#FDFBF7] lg:bg-transparent overflow-hidden"
      dir="ltr"
      data-testid="hero-section"
    >
      {/* Desktop-only full background image */}
      <div 
        className="hidden lg:block absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* MOBILE ONLY: Full-width edge-to-edge photo banner (fills entire width, no frame) */}
      <div className="lg:hidden w-full relative h-[52vh] min-h-[350px] max-h-[480px] overflow-hidden">
        <img
          src={heroBg}
          alt="Dar Zahmet Kotab Library"
          className="w-full h-full object-cover object-[82%_center]"
        />
        {/* Soft fade gradient linking photo to text section below */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/60 to-transparent pointer-events-none" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-10 lg:px-16 py-4 lg:py-32 flex flex-col justify-start">
        
        {/* Text Block — Placed AFTER the photo on mobile, placed on physical left on desktop */}
        <div className="w-full max-w-xl text-right bg-transparent p-2 sm:p-0" dir="rtl">
          
          {/* Decorative Sparkle icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-2 sm:mb-3 text-[#A81B34] flex items-center gap-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#A81B34] sm:w-7 sm:h-7">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 sm:mb-6 relative"
          >
            {/* "هنا تبدأ" */}
            <h1
              className="font-arabic font-black text-[#A81B34] leading-[1.05] tracking-tight"
              style={{
                fontSize: 'clamp(2.4rem, 7.5vw, 6.2rem)',
                textShadow: '0 2px 10px rgba(255,255,255,0.9)',
              }}
            >
              {isRTL ? 'هنا تبدأ' : 'Stories Begin'}
            </h1>

            {/* "الحكايات" */}
            <div className="relative inline-block mt-1">
              <span
                className="block font-arabic font-black text-[#C89D35] leading-[1.02]"
                style={{
                  fontSize: 'clamp(3.5rem, 9.5vw, 7rem)',
                  textShadow: '0 2px 12px rgba(255,255,255,0.9)',
                }}
              >
                {isRTL ? 'الحكايات' : 'Here'}
              </span>

              {/* Golden Swoosh under الحكايات */}
              <svg
                className="w-full h-8 text-[#C89D35] -mt-2"
                viewBox="0 0 300 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 20 C 80 38, 220 5, 290 22 C 220 18, 120 32, 10 20 Z"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="font-arabic font-black text-base sm:text-xl md:text-2xl text-[#2A1810] leading-relaxed mb-6 sm:mb-9 max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {isRTL
              ? 'مرحباً بك في دار نشر زحمة كتاب — حيث الإبداع الأدبي يتجسد في كتب وروايات تصحبك في عوالم قصصية استثنائية.'
              : 'Welcome to Dar Nashr Zahmet Kotab — where literary brilliance lives and stories become extraordinary worlds.'}
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            <Link href="/store">
              <motion.span
                className="inline-flex items-center justify-center gap-3.5 font-arabic font-black text-base sm:text-lg md:text-xl px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-white cursor-pointer select-none transition-all"
                style={{
                  background: 'linear-gradient(135deg, #A81B34 0%, #7E1225 100%)',
                  boxShadow: '0 12px 35px rgba(168,27,52,0.45)',
                  border: '1.5px solid rgba(255,225,140,0.4)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 16px 40px rgba(168,27,52,0.6)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{isRTL ? 'تصفح الكتب' : 'Browse Books'}</span>
                <span className="w-6.5 h-6.5 rounded-full bg-white/20 flex items-center justify-center text-white text-base font-bold">
                  ←
                </span>
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}



function QuoteSection() {
  const { isRTL } = useLanguage();
  return (
    <section className="max-w-5xl mx-auto px-4 py-16 my-8">
      <motion.div
        className="relative rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden border border-[#C89D35]/40 shadow-[0_15px_45px_rgba(139,29,61,0.08)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,253,249,0.98) 0%, rgba(247,242,232,0.95) 100%)',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center justify-center mb-6 text-[#C89D35]">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
        <h2 className={`text-3xl md:text-5xl font-black text-[#8B1D3D] leading-relaxed mb-6 ${isRTL ? 'font-arabic' : 'font-serif'}`}>
          {isRTL 
            ? '“القصص لا تنتهي أبداً، إنها تنتظر فقط الشخص المناسب ليفتح الصفحة.”' 
            : '“Stories never truly end; they only wait for the right person to flip the page.”'}
        </h2>
        <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-[#C89D35] to-transparent mx-auto rounded-full" />
      </motion.div>
    </section>
  );
}

function SectionHeading({ title, subtitle, viewAll }: { title: string; subtitle?: string; viewAll?: string }) {
  const { isRTL } = useLanguage();
  return (
    <div className={`mb-14 ${isRTL ? 'text-right' : 'text-left'}`}>
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className={`flex items-center gap-2 mb-2 text-[#C89D35] ${isRTL ? 'justify-start' : 'justify-start'}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
          <span className="text-sm font-arabic font-black tracking-widest text-[#C89D35] uppercase">
            {isRTL ? 'زحمة كتاب' : 'Zahmet Kotab'}
          </span>
        </div>
        <h2 className={`text-4xl md:text-6xl font-black text-[#8B1D3D] mb-3 tracking-tight ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
          {title}
        </h2>
        <div className="h-1.5 w-20 bg-gradient-to-r from-[#C89D35] to-transparent rounded-full mb-4" />
        {subtitle && (
          <p className={`text-[#4A352C] text-xl md:text-2xl font-arabic font-extrabold max-w-2xl ${isRTL ? 'mr-0 ml-auto' : ''}`}>
            {subtitle}
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function Homepage() {
  const { t, isRTL } = useLanguage();
  const { data: booksData } = useBooks({ status: undefined });
  const { data: authorsData } = useAuthors();
  const { data: worldsData } = useWorlds();

  // Pick some books for featured segment
  const featuredBooks = (booksData ?? []).slice(0, 5);
  const newBooks = (booksData ?? []).filter((b) => b.is_new);

  return (
    <div className="min-h-screen bg-background selection:bg-accent/30 selection:text-primary">
      <SEO
        title={isRTL ? 'بيت الكتب والروايات العربية' : 'Home — Arabic Books & Novels'}
        description={isRTL
          ? 'اكتشف أجمل الروايات والكتب العربية والإنجليزية في متجر زحمة كتاب. عوالم قصصية لا تُنسى تنتظرك.'
          : 'Discover the finest Arabic and English novels at Dar Zahmet Kotab. Immersive literary worlds await you.'}
        type="website"
      />
      <HeroSection />

      <QuoteSection />

      {/* Narrative Worlds */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeading 
          title={t.sections.exploreWorlds} 
          subtitle={isRTL 
            ? 'سلاسل متكاملة تصحبك في رحلة لا تنسى' 
            : 'Explore narrative universes designed for deep immersion.'}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(worldsData ?? []).slice(0, 3).map((world, i) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 1 }}
            >
              <WorldCard world={world as any} index={i} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-28 relative border-y border-[#C89D35]/15" style={{ background: 'linear-gradient(180deg, rgba(249,244,234,0.7) 0%, rgba(245,239,226,0.9) 50%, rgba(249,244,234,0.7) 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading 
            title={t.sections.featuredBooks} 
            subtitle={isRTL ? 'مختاراتنا لك هذا الشهر' : 'Our handpicked masterpieces for your library.'}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {featuredBooks.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
              >
                <BookCard book={book} index={i} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authors - The Architects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <SectionHeading 
          title={t.sections.authorSpotlight} 
          subtitle={isRTL ? 'تعرف على العقول المبدعة خلف حكايتنا' : 'Meet the brilliant architects of our stories.'}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(authorsData ?? []).slice(0, 3).map((author, i) => (
            <motion.div
              key={author.id}
              initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
            >
              <AuthorCard author={author as any} index={i} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emotional Final Chapter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pb-40">
        <motion.div
          className="relative rounded-[3.5rem] overflow-hidden p-12 md:p-24 text-center border-2 border-[#C89D35]/30 shadow-[0_30px_70px_rgba(139,29,61,0.35)]"
          style={{
            background: 'linear-gradient(135deg, #8B1D3D 0%, #6B1530 50%, #3D0B1B 100%)',
          }}
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1920&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6 text-[#C89D35]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <h2 className={`text-3xl md:text-6xl font-black text-white mb-8 leading-tight ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
              {isRTL ? 'ابدأ حكايتك الخاصة الآن' : 'Your next great adventure begins here'}
            </h2>
            <div className={`flex flex-col sm:flex-row gap-5 justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <motion.button 
                className="px-10 py-5 bg-gradient-to-r from-[#C89D35] to-[#E6C362] text-[#2A0E17] font-black rounded-full shadow-2xl transition-all leading-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.nav.signUp}
              </motion.button>
              <motion.button 
                className="px-10 py-5 bg-white/10 border border-white/25 text-white font-bold rounded-full backdrop-blur-md hover:bg-white hover:text-[#8B1D3D] transition-all leading-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.footer.contact}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
