import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { FaTwitter, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { useLanguage } from '@/i18n/LanguageContext';

export function Footer() {
  const { t, isRTL } = useLanguage();

  const platformLinks = [
    { href: '/store', label: t.nav.store },
    { href: '/worlds', label: t.nav.worlds },
    { href: '/authors', label: t.nav.authors },
    { href: '/blog', label: t.nav.blog },
    { href: '/media', label: t.nav.media },
  ];

  const companyLinks = [
    { href: '/about', label: isRTL ? 'من نحن' : 'About Us' },
    { href: '/contact', label: isRTL ? 'تواصل معنا' : 'Contact Us' },
    { href: '/faq', label: isRTL ? 'الأسئلة الشائعة' : 'FAQ' },
    { href: '/shipping', label: isRTL ? 'الشحن والإرجاع' : 'Shipping & Returns' },
  ];

  const legalLinks = [
    { href: '/privacy', label: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy' },
    { href: '/terms', label: isRTL ? 'شروط الخدمة' : 'Terms of Service' },
  ];

  return (
    <footer
      className="relative mt-24 border-t border-white/10 bg-primary text-primary-foreground"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, hsl(45 85% 52% / 0.1) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <Link href="/">
                <div className="flex items-center gap-4 mb-6 cursor-pointer w-fit group">
                  <div className="bg-card p-2 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src="/logo.png" 
                      alt="Zahmet Kotab Logo" 
                      className="h-12 md:h-16 w-auto object-contain" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-arabic font-black text-3xl leading-none text-white">
                      زحمة كتاب
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.25em] font-cinematic text-accent font-bold">
                      Dar Nashr
                    </span>
                  </div>
                </div>
              </Link>
              <p className={`text-white/60 text-sm leading-relaxed mb-8 max-w-[280px] ${isRTL ? 'font-arabic' : ''}`}>
                {t.footer.tagline}
              </p>
            </div>
            
            {/* Social Links */}
            <div className={`flex gap-4 ${isRTL ? 'justify-start' : 'justify-start'}`}>
              {[
                { icon: FaTwitter, href: '#', label: 'Twitter' },
                { icon: FaInstagram, href: '#', label: 'Instagram' },
                { icon: FaYoutube, href: '#', label: 'YouTube' },
                { icon: FaTiktok, href: '#', label: 'TikTok' },
              ].map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-accent hover:border-accent/40 hover:bg-white/10 transition-all duration-300"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={label}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-1">
            <h4 className={`text-white font-bold text-[11px] mb-8 uppercase tracking-[0.2em] ${isRTL ? 'font-arabic text-right' : 'font-cinematic'}`}>
              {t.footer.platform}
            </h4>
            <ul className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {platformLinks.map((link: { href: string; label: string }) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className={`text-white/60 hover:text-accent font-bold text-[13px] transition-colors duration-300 cursor-pointer ${isRTL ? 'font-arabic' : ''}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-1">
            <h4 className={`text-white font-bold text-[11px] mb-8 uppercase tracking-[0.2em] ${isRTL ? 'font-arabic text-right' : 'font-cinematic'}`}>
              {t.footer.company}
            </h4>
            <ul className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {companyLinks.map((link: { href: string; label: string }) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`text-white/60 hover:text-accent font-bold text-[13px] transition-colors duration-300 ${isRTL ? 'font-arabic' : ''}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-2">
             <h4 className={`text-white font-bold text-[11px] mb-8 uppercase tracking-[0.2em] ${isRTL ? 'font-arabic text-right' : 'font-cinematic'}`}>
              {t.footer.newsletter}
            </h4>
            <p className={`text-white/60 text-[13px] mb-6 leading-relaxed ${isRTL ? 'font-arabic text-right' : ''}`}>
              {t.footer.newsletterDesc}
            </p>
            <div className={`relative ${isRTL ? 'text-right' : 'text-left'}`}>
               <input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-all duration-300"
                  data-testid="newsletter-email"
                />
                <button
                  className={`absolute top-1.5 bottom-1.5 px-6 bg-accent text-primary rounded-xl text-xs font-bold transition-all hover:bg-white ${isRTL ? 'left-1.5' : 'right-1.5'}`}
                  data-testid="newsletter-subscribe"
                >
                  {t.footer.subscribe}
                </button>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`flex flex-col md:flex-row items-center gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider leading-none">
              {t.footer.copyright}
            </p>
            <div className="hidden md:block h-4 w-px bg-white/20" />
            <div className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-white/40 hover:text-accent text-[11px] font-bold uppercase tracking-wider transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
             <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
               <div className={`flex flex-col justify-center ${isRTL ? 'text-left' : 'text-right'}`}>
                  <span className="text-white/40 text-xs md:text-[11px] font-bold uppercase tracking-[0.2em] mb-1">
                     {isRTL ? 'شريك الابتكار التكنولوجي' : 'Technology & Innovation Partner'}
                  </span>
                  <span className="text-white/20 text-[8px] md:text-\[11px\] uppercase tracking-[0.1em]">
                     {isRTL ? 'تم التطوير والتصميم بواسطة' : 'Designed & Developed by'}
                  </span>
               </div>
               
               <div className="h-10 w-px bg-white/10 hidden md:block" />
               
               <a href="#" className={`flex items-center gap-4 group transition-all duration-500 scale-100 hover:scale-105 origin-right ${isRTL ? 'flex-row-reverse origin-left' : ''}`}>
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(45,136,255,0.1)] border border-white/10 group-hover:border-[#2d88ff]/40 transition-[border-color,box-shadow,transform] duration-500">
                     <img src="/clickers-logo.jpg" alt="Clickers Creations" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-[#2d88ff]/0 group-hover:bg-[#2d88ff]/10 transition-colors duration-500 Mix-blend-overlay" />
                  </div>
                  <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                    <span className="font-black text-white text-base md:text-lg uppercase tracking-[0.2em] group-hover:text-[#2d88ff] transition-colors duration-500 font-sans">
                       Clickers
                    </span>
                    <span className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] group-hover:text-white/60 transition-colors">
                       Creations
                    </span>
                  </div>
               </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
