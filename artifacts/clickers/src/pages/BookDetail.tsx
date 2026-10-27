import { useRoute, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { 
  Star, ShoppingCart, BookOpen, Play, Music, 
  ArrowLeft, ArrowRight, Tag, ShieldCheck, MessageCircle,
  BarChart3, X, Volume2, VolumeX, Share2
} from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useBook, useBooks, useBookRating, useRateBook, useBookReviews } from '@/services/supabase.hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHTML } from '@/lib/security';
import { SEO } from '@/components/SEO';
import { useDiscovery } from '@/hooks/useDiscovery';
import { normalizeArabicText } from '@/lib/textUtils';

// Extract YouTube ID Utility
function getYouTubeID(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function BookDetail() {
  const { t, isRTL, language } = useLanguage();
  const [, params] = useRoute('/book/:id');
  const bookId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: book, isLoading: bookLoading } = useBook(bookId);
  const { addItem, openCart } = useCart();
  const { data: recommendedData } = useBooks({ genre: book?.genre });
  const { data: rating } = useBookRating(bookId);
  const { data: reviews, isLoading: reviewsLoading } = useBookReviews(bookId);
  const rateBook = useRateBook();

  const [hoverRating, setHoverRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const { trackView } = useDiscovery();

  // Track the view automatically for "Recently Viewed" logic
  useEffect(() => {
    if (book) trackView(book);
  }, [book, trackView]);

  // Find the current user's review in the reviews list
  const userReview = useMemo(() => {
    if (!user || !reviews) return { rating: 0, comment: '' };
    const myReview = (reviews as any[]).find((r: { user_id: string }) => r.user_id === user.id);
    return myReview ? { rating: myReview.rating, comment: myReview.comment || '' } : { rating: 0, comment: '' };
  }, [user, reviews]);

  const userRating = userReview.rating;
  const [draftRating, setDraftRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (userRating > 0) setDraftRating(userRating);
    if (userReview.comment) setReviewComment(userReview.comment);
  }, [userRating, userReview.comment]);

  const youtubeId = useMemo(() => book?.trailer_url ? getYouTubeID(book.trailer_url) : null, [book?.trailer_url]);

  // Handle ESC key to close trailer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTrailer(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (bookLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#FDFBF7]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <h2 className="text-primary/40 text-xl mb-4 uppercase font-black tracking-wider">{t.common.notFound}</h2>
          <Link href="/store">
            <span className="text-accent cursor-pointer hover:underline font-bold uppercase tracking-wider text-xs">{t.common.backToHome}</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawTitle = language === 'ar' ? book.title_ar : book.title_en;
  const title = normalizeArabicText(rawTitle);
  const authorRecord = Array.isArray(book.authors) ? book.authors[0] : book.authors;
  const authorName = authorRecord ? (language === 'ar' ? authorRecord.name_ar : authorRecord.name_en) : 'Uncharted Pen';
  const description = language === 'ar' ? book.description_ar : book.description_en;
  const recommended = (recommendedData ?? []).filter((b: any) => b.id !== book.id).slice(0, 4);
  const discount = book.original_price ? Math.round((1 - book.price / book.original_price) * 100) : null;

  const handleSubmitReview = async () => {
    if (!user?.id) {
      toast({ title: language === 'ar' ? 'سجّل دخولك للتقييم' : 'Please login to rate', variant: 'destructive' });
      return;
    }
    if (draftRating === 0) {
      toast({ title: language === 'ar' ? 'الرجاء اختيار تقييم' : 'Please select a star rating', variant: 'destructive' });
      return;
    }
    setIsRating(true);
    try {
      await rateBook.mutateAsync({ 
        bookId: book.id, 
        rating: draftRating, 
        userId: user.id as string,
        comment: reviewComment.trim()
      });
      toast({ title: language === 'ar' ? 'تم تسجيل تقييمك بنجاح!' : 'Your review has been recorded!' });
    } catch (err: any) {
      console.error('[Rating Error]', err?.message || err);
      toast({ title: err?.message || 'Failed to save review', variant: 'destructive' });
    } finally {
      setIsRating(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = title || 'زحمة كتاب';
    const shareText = language === 'ar' ? `كتاب: ${shareTitle} - دار زحمة كتاب` : `Book: ${shareTitle} - Zahmet Kotab`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast({
        title: language === 'ar' ? 'تم نسخ رابط الكتاب! 📋' : 'Book link copied! 📋',
        description: language === 'ar' ? 'يمكنك الآن مشاركته مع أصدقائك.' : 'You can now paste and share it anywhere.',
      });
    } catch {
      toast({
        title: language === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!',
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-[#FDFBF7] pb-32">
      <AnimatePresence>
        {showTrailer && youtubeId && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button 
              onClick={() => setShowTrailer(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-[110]"
            >
              <X size={24} />
            </button>
            <motion.div 
              className="w-full max-w-6xl aspect-video rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title="Chronicle Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic SEO for this book */}
      <SEO
        title={language === 'ar' ? book.title_ar : book.title_en}
        description={language === 'ar'
          ? (book.description_ar?.slice(0, 160) || book.title_ar)
          : (book.description_en?.slice(0, 160) || book.title_en)}
        image={book.cover_url || undefined}
        type="book"
      />

      {/* Cinematic Hero */}
      <div className="relative overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0">
          <img src={book.cover_url || ''} alt="" className="w-full h-full object-cover opacity-5 blur-3xl scale-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-[#FDFBF7]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/store">
            <motion.button
              className={`inline-flex items-center gap-2 text-primary/40 hover:text-primary text-xs font-black uppercase tracking-[0.2em] transition-colors mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}
              whileHover={{ x: isRTL ? 3 : -3 }}
            >
              {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>{t.nav.store}</span>
            </motion.button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Cover Art */}
            <motion.div
              className="lg:col-span-5 flex justify-center"
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative group w-full max-w-sm sm:max-w-md">
                <div className="absolute inset-0 rounded-[2.5rem] bg-accent/20 blur-[100px] scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(139,29,61,0.45)] border-4 border-white bg-white">
                  <img
                    src={book.cover_url || ''}
                    alt={title}
                    className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {youtubeId && (
                    <button 
                      onClick={() => setShowTrailer(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]"
                    >
                      <div className="w-20 h-20 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white backdrop-blur-md scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                        <Play size={32} fill="white" className="ml-1" />
                      </div>
                      <span className="absolute bottom-10 text-xs font-black text-white uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100">
                        {isRTL ? 'شاهد الإعلان' : 'Watch Trailer'}
                      </span>
                    </button>
                  )}
                </div>
                {book.is_new && (
                  <div className={`absolute top-6 ${isRTL ? 'left-6 -rotate-3' : 'right-6 rotate-3'} px-4 py-1.5 bg-yellow-400 text-primary text-xs font-black rounded-2xl shadow-xl z-10`}>
                    {language === 'ar' ? 'إصدار جديد' : 'NEW RELEASE'}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Book Chronicles */}
            <motion.div
              className={`lg:col-span-7 min-w-0 max-w-full overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <span className="px-4 py-1.5 bg-primary/5 text-primary text-xs font-black uppercase tracking-wider rounded-full border border-primary/10">
                  {language === 'ar' ? book.genre_ar : book.genre}
                </span>
                {discount && (
                  <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-black rounded-full shadow-md">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Book Title */}
              <h1 
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-primary mb-5 leading-[1.25] tracking-tight break-words [overflow-wrap:break-word] [word-break:keep-all] ${
                  isRTL ? 'font-arabic text-right' : 'font-cinematic text-left'
                }`}
                style={{
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                }}
              >
                {title}
              </h1>

              {/* Author Info */}
              <div className="mb-6">
                <Link href={`/authors/${book.author_id}`}>
                  <span className={`text-xl md:text-2xl text-accent font-bold cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center gap-2.5 ${isRTL ? 'font-arabic flex-row-reverse' : ''}`}>
                    <ShieldCheck size={22} className="text-accent flex-shrink-0" />
                    <span>{authorName}</span>
                  </span>
                </Link>
              </div>

              {/* Price & Primary CTA Display */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 mb-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-primary drop-shadow-sm font-arabic">
                    {book.price} <span className="text-lg sm:text-xl text-primary/60 font-bold uppercase">{isRTL ? 'ج.م' : 'EGP'}</span>
                  </span>
                  {book.original_price && book.original_price > book.price && (
                    <span className="text-xl sm:text-2xl text-primary/30 line-through font-bold font-arabic">
                      {book.original_price} {isRTL ? 'ج.م' : 'EGP'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    onClick={() => {
                      addItem({
                        bookId: book.id,
                        title: title,
                        coverUrl: book.cover_url || '',
                        price: book.price,
                        quantity: 1,
                        format: book.format as 'digital' | 'physical' | 'both',
                      });
                      openCart();
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-primary/20 transition-all hover:bg-accent hover:text-primary active:scale-95 cursor-pointer"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <ShoppingCart size={18} />
                    <span>{isRTL ? 'أضف للسلة الآن' : 'Add to Cart'}</span>
                  </motion.button>

                  {youtubeId && (
                    <motion.button
                      onClick={() => setShowTrailer(true)}
                      className="inline-flex items-center gap-2.5 px-6 py-4 bg-white border-2 border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:bg-primary/5 hover:border-primary active:scale-95 cursor-pointer"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Play size={16} fill="currentColor" />
                      <span>{isRTL ? 'شاهد الإعلان' : 'Watch Trailer'}</span>
                    </motion.button>
                  )}

                  <motion.button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2.5 px-6 py-4 bg-white border-2 border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:bg-primary/5 hover:border-primary active:scale-95 cursor-pointer shadow-xs"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    title={isRTL ? 'مشاركة الكتاب' : 'Share Book'}
                  >
                    <Share2 size={16} />
                    <span>{isRTL ? 'مشاركة' : 'Share'}</span>
                  </motion.button>
                </div>
              </div>

              {/* Book Description */}
              <div 
                className={`text-base sm:text-lg md:text-xl text-primary/80 leading-[1.85] mb-10 max-w-2xl font-normal ${isRTL ? 'font-arabic text-right' : 'text-left'}`} 
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(description?.replace(/\n/g, '<br/>') || '') }} 
              />

              {/* Advanced Rating System */}
              <div className={`flex flex-col mb-10 p-6 sm:p-8 bg-white rounded-3xl border border-border shadow-xl shadow-primary/5 max-w-md ${isRTL ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <span className="text-\[11px\] font-black uppercase tracking-[0.3em] text-primary/20 mb-2 block">Archive Quality Index</span>
                       <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-5xl font-black text-primary">{(rating?.average || 0).toFixed(1)}</span>
                          <div className="flex flex-col">
                             <div className="flex items-center gap-0.5">
                               {[1, 2, 3, 4, 5].map((s) => (
                                 <Star key={s} size={12} fill={s <= Math.round(rating?.average || 0) ? 'currentColor' : 'none'} className={s <= Math.round(rating?.average || 0) ? 'text-yellow-400' : 'text-primary/10'} />
                               ))}
                             </div>
                             <span className="text-xs font-black text-primary/30 uppercase tracking-wider mt-1">{rating?.count || 0} Reader Reviews</span>
                          </div>
                       </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/20">
                       <BarChart3 size={24} />
                    </div>
                 </div>

                 {/* Distribution Bars */}
                 <div className="space-y-3 mb-8">
                    {[5, 4, 3, 2, 1].map(star => {
                       const count = rating?.distribution?.[star] || 0;
                       const percentage = rating?.count ? (count / rating.count) * 100 : 0;
                       return (
                         <div key={star} className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-black text-primary/40 w-4">{star}</span>
                            <div className="flex-1 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 transition={{ duration: 1, delay: star * 0.1 }}
                                 className="h-full bg-accent rounded-full" 
                               />
                            </div>
                            <span className="text-\[11px\] font-black text-primary/20 w-8">{Math.round(percentage)}%</span>
                         </div>
                       );
                    })}
                 </div>

                 <div className="pt-6 border-t border-primary/5">
                    <p className="text-\[11px\] font-black text-primary/40 uppercase tracking-wider mb-4 text-center">
                       {isRating ? (isRTL ? 'جاري الحفظ...' : 'Recording in Archive...') : (userRating > 0 ? (isRTL ? 'تعديل التقييم' : 'Edit Your Review') : (isRTL ? 'أضف تقييمك' : 'Write a Review'))}
                    </p>
                    <div className={`flex flex-col gap-4 ${isRating ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setDraftRating(star)}
                            className="transition-all hover:scale-125 active:scale-90 p-1 relative z-30"
                          >
                            <Star
                              size={28}
                              fill={star <= (hoverRating || draftRating || 0) ? 'currentColor' : 'none'}
                              className={`${star <= (hoverRating || draftRating || 0) ? 'text-yellow-400' : 'text-primary/20 hover:text-primary/40'} transition-colors duration-200 drop-shadow-sm`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={isRTL ? 'اكتب رأيك هنا (اختياري)...' : 'Write your thoughts here (optional)...'}
                        className={`w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:border-accent transition-colors resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                        rows={3}
                      />
                      <button
                        onClick={handleSubmitReview}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-accent hover:text-primary transition-all shadow-md active:scale-95"
                      >
                         {isRTL ? 'حفظ التقييم' : 'Submit Review'}
                      </button>
                    </div>
                 </div>
              </div>



              {/* Master Meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
                {[
                  { label: t.book.pages, value: `${book.pages} Pages` },
                  { label: t.book.format, value: book.format?.toUpperCase() || 'MULTI' },
                  { label: 'Era', value: book.published_date ? new Date(book.published_date).getFullYear() : 'Ancient' },
                  { label: t.book.language, value: book.language?.toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className={`bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-xs group hover:border-accent transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-primary/40 text-[11px] font-black uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-primary font-black text-xs sm:text-sm uppercase tracking-wider">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-12">
            
            {/* Live Review Stream */}
            <section>
              <div className={`flex items-baseline justify-between mb-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className={`text-4xl font-black text-primary uppercase tracking-wider ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
                   {isRTL ? 'تعليقات القراء' : 'Readers Comments'}
                </h2>
                <div className="flex items-center gap-2 text-primary/20 font-black uppercase text-xs tracking-wider">
                   <MessageCircle size={14} />
                   <span>{reviews?.length || 0} Entries</span>
                </div>
              </div>

              <div className="space-y-6">
                {reviewsLoading ? (
                   [1,2].map(i => <div key={i} className="h-32 bg-primary/5 animate-pulse rounded-3xl" />)
                ) : reviews && (reviews as any[]).length > 0 ? (
                  (reviews as any[]).map((review: any) => (
                    <motion.div 
                      key={review.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className={`p-10 rounded-[3rem] bg-white border border-border shadow-xl shadow-primary/5 relative ${isRTL ? 'text-right' : ''}`}
                    >
                      <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            {review.profiles?.avatar_url ? (
                               <img src={review.profiles.avatar_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                            ) : (
                               <span className="text-xl font-black text-primary uppercase">
                                  {review.profiles?.full_name?.charAt(0) || 'U'}
                               </span>
                            )}
                          </div>
                          <div>
                            <span className={`text-primary font-black text-base uppercase tracking-wider block mb-1`}>
                              {review.profiles?.full_name || 'Anonymous Reader'}
                            </span>
                            <p className="text-[11px] font-bold text-primary/50 uppercase tracking-[0.2em]">{isRTL ? 'قارئ موثوق' : 'Verified Proprietor'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-4 md:mt-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} fill={s <= review.rating ? 'currentColor' : 'none'} className={s <= review.rating ? 'text-yellow-400' : 'text-primary/10'} />
                          ))}
                        </div>
                      </div>
                      <p className={`text-2xl text-primary/90 font-bold leading-relaxed ${isRTL ? 'font-arabic' : 'font-sans'}`}>
                        "{review.comment || (isRTL ? 'ترك هذا القارئ تقييماً صامتاً، لكنه يعبر عن الكثير.' : 'The chronicle left this reader breathless, though no words were recorded.')}"
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-primary/5 rounded-[4rem] border-4 border-dashed border-primary/10">
                    <p className="text-primary/20 font-black uppercase tracking-wider">
                       {isRTL ? 'لا توجد تعليقات بعد. كن أول من يكتب تعليقاً!' : 'No comments yet. Be the first to leave a comment!'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Cinematic Recommendations */}
        {recommended.length > 0 && (
          <section className="mt-40">
            <div className={`flex items-baseline justify-between mb-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className={`text-4xl md:text-5xl font-black text-primary uppercase tracking-wider ${isRTL ? 'font-arabic' : 'font-cinematic'}`}>
                {t.book.recommendedBooks}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10">
              {recommended.map((b: any, i: number) => (
                <BookCard key={b.id} book={b} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
