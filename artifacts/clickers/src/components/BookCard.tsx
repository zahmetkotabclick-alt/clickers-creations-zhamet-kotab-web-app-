import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Star, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

interface BookCardProps {
  book: Record<string, any>;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

export function BookCard({ book, variant = 'default', index = 0 }: BookCardProps) {
  const { t, isRTL, language } = useLanguage();
  const queryClient = useQueryClient();

  const handlePrefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['book', book.id],
      queryFn: async () => {
        const { data } = await supabase
          .from('books')
          .select('*, authors(*), worlds(*)')
          .eq('id', book.id)
          .single();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const title = language === 'ar' ? (book.title_ar || book.titleAr) : (book.title_en || book.titleEn);
  
  const authorData = Array.isArray(book.authors) ? book.authors[0] : book.authors;
  let authorName = authorData ? (language === 'ar' ? authorData.name_ar : authorData.name_en) : null;
  if (!authorName) {
    authorName = language === 'ar' ? book.authorNameAr : book.authorNameEn;
  }
  
  const discount = (book.original_price || book.originalPrice)
    ? Math.round((1 - book.price / (book.original_price || book.originalPrice)) * 100)
    : null;

  return (
    <motion.div
      className="group relative w-full"
      data-testid={`card-book-${book.id}`}
      onMouseEnter={handlePrefetch}
    >
      <Link href={`/book/${book.id}`}>
        <div className="cursor-pointer">
          {/* 3D Book Cover Container */}
          <div className="relative mb-3.5">
            <div className={`relative overflow-hidden rounded-2xl bg-[#F5EDDE] transition-all duration-500 shadow-[0_12px_28px_rgba(44,24,16,0.15)] group-hover:shadow-[0_22px_45px_rgba(139,29,61,0.28)] group-hover:-translate-y-2.5 group-hover:rotate-[0.8deg] ${
              variant === 'compact' ? 'aspect-[2/3] h-48' : 'aspect-[2/3]'
            }`}>
              {/* Cover Image */}
              <img
                src={book.cover_url || book.coverUrl || ''}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Realistic 3D Book Spine Effect */}
              <div 
                className={`absolute top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent z-10 ${
                  isRTL ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'
                }`} 
              />
              
              {/* Realistic Glossy Light Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

              {/* Top Badges (New / Discount) */}
              <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} z-20 flex flex-col gap-1.5`}>
                {(book.is_new || book.isNew) && (
                  <span className="px-2.5 py-1 bg-[#C89D35] text-[#2A0E17] text-[11px] font-black rounded-lg shadow-md tracking-wider">
                    {isRTL ? 'جديد' : 'NEW'}
                  </span>
                )}
                {discount && (
                  <span className="px-2.5 py-1 bg-[#8B1D3D] text-white text-[11px] font-black rounded-lg shadow-md">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Price Tag Pill on Top Corner */}
              <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-20`}>
                <div className="bg-[#8B1D3D]/95 backdrop-blur-md px-3 py-1 rounded-full border border-amber-300/30 shadow-md">
                  <span className="text-white font-black text-xs">
                    {book.price} <span className="text-[10px] font-bold opacity-80">{t.common.currency}</span>
                  </span>
                </div>
              </div>

              {/* Quick Preview Hover Overlay */}
              <div className="absolute inset-0 z-20 bg-black/35 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.div 
                  className="px-4 py-2 bg-[#8B1D3D] text-white rounded-full font-arabic font-extrabold text-xs shadow-2xl flex items-center gap-1.5 border border-amber-300/30"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye size={15} />
                  <span>{isRTL ? 'معاينة الكتاب' : 'Preview'}</span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Parchment Info Card */}
          <div className="bg-[#FFFDF9] rounded-2xl p-3.5 border border-amber-900/10 shadow-xs group-hover:border-[#C89D35]/40 transition-all duration-300">
            {/* Author Name */}
            {authorName && (
              <p className="text-[#5A453D] font-arabic font-bold text-xs line-clamp-1 mb-1">
                {authorName}
              </p>
            )}

            {/* Book Title */}
            <h3 className="font-arabic font-black text-[#8B1D3D] text-base leading-relaxed line-clamp-2 min-h-[2.8rem] flex items-center mb-2 group-hover:text-[#C89D35] transition-colors" dir={isRTL ? 'rtl' : 'ltr'}>
              {title}
            </h3>

            {/* Rating & Format Pill */}
            <div className={`flex items-center justify-between pt-2 border-t border-amber-900/5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-[#C89D35] text-[#C89D35]" />
                <span className="text-xs font-black text-[#5A453D]">{book.rating || '5.0'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#F5EDDE] text-[#5A453D] font-arabic font-bold text-[11px]">
                {book.format || (isRTL ? 'ورقي' : 'Paperback')}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
