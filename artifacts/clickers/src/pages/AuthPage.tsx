import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';

type Mode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { signIn, signUp, resetPassword } = useAuth();
  const { isRTL } = useLanguage();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : error);
      } else {
        navigate('/');
      }
    } else if (mode === 'register') {
      if (!fullName.trim()) {
        setError(isRTL ? 'يرجى إدخال اسمك الكامل' : 'Please enter your full name');
        setIsLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        navigate('/');
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
      } else {
        setSuccess(isRTL ? 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' : 'Password reset instructions have been sent to your email');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 py-32">
      {/* Background blobs */}
      <div className="fixed -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-3 cursor-pointer group">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                <span className="text-white font-cinematic font-bold text-2xl">ز</span>
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-arabic font-bold text-xl text-primary">زحمة كتاب</p>
                <p className="text-xs uppercase tracking-[0.25em] font-cinematic text-accent/70">Dar Nashr</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-border overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex border-b border-border">
            {(['login', 'register'] as Mode[]).filter(m => m !== 'forgot').map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                  mode === m
                    ? 'bg-primary text-white'
                    : 'bg-white text-primary/40 hover:text-primary'
                }`}
              >
                {m === 'login'
                  ? (isRTL ? 'تسجيل الدخول' : 'Sign In')
                  : (isRTL ? 'حساب جديد' : 'Register')}
              </button>
            ))}
          </div>

          <div className="p-10">
            <AnimatePresence mode="wait">
              <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">
                        {isRTL ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'}
                        required
                        className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary placeholder:text-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isRTL ? 'بريدك الإلكتروني' : 'your@email.com'}
                      required
                      className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary placeholder:text-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                  </div>

                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black uppercase tracking-wider text-primary/40">
                          {isRTL ? 'كلمة المرور' : 'Password'}
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                            className="text-xs font-black uppercase tracking-wider text-accent hover:text-primary transition-colors"
                          >
                            {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary placeholder:text-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 -translate-y-1/2 right-4 text-primary/30 hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-green-600 text-sm font-bold bg-green-50 px-4 py-3 rounded-xl border border-green-100 ${isRTL ? 'text-right font-arabic' : ''}`}
                    >
                      {success}
                    </motion.div>
                  )}

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-red-500 text-sm font-bold bg-red-50 px-4 py-3 rounded-xl ${isRTL ? 'text-right font-arabic' : ''}`}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-accent hover:text-primary transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>
                          {mode === 'login'
                            ? (isRTL ? 'دخول' : 'Sign In')
                            : mode === 'register'
                            ? (isRTL ? 'إنشاء الحساب' : 'Create Account')
                            : (isRTL ? 'إرسال رابط الاستعادة' : 'Send Reset Link')}
                        </span>
                        <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                      </>
                    )}
                  </motion.button>

                  {mode === 'forgot' && (
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                      className="w-full text-xs font-black uppercase tracking-wider text-primary/40 hover:text-primary transition-colors text-center"
                    >
                      {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                    </button>
                  )}
                </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
