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

function HeroSection() {
  const { t, isRTL, language } = useLanguage();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const { data: featuredData } = useBooks({ status: undefined });
  const featuredBooks = (featuredData ?? []).slice(0, 5);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  useEffect(() => {
    if (featuredBooks.length === 0) return;
    const timer = setInterval(() => {
      setCurrentFeaturedIndex((i) => (i + 1) % featuredBooks.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featuredBooks.length]);

  const currentBook = featuredBooks.length > 0 ? featuredBooks[currentFeaturedIndex] : null;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#FDFBF7]"
      data-testid="hero-section"
    >
      {/* Cinematic Background Elements */}
      <motion.div className="absolute inset-0 z-0" style={{ opacity: opacityHero, scale, y }}>
        {/* Animated Light Blobs */}
        <motion.div
           animate={{ 
             x: [0, 100, 0], 
             y: [0, -50, 0],
             scale: [1, 1.2, 1]
           }}
           transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
           className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-accent/10 blur-[120px] rounded-full"
        />
        <motion.div
           animate={{ 
             x: [0, -100, 0], 
             y: [0, 50, 0],
             scale: [1, 1.3, 1]
           }}
           transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
           className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"
        />

        {/* Fine Grain Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30 mix-blend-multiply pointer-events-none" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent/30"
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%",
                opacity: Math.random() * 0.5
              }}
              animate={{
                y: [null, "-100vh"],
                opacity: [null, 0]
              }}
              transition={{
                duration: 10 + Math.random() * 20,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            />
          ))}
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${isRTL ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Emotional Content */}
          <motion.div
            className={isRTL ? 'order-2 text-right' : 'order-1 text-left'}
            initial={{ opacity: 0, x: isRTL ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center gap-3 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="h-px w-12 bg-accent/40" />
              <span className="text-accent text-xs font-bold uppercase tracking-[0.3em]">
                {isRTL ? 'بوابة نحو الخيال' : 'Gateway to Imagination'}
              </span>
            </motion.div>

            <motion.h1
              className={`text-6xl sm:text-7xl lg:text-8xl font-black leading-[1] mb-8 text-primary selection:bg-accent/30 ${
                isRTL ? 'font-arabic' : 'font-cinematic'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <span className="block">{isRTL ? 'خلف كل صفحة' : 'Beyond every'}</span>
              <span className="block text-accent">
                {isRTL ? 'عالم ينتظرك' : 'world awaits'}
              </span>
            </motion.h1>

            <motion.p
              className={`text-primary/60 text-xl md:text-2xl leading-relaxed mb-12 max-w-xl ${isRTL ? 'font-arabic ml-auto' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              {isRTL 
                ? 'نحن لا ننشر الكتب فحسب، نحن نبني جسوراً بين عوالمك وبين الحقيقة.' 
                : 'We don\'t just publish books; we build bridges between your reality and infinite worlds.'}
            </motion.p>

            <motion.div
              className={`flex flex-wrap items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              <Link href="/store">
                <motion.span
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg overflow-hidden transition-all shadow-2xl shadow-primary/20"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  <span className="relative group-hover:text-primary transition-colors duration-300">
                    {t.hero.cta}
                  </span>
                  <BookOpen size={20} className="relative group-hover:text-primary transition-colors duration-300" />
                </motion.span>
              </Link>
              
              <motion.button
                className="group flex items-center gap-4 text-primary font-bold text-lg hover:text-accent transition-colors px-4 py-2"
                whileHover={{ x: isRTL ? -5 : 5 }}
              >
                <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:border-accent transition-colors">
                  <Play size={18} fill="currentColor" />
                </div>
                <span>{t.hero.ctaSecondary}</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Immersive Book Display */}
          <motion.div
            className={`relative mt-16 lg:mt-0 ${isRTL ? 'order-1' : 'order-2'}`}
            initial={{ opacity: 0, scale: 0.8, rotateY: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentBook && (
              <div className="relative max-w-md mx-auto">
                <div className="absolute -inset-4 bg-accent/20 blur-[60px] rounded-full animate-pulse" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBook.id}
                    className="relative group perspective-2000"
                    initial={{ opacity: 0, rotateY: 30, x: 100 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    exit={{ opacity: 0, rotateY: -30, x: -100 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img
                      src={currentBook.cover_url || ''}
                      alt={language === 'ar' ? currentBook.title_ar : currentBook.title_en}
                      className="w-full aspect-[2/3] object-cover rounded-[3rem] shadow-[0_60px_100px_-20px_rgba(139,29,61,0.35)] ring-1 ring-white/50"
                    />
                    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </motion.div>
                </AnimatePresence>

                {/* Dynamic Book Info Tag */}
                <motion.div
                  key={`tag-${currentBook.id}`}
                  className={`absolute -bottom-6 ${isRTL ? '-right-6' : '-left-6'} bg-white/80 backdrop-blur-xl border border-white/50 p-6 rounded-[2rem] shadow-2xl max-w-[200px]`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-xs font-black uppercase tracking-wider text-accent mb-1 block">Featured</span>
                  <h4 className={`font-bold text-primary line-clamp-1 ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
                    {language === 'ar' ? currentBook.title_ar : currentBook.title_en}
                  </h4>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function QuoteSection() {
  const { isRTL } = useLanguage();
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 2 }}
        >
          <Sparkles className="mx-auto text-accent/40 mb-10" size={32} />
          <h2 className={`text-3xl md:text-5xl font-serif italic text-primary/80 leading-tight mb-8 ${isRTL ? 'font-arabic' : ''}`}>
            {isRTL 
              ? '“القصص لا تنتهي أبداً، إنها تنتظر فقط الشخص المناسب ليفتح الصفحة.”' 
              : '“Stories never truly end; they only wait for the right person to flip the page.”'}
          </h2>
          <div className="h-0.5 w-20 bg-accent/20 mx-auto" />
        </motion.div>
      </div>
    </section>
  );
}

function SectionHeading({ title, subtitle, viewAll }: { title: string; subtitle?: string; viewAll?: string }) {
  const { isRTL } = useLanguage();
  return (
    <div className={`mb-16 ${isRTL ? 'text-right' : 'text-left'}`}>
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={`text-4xl md:text-5xl font-bold text-primary mb-4 ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-primary/50 text-lg max-w-xl ${isRTL ? 'mr-0 ml-auto' : ''}`}>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
      <section className="bg-primary/2 py-32 relative">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pb-48">
        <motion.div
          className="relative rounded-[4rem] overflow-hidden bg-primary p-16 md:p-32 text-center shadow-[0_50px_100px_-30px_rgba(139,29,61,0.5)]"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1920&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/95 to-primary/80" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <Sparkles className="mx-auto text-accent mb-8" size={40} />
            <h2 className={`text-4xl md:text-7xl font-bold text-white mb-10 leading-tight ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
              {isRTL ? 'ابدأ حكايتك الخاصة الآن' : 'Your next great adventure begins here'}
            </h2>
            <div className={`flex flex-col sm:flex-row gap-6 justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <motion.button 
                className="px-12 py-6 bg-accent text-primary font-black rounded-3xl shadow-2xl hover:bg-white transition-all hover:scale-105 active:scale-95 leading-none"
                whileHover={{ scale: 1.05 }}
              >
                {t.nav.signUp}
              </motion.button>
              <motion.button 
                className="px-12 py-6 bg-white/10 border border-white/20 text-white font-black rounded-3xl backdrop-blur-xl hover:bg-white hover:text-primary transition-all leading-none"
                whileHover={{ scale: 1.05 }}
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
