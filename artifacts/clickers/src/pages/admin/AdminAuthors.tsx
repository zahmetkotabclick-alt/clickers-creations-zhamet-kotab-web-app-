import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, Search, Upload, Loader2, 
  Library, Check, X, Globe, Instagram, Twitter, 
  User as UserIcon, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { AdminLayout, AdminPageHeader } from '@/components/admin/AdminLayout';
import { 
  useAuthors, 
  useUpsertAuthor, 
  useUploadFile, 
  useBooks, 
  useAssignBooksToAuthor 
} from '@/services/supabase.hooks';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

function AuthorFormModal({ author, onClose }: { author?: any; onClose: () => void }) {
  const { isRTL, language } = useLanguage();
  const upsert = useUpsertAuthor();
  const assignBooks = useAssignBooksToAuthor();
  const { data: allBooks } = useBooks();
  const { upload, isUploading } = useUploadFile();
  const { toast } = useToast();

  const [form, setForm] = useState<any>({
    name_ar: '', name_en: '', bio_ar: '', bio_en: '',
    photo_url: '', nationality: '', instagram: '', twitter: '', website: '',
    ...(author ?? {}),
  });

  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [showBookSelector, setShowBookSelector] = useState(false);

  useEffect(() => {
    if (author && allBooks) {
      const currentBooks = allBooks.filter(b => b.author_id === author.id).map(b => b.id);
      setSelectedBookIds(currentBooks);
    }
  }, [author, allBooks]);

  const set = (k: string, v: unknown) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await upload(file);
      set('photo_url', url);
      toast({ title: 'Portrait uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  const toggleBook = (id: string) => {
    setSelectedBookIds(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Save Author
      const result: any = await upsert.mutateAsync(form);
      
      // 2. Assign Books
      if (result?.id) {
        await assignBooks.mutateAsync({
          authorId: result.id,
          bookIds: selectedBookIds
        });
      }
      
      toast({ title: author ? 'Author updated' : 'Author created' });
      onClose();
    } catch (err) {
      toast({ title: 'Error saving author', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="p-10 border-b border-border flex items-center justify-between bg-[#FDFBF7]">
          <div>
            <h2 className="text-3xl font-black text-primary font-cinematic uppercase tracking-wider">
              {author ? 'Refine Scribe' : 'Enshrine Author'}
            </h2>
            <p className="text-primary/40 font-bold text-xs uppercase tracking-[0.2em]">Literary Portrait & Bibliography</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl w-12 h-12">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Portrait Preview & Upload */}
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 rounded-[2.5rem] bg-primary/5 border border-border overflow-hidden relative group">
              {form.photo_url ? (
                <img src={form.photo_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/20">
                  <UserIcon size={32} />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-primary font-black uppercase tracking-wider text-xs mb-3">Writer's Portrait</p>
              <input 
                type="file" 
                id="author-photo" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <Button 
                type="button" 
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('author-photo')?.click()}
                className="rounded-2xl gap-3 font-black uppercase tracking-wider text-xs border-primary/10 hover:bg-primary hover:text-white transition-all py-6 px-6 h-auto"
              >
                <Upload size={16} />
                <span>Upload from Device</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1">Scribe Name (EN)</label>
              <input
                required
                value={form.name_en}
                onChange={(e) => set('name_en', e.target.value)}
                className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="e.g. Salah Nour"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-primary/40 block mr-1 text-right">اسم المبدع (AR)</label>
              <input
                required
                value={form.name_ar}
                onChange={(e) => set('name_ar', e.target.value)}
                className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary font-arabic text-right focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                placeholder="صلاح نور"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { icon: <Globe size={14}/>, label: 'Nationality', key: 'nationality' },
               { icon: <Twitter size={14}/>, label: 'Twitter', key: 'twitter' },
               { icon: <Instagram size={14}/>, label: 'Instagram', key: 'instagram' },
             ].map(field => (
                <div key={field.key} className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1 flex items-center gap-2">
                    {field.icon} {field.label}
                  </label>
                  <input
                    value={form[field.key] || ''}
                    onChange={(e) => set(field.key, e.target.value)}
                    className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-xs"
                  />
                </div>
             ))}
          </div>

          {/* Book Bibliography Section */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowBookSelector(!showBookSelector)}
              className="w-full p-6 rounded-[2rem] border-2 border-primary/10 hover:border-primary/30 transition-all flex items-center justify-between group bg-primary/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                  <Library size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-primary uppercase tracking-wider text-xs">Assign Bibliography</p>
                  <p className="text-primary/40 text-xs font-bold">
                    {selectedBookIds.length} works connected to this writer
                  </p>
                </div>
              </div>
              {showBookSelector ? <ChevronUp size={20} className="text-primary/30" /> : <ChevronDown size={20} className="text-primary/30" />}
            </button>

            <AnimatePresence>
              {showBookSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-[#FDFBF7] rounded-[2rem] border border-border">
                      {allBooks?.map((book: any) => (
                        <label 
                          key={book.id} 
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                            selectedBookIds.includes(book.id) 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white border-border hover:border-primary/30'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={selectedBookIds.includes(book.id)}
                            onChange={() => toggleBook(book.id)}
                          />
                          <div className="w-10 h-14 bg-border rounded-lg overflow-hidden flex-shrink-0">
                            {book.cover_url && <img src={book.cover_url} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs truncate ${selectedBookIds.includes(book.id) ? 'text-white' : 'text-primary'}`}>
                              {language === 'ar' ? book.title_ar : book.title_en}
                            </p>
                            <p className={`text-\[11px\] truncate ${selectedBookIds.includes(book.id) ? 'text-white/60' : 'text-primary/40'}`}>
                              {book.worlds ? (language === 'ar' ? book.worlds.name_ar : book.worlds.name_en) : 'Independent Story'}
                            </p>
                          </div>
                        </label>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1">Universal Bio</label>
            <textarea 
              value={form.bio_en} 
              onChange={(e) => set('bio_en', e.target.value)} 
              rows={4} 
              className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none" 
            />
          </div>

          <div className="space-y-3 text-right">
            <label className="text-xs font-black uppercase tracking-wider text-primary/40 block mr-1">السيرة الذاتية (AR)</label>
            <textarea 
              value={form.bio_ar} 
              onChange={(e) => set('bio_ar', e.target.value)} 
              rows={4} 
              dir="rtl" 
              className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary font-arabic focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none" 
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1 py-8 rounded-[2rem] font-bold uppercase tracking-wider border-primary/10">Cancel</Button>
            <Button type="submit" disabled={upsert.isPending} className="flex-[2] py-8 rounded-[2rem] text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/20">
              {upsert.isPending ? 'Committing...' : (author ? 'Update Portfolio' : 'Enshrine Writer')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminAuthors() {
  const { isRTL } = useLanguage();
  const { data: authors, isLoading } = useAuthors();
  const [editing, setEditing] = useState<any>(undefined);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const filtered = (authors ?? []).filter((a) =>
    a.name_ar.includes(search) || a.name_en.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this author? All their books will remain but will have no author linked.')) return;
    try {
      await supabase.from('authors').delete().eq('id', id);
      qc.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author archived successfully' });
    } catch (err) {
      toast({ title: 'Archiving failed', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title={isRTL ? 'إدارة المؤلفين' : 'Scribes & Architects'}
        subtitle={isRTL ? `${authors?.length ?? 0} مبدع مسجل` : `${authors?.length ?? 0} registered architects`}
        action={
          <Button
            onClick={() => setEditing(null)}
            className="rounded-2xl gap-3 font-black uppercase tracking-wider text-xs py-6 px-8 h-auto shadow-xl shadow-primary/20"
          >
            <Plus size={18} /> Add New Scribe
          </Button>
        }
      />

      <div className="relative mb-12 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" />
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder={isRTL ? 'ابحث عن مؤلف...' : 'Search architects...'} 
          className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[2rem] font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-[3rem] p-8 animate-pulse h-60 shadow-sm" />
            ))
          : filtered.map((author) => (
              <motion.div
                key={author.id}
                className="bg-white border border-border rounded-[3rem] p-8 group hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-6 mb-6">
                  {author.photo_url ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-white rotate-3 group-hover:rotate-0 transition-all duration-500">
                      <img src={author.photo_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary/40 font-black text-2xl">
                      {author.name_en[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-primary text-xl" dir={isRTL ? 'rtl' : 'ltr'}>{isRTL ? author.name_ar : author.name_en}</h3>
                    <p className="text-accent text-xs font-black uppercase tracking-wider">{author.nationality || 'Master Writer'}</p>
                  </div>
                </div>
                {author.bio_en && (
                  <p className="text-primary/40 text-sm line-clamp-2 mb-8 leading-relaxed italic">
                    "{isRTL ? author.bio_ar : author.bio_en}"
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setEditing(author)}
                    variant="outline"
                    className="flex-1 rounded-xl gap-2 font-black uppercase text-xs border-primary/10 hover:bg-primary shadow-sm h-10"
                  >
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(author.id)}
                    variant="outline"
                    className="rounded-xl border-red-50 text-red-300 hover:bg-red-400 hover:text-white transition-all h-10 w-10 px-0"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </motion.div>
            ))}
      </div>

      <AnimatePresence>
        {editing !== undefined && (
          <AuthorFormModal author={editing} onClose={() => setEditing(undefined)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
