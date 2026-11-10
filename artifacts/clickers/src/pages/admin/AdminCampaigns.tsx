import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, StopCircle, Plus, Percent, Tag, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { AdminLayout, AdminPageHeader } from '@/components/admin/AdminLayout';
import { useCampaign } from '@/contexts/CampaignContext';
import { useToast } from '@/hooks/use-toast';

export function AdminCampaigns() {
  const { campaign, isActive, activateCampaign, deactivateCampaign, isLoading } = useCampaign();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [discountPercent, setDiscountPercent] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const pct = parseFloat(discountPercent);

    if (!trimmedName) {
      setError('يرجى إدخال اسم الفعالية الترويجية (Please enter an event name).');
      return;
    }

    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      setError('يرجى إدخال نسبة خصم صحيحة بين 1% و 99% (Discount must be between 1% and 99%).');
      return;
    }

    setIsSubmitting(true);
    try {
      await activateCampaign(trimmedName, pct);
      setName('');
      setDiscountPercent('60');
      toast({
        title: 'تم إطلاق الفعالية بنجاح! 🚀',
        description: `تم تفعيل خصم ${pct}% على جميع المنتجات وظهور فعالية "${trimmedName}" على الواجهة الرئيسية.`,
      });
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تفعيل الفعالية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await deactivateCampaign();
      toast({
        title: 'تم إنهاء الفعالية الترويجية',
        description: 'تم إيقاف الخصم التلقائي وإعادة الأسعار الأصلية وإزالة بانر الفعالية.',
      });
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إنهاء الفعالية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Promotional Events (الفعاليات الترويجية)"
        subtitle="إدارة الفعاليات والعروض الترويجية العامة للمتجر — تحكم في خصم الموقع بضغطة زر واحدة."
      />

      <div className="max-w-3xl space-y-8">
        <AnimatePresence mode="wait">
          {isActive && campaign ? (
            /* ── CURRENTLY ACTIVE CAMPAIGN CARD ── */
            <motion.div
              key="active-campaign"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-[#C89D35]/40"
              style={{
                background: 'linear-gradient(135deg, #8B1D3D 0%, #5E0E25 60%, #3A0515 100%)',
              }}
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C89D35]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-black uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>فعالية نشطة حالياً (Live Event)</span>
                  </div>

                  <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#C89D35] to-[#E6C362] text-[#2A0E17] font-black text-2xl shadow-lg font-arabic">
                    خصم {campaign.discountPercent}%
                  </div>
                </div>

                {/* Event Name */}
                <h2 className="text-3xl sm:text-4xl font-black text-white font-arabic mb-3 drop-shadow-sm flex items-center gap-3">
                  <Flame className="text-[#C89D35] w-9 h-9 flex-shrink-0 animate-pulse" />
                  <span>{campaign.name}</span>
                </h2>

                <p className="text-white/80 font-arabic text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
                  الخصم مطبق الآن بنجاح وبشكل تلقائي على جميع الكتب المعروضة في المتجر، وتظهر التجربة الترويجية التفاعلية على الصفحة الرئيسية.
                </p>

                {/* System Status Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#C89D35] text-xs font-bold mb-1">
                      <CheckCircle2 size={16} />
                      <span>جميع المنتجات</span>
                    </div>
                    <p className="text-white font-black text-sm">مشمولة بالخصم</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#C89D35] text-xs font-bold mb-1">
                      <CheckCircle2 size={16} />
                      <span>حماية الأسعار</span>
                    </div>
                    <p className="text-white font-black text-sm">الأسعار الأصلية محفوظة</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-[#C89D35] text-xs font-bold mb-1">
                      <CheckCircle2 size={16} />
                      <span>أمان الطلبات</span>
                    </div>
                    <p className="text-white font-black text-sm">تحقق موثوق بالخادم</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-400/40 rounded-2xl text-red-200 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* End Event Button */}
                <motion.button
                  onClick={handleDeactivate}
                  disabled={isSubmitting || isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4.5 bg-red-600/90 hover:bg-red-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-950/40 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <StopCircle size={20} />
                  <span>{isSubmitting ? 'جارٍ إنهاء الفعالية...' : 'إنهاء الفعالية فوراً (End Event Now)'}</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* ── CREATE NEW CAMPAIGN FORM ── */
            <motion.div
              key="create-campaign"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-border shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Zap size={28} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary font-arabic">إطلاق فعالية ترويجية جديدة</h2>
                  <p className="text-primary/50 text-sm font-bold mt-0.5">
                    أدخل اسم الفعالية ونسبة الخصم لتطبيقها فوراً على جميع كتب المتجر وظهور الفعالية بالصفحة الرئيسية.
                  </p>
                </div>
              </div>

              <form onSubmit={handleActivate} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-primary/70 uppercase tracking-wider mb-2 font-arabic">
                    اسم الفعالية الترويجية (Event Name)
                  </label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: وايت فرايداي — White Friday أو معرض الكتاب"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border border-border bg-[#FDFBF7] font-arabic font-bold text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-base"
                    />
                  </div>
                  <p className="text-xs text-primary/40 font-bold mt-1.5 font-arabic">
                    سيظهر هذا الاسم بوضوح في بانر الفعالية الرئيسية وأشرطة التخفيضات.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-primary/70 uppercase tracking-wider mb-2 font-arabic">
                    نسبة الخصم الشاملة (Discount Percentage %)
                  </label>
                  <div className="relative">
                    <Percent size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" />
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="60"
                      min="1"
                      max="99"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border border-border bg-[#FDFBF7] font-cinematic font-black text-primary placeholder:text-primary/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-lg"
                    />
                  </div>
                  <p className="text-xs text-primary/40 font-bold mt-1.5 font-arabic">
                    مثال: 60 يعني خصم 60% على جميع الكتب (يبقى سعر المنتجات المجانية 0 ج.م تلقائياً).
                  </p>
                </div>

                {/* Preset quick discount buttons */}
                <div>
                  <label className="block text-xs font-black text-primary/50 uppercase tracking-wider mb-2 font-arabic">
                    نسب خصم سريعة مقترحة:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['25', '30', '40', '50', '60', '70'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-4 py-2 rounded-xl text-xs font-black font-cinematic transition-all cursor-pointer ${
                          discountPercent === pct
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-primary/5 text-primary hover:bg-primary/10'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full flex items-center justify-center gap-3 py-4.5 bg-gradient-to-r from-[#8B1D3D] via-[#A81B34] to-[#8B1D3D] text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/35 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles size={20} className="text-[#C89D35]" />
                    <span>{isSubmitting ? 'جارٍ تفعيل الفعالية...' : 'تأكيد وتفعيل الفعالية الترويجية الآن'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}

