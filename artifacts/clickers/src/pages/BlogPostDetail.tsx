import { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Calendar, User, Clock, ArrowLeft, ChevronRight, Share2, Facebook, Twitter, Link2, MessageCircle, Check } from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { useLanguage } from '@/i18n/LanguageContext';
import { useBlogPost } from '@/services/supabase.hooks';
import { Button } from '@/components/ui/button';
import { sanitizeHTML } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';

function fallbackCopyText(text: string) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  } catch (e) {
    console.error('Fallback copy failed', e);
  }
}

export function BlogPostDetail() {
  const [, params] = useRoute('/blog/:id');
  const { isRTL, language } = useLanguage();
  const { data: post, isLoading } = useBlogPost(params?.id);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async (platform?: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = (language === 'ar' ? post?.title_ar : post?.title_en) || 'زحمة كتاب';
    const shareText = (language === 'ar' ? post?.excerpt_ar : post?.excerpt_en) || shareTitle;

    if (platform === 'facebook') {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        '_blank',
        'noopener,noreferrer,width=600,height=500'
      );
      return;
    }

    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`,
        '_blank',
        'noopener,noreferrer,width=600,height=500'
      );
      return;
    }

    if (platform === 'whatsapp') {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + url)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    if (platform === 'copy') {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          fallbackCopyText(url);
        }
      } catch {
        fallbackCopyText(url);
      }
      setCopied(true);
      toast({
        title: isRTL ? 'تم نسخ الرابط بنجاح! 📋' : 'Link copied to clipboard! 📋',
        description: isRTL ? 'يمكنك الآن مشاركته في أي مكان.' : 'You can now paste and share it anywhere.',
      });
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    // Default: Native Share if available (mobile & modern browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // User cancelled
      }
    }

    // Fallback: Copy link and show toast
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopyText(url);
      }
    } catch {
      fallbackCopyText(url);
    }
    setCopied(true);
    toast({
      title: isRTL ? 'تم نسخ رابط المقال! 📋' : 'Article link copied! 📋',
      description: isRTL ? 'يمكنك الآن لصقه ومشاركته في أي مكان.' : 'You can now paste and share it anywhere.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center pt-32">
        <h2 className="text-3xl font-bold text-primary mb-4">Post not found</h2>
        <Link href="/blog">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  const title = language === 'ar' ? post.title_ar : post.title_en;
  const content = language === 'ar' ? post.content_ar : post.content_en;

  return (
    <div className="min-h-screen bg-[#FDFBF7] selection:bg-accent/30">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-accent z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Hero Header */}
      <header className="relative pt-32 md:pt-48 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-[#FDFBF7]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Link href="/blog">
              <button className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs hover:gap-4 transition-all group">
                {isRTL ? <ChevronRight size={14} /> : <ArrowLeft size={14} />}
                <span>{isRTL ? 'العودة للمدونة' : 'Editorial News'}</span>
              </button>
            </Link>
            <div className="h-px w-8 bg-accent/30" />
            <span className="text-primary/40 font-bold uppercase tracking-wider text-xs">{post.category}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-5xl md:text-7xl font-black text-primary leading-[1.1] mb-12 ${isRTL ? 'font-arabic text-right' : 'font-cinematic'}`}
          >
            {title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-10 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-accent overflow-hidden">
                {post.authors?.photo_url ? (
                  <img src={post.authors.photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-black text-primary text-lg">
                   {language === 'ar' ? post.authors?.name_ar : post.authors?.name_en}
                </p>
                <p className="text-primary/40 font-bold text-xs uppercase tracking-wider">Article Author</p>
              </div>
            </div>

            <div className="h-10 w-px bg-border hidden sm:block" />

            <div className={`flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar size={18} className="text-accent" />
                <span className="text-primary/60 font-bold text-sm">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </span>
              </div>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock size={16} className="text-accent" />
                <span className="text-primary/60 font-bold text-sm">{post.read_time} read</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Featured Image */}
      {post.image_url && (
        <section className="px-4 mb-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative aspect-[21/9] rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(139,29,61,0.2)]"
            >
              <img src={post.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
            </motion.div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-32 flex flex-col md:flex-row gap-16">
        {/* Social Share (Desktop Sidebar) */}
        <div className={`hidden md:flex flex-col gap-3.5 sticky top-32 h-fit ${isRTL ? 'items-end' : 'items-start'}`}>
          <button 
            type="button"
            title={isRTL ? 'مشاركة عبر فيسبوك' : 'Share on Facebook'}
            onClick={() => handleShare('facebook')}
            className="w-12 h-12 rounded-2xl border border-primary/10 bg-white text-primary flex items-center justify-center hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Facebook size={18} />
          </button>
          
          <button 
            type="button"
            title={isRTL ? 'مشاركة عبر X / تويتر' : 'Share on X'}
            onClick={() => handleShare('twitter')}
            className="w-12 h-12 rounded-2xl border border-primary/10 bg-white text-primary flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Twitter size={18} />
          </button>

          <button 
            type="button"
            title={isRTL ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
            onClick={() => handleShare('whatsapp')}
            className="w-12 h-12 rounded-2xl border border-primary/10 bg-white text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MessageCircle size={18} />
          </button>

          <button 
            type="button"
            title={isRTL ? 'نسخ رابط المقال' : 'Copy link'}
            onClick={() => handleShare('copy')}
            className={`w-12 h-12 rounded-2xl border transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
              copied 
                ? 'bg-green-600 text-white border-green-600' 
                : 'border-primary/10 bg-white text-primary hover:bg-accent hover:text-primary hover:border-accent'
            }`}
          >
            {copied ? <Check size={18} /> : <Link2 size={18} />}
          </button>

          <div className="h-16 w-px bg-border mx-auto my-2" />
          <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-widest text-primary/30 rotate-180 select-none">
            {isRTL ? 'مشاركة' : 'Share Story'}
          </span>
        </div>

        {/* Main Text Content */}
        <div className="flex-1 min-w-0">
          <div 
            className={`
              prose prose-stone prose-2xl max-w-none 
              prose-headings:text-primary prose-headings:font-cinematic prose-headings:font-black
              prose-p:text-primary/70 prose-p:leading-[1.8] prose-p:text-xl
              prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:not-italic
              prose-strong:text-primary prose-strong:font-black
              prose-img:rounded-[2rem] prose-img:shadow-2xl
              break-words overflow-wrap-anywhere hyphens-auto
              ${isRTL ? 'font-arabic text-right prose-p:text-2xl' : 'font-cinematic'}
              article-dropcap
            `}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content || '') }}
          />

          {/* Footer Tags/Credits & Share Bar */}
          <div className="mt-24 pt-12 border-t border-border flex flex-wrap items-center justify-between gap-6">
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-primary/40 font-bold uppercase tracking-wider text-xs">
                {isRTL ? 'التصنيف:' : 'Category:'}
              </span>
              <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-black uppercase tracking-wider">
                {post.category}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <Button 
                onClick={() => handleShare()}
                variant="outline" 
                className="rounded-2xl gap-2.5 font-bold border-primary/20 px-6 py-5 h-auto hover:bg-primary hover:text-white transition-all duration-300 shadow-sm cursor-pointer text-xs uppercase tracking-wider"
              >
                <Share2 size={16} />
                <span>{isRTL ? 'مشاركة المقال' : 'Share this insight'}</span>
              </Button>

              <button
                type="button"
                onClick={() => handleShare('whatsapp')}
                className="w-11 h-11 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title={isRTL ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
              >
                <MessageCircle size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="w-11 h-11 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title={isRTL ? 'مشاركة عبر فيسبوك' : 'Share on Facebook'}
              >
                <Facebook size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleShare('twitter')}
                className="w-11 h-11 rounded-2xl bg-black/5 text-black border border-black/10 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title={isRTL ? 'مشاركة عبر X / تويتر' : 'Share on X'}
              >
                <Twitter size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleShare('copy')}
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer ${
                  copied 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-white'
                }`}
                title={isRTL ? 'نسخ الرابط' : 'Copy link'}
              >
                {copied ? <Check size={18} /> : <Link2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* CSS Overrides for DropCap and enhanced spacing */}
      <style>{`
        .article-dropcap p:first-of-type::first-letter {
          float: ${isRTL ? 'right' : 'left'};
          font-size: 5rem;
          line-height: 1;
          margin-top: 0.15em;
          margin-${isRTL ? 'left' : 'right'}: 0.2em;
          color: var(--color-accent);
          font-weight: 900;
        }
        
        /* Ensure normal behavior for RTL Arabic dropcaps (often disabled or styled differently) */
        ${isRTL ? '.article-dropcap p:first-of-type::first-letter { font-size: 2.5rem; float: none; margin: 0; }' : ''}

        .prose p {
          margin-bottom: 2.5rem !important;
        }

        /* Prevent overflow for long strings */
        .break-words {
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
    </div>
  );
}
