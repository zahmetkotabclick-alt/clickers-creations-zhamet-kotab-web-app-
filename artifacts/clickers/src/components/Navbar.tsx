import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, ShoppingCart, Globe, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export function Navbar() {
  const { t, isRTL, toggleLanguage } = useLanguage();
  const { profile, isAdmin, signOut } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const close = () => setShowUserMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const navLinks = [
    { href: '/', labelKey: 'home' as const },
    { href: '/store', labelKey: 'store' as const },
    { href: '/worlds', labelKey: 'worlds' as const },
    { href: '/authors', labelKey: 'authors' as const },
    { href: '/blog', labelKey: 'blog' as const },
    { href: '/media', labelKey: 'media' as const },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out ${
          isScrolled
            ? 'bg-background/90 backdrop-blur-2xl border-b border-border shadow-[0_2px_15px_-3px_rgba(139,29,61,0.07)]'
            : 'bg-transparent'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-24">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group"
                whileHover={{ scale: 1.01 }}
                data-testid="nav-logo"
              >
                <img 
                  src="/logo.png" 
                  alt="Zahmet Kotab Logo" 
                  className="h-12 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="flex flex-col">
                  <span className="font-arabic font-bold text-xl md:text-2xl leading-tight text-primary">
                    زحمة كتاب
                  </span>
                  <span className="text-xs md:text-[11px] uppercase tracking-[0.2em] font-cinematic text-accent opacity-70">
                    Dar Nashr
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <motion.span
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-300 cursor-pointer relative group ${
                      location === link.href
                        ? 'text-primary'
                        : isScrolled ? 'text-primary/60 hover:text-primary' : 'text-primary/70 hover:text-primary'
                    }`}
                    whileHover={{ y: -1 }}
                    data-testid={`nav-link-${link.labelKey}`}
                  >
                    {t.nav[link.labelKey]}
                    {location === link.href && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
                  </motion.span>
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Language Toggle */}
              <motion.button
                onClick={toggleLanguage}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-border shadow-sm transition-all duration-300 text-[12px] font-bold tracking-wider hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95"
                data-testid="language-toggle"
              >
                <Globe size={14} />
                <span className="hidden xl:block">{t.common.switchLanguage}</span>
              </motion.button>

              {/* Utility Icons */}
              <div className="flex items-center bg-card/50 rounded-full border border-border p-1">
                {/* Cart */}
                <motion.button
                  className="touch-target w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 text-primary/70 hover:text-primary hover:bg-primary/5 relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCart}
                  data-testid="cart-button"
                >
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-primary text-\[11px\] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-background"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </motion.button>
              </div>

              {/* Admin Quick Link */}
              {isAdmin && (
                <Link href="/admin">
                  <motion.button
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent text-primary font-black text-xs rounded-full shadow-[0_4px_12px_rgba(201,168,76,0.3)] hover:bg-primary hover:text-white transition-all ml-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LayoutDashboard size={14} />
                    {isRTL ? 'لوحة التحكم' : 'Admin'}
                  </motion.button>
                </Link>
              )}

              {/* Auth: User Menu or Sign In */}
              {profile ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-border hover:bg-primary/10 transition-all"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    whileTap={{ scale: 0.96 }}
                  >
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black">
                      {profile.email[0].toUpperCase()}
                    </div>
                    <span className="hidden md:block text-primary font-bold text-[12px] max-w-[100px] truncate">
                      {profile.full_name || profile.email.split('@')[0]}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        className={`absolute top-full mt-3 ${isRTL ? 'left-0' : 'right-0'} w-52 bg-white border border-border rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden z-50`}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 py-4 border-b border-border">
                          <p className="font-bold text-primary text-sm truncate">{profile.full_name || 'Reader'}</p>
                          <p className="text-primary/40 text-xs truncate">{profile.email}</p>
                        </div>
                        <div className="p-2">
                          <Link href="/my-orders">
                            <div
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary/70 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer font-bold text-sm"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <ShoppingCart size={15} />
                              <span>{isRTL ? 'طلباتي' : 'My Orders'}</span>
                            </div>
                          </Link>
                          {/* Removed admin link from dropdown since it is now prominently on the navbar */}
                          <button
                            onClick={() => { signOut(); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
                          >
                            <LogOut size={15} />
                            <span>{isRTL ? 'خروج' : 'Sign Out'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth">
                  <motion.span
                    className="hidden sm:block px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-[12px] font-bold tracking-wide cursor-pointer shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:bg-accent hover:text-primary transition-all duration-300"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid="nav-cta"
                  >
                    {t.nav.signUp}
                  </motion.span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-card border border-border text-primary shadow-sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-background/90 backdrop-blur-2xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 z-50 max-h-[85vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={link.href}>
                      <span
                        className={`touch-target w-full text-center px-5 py-3 rounded-2xl text-base font-bold transition-all duration-300 cursor-pointer ${
                          location === link.href
                            ? 'text-primary bg-primary/5'
                            : 'text-primary/60 hover:text-primary hover:bg-primary/5'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        data-testid={`mobile-nav-link-${link.labelKey}`}
                      >
                        {t.nav[link.labelKey]}
                      </span>
                    </Link>
                  </motion.div>
                ))}
                
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.05 }}
                  >
                    <Link href="/admin">
                      <span
                        className="touch-target w-full flex items-center justify-center gap-2 px-5 py-3 mt-2 rounded-2xl text-base font-bold transition-all duration-300 cursor-pointer bg-accent/10 border border-accent/20 text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LayoutDashboard size={18} />
                        {isRTL ? 'لوحة التحكم' : 'Admin Dashboard'}
                      </span>
                    </Link>
                  </motion.div>
                )}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <motion.button
                    onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }}
                    className="touch-target w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-border text-primary font-bold active:bg-primary/5 transition-colors"
                  >
                    <Globe size={18} />
                    {t.common.switchLanguage}
                  </motion.button>
                  {profile ? (
                      <button
                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                        className="touch-target w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-500 rounded-2xl font-bold active:bg-red-100 transition-colors"
                      >
                        <LogOut size={18} />
                        {isRTL ? 'خروج' : 'Sign Out'}
                      </button>
                  ) : (
                    <Link href="/auth">
                        <span
                          className="touch-target w-full text-center px-5 py-4 bg-primary text-primary-foreground rounded-2xl text-base font-bold cursor-pointer shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {t.nav.signUp}
                        </span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
