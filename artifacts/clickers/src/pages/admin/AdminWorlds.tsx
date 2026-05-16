import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Globe,  Book,
  Check, X, Palette, Image as ImageIcon, Star,
  Library, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  AdminLayout, 
  AdminPageHeader 
} from '@/components/admin/AdminLayout';
import { 
  useWorlds, 
  useUpsertWorld, 
  useDeleteWorld,
  useUploadFile,
  useBooks,
  useAssignBooksToWorld
} from '@/services/supabase.hooks';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export function AdminWorlds() {
  const { isRTL, language } = useLanguage();
  const { data: worlds, isLoading } = useWorlds();
  const { data: allBooks } = useBooks();
  const upsertWorld = useUpsertWorld();
  const deleteWorld = useDeleteWorld();
  const assignBooks = useAssignBooksToWorld();
  const { upload, isUploading } = useUploadFile();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorld, setEditingWorld] = useState<any>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    banner_url: '',
    color_primary: '#8B1D3D',
    is_featured: false,
  });

  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const handleOpenModal = (world: any = null) => {
    if (world) {
      setEditingWorld(world);
      setFormData({
        name_ar: world.name_ar,
        name_en: world.name_en,
        description_ar: world.description_ar || '',
        description_en: world.description_en || '',
        banner_url: world.banner_url || '',
        color_primary: world.color_primary || '#8B1D3D',
        is_featured: world.is_featured || false,
      });
      // Find books currently assigned to this world
      const currentBooks = allBooks?.filter(b => b.world_id === world.id).map(b => b.id) || [];
      setSelectedBookIds(currentBooks);
    } else {
      setEditingWorld(null);
      setFormData({
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        banner_url: '',
        color_primary: '#8B1D3D',
        is_featured: false,
      });
      setSelectedBookIds([]);
    }
    setShowBookSelector(false);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await upload(file);
      setFormData({ ...formData, banner_url: url });
      toast({ title: 'Image uploaded successfully' });
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
      // 1. Upsert the world
      const worldResult: any = await upsertWorld.mutateAsync({
        ...(editingWorld?.id ? { id: editingWorld.id } : {}),
        ...formData,
      });

      // 2. Assign books to this world
      if (worldResult?.id) {
        await assignBooks.mutateAsync({
          worldId: worldResult.id,
          bookIds: selectedBookIds,
        });
      }

      toast({ title: editingWorld ? 'World updated' : 'World created' });
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: 'Error saving world', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this world?')) {
      try {
        await deleteWorld.mutateAsync(id);
        toast({ title: 'World deleted' });
      } catch (err) {
        toast({ title: 'Error deleting world', variant: 'destructive' });
      }
    }
  };

  const filteredWorlds = worlds?.filter(w => 
    w.name_ar.includes(searchQuery) || w.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <AdminPageHeader 
        title={isRTL ? 'إدارة العوالم' : 'Manage Worlds'}
        subtitle={isRTL ? 'تحرير وإنشاء عوالم للكتب والمؤلفين' : 'Create and edit reading worlds'}
        action={
          <Button onClick={() => handleOpenModal()} className="rounded-2xl gap-2 font-bold px-6 py-6 h-auto">
            <Plus size={18} />
            <span>{isRTL ? 'إضافة عالم جديد' : 'Add New World'}</span>
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-8 flex items-center gap-4">
        <div className="relative flex-1 max-w-md gap-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
          <input 
            type="text"
            placeholder={isRTL ? 'ابحث عن عالم...' : 'Search worlds...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-bold text-primary"
          />
        </div>
      </div>

      {/* Worlds Grid/List */}
      <div className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-primary/5">
              <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-primary/40 truncate">Visual</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-primary/40">Name</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-primary/40">Featured</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-wider text-primary/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center text-primary/40 font-bold">Loading worlds...</td></tr>
            ) : filteredWorlds.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-primary/40 font-bold">No worlds found.</td></tr>
            ) : filteredWorlds.map((world: any) => (
              <motion.tr key={world.id} layout className="group hover:bg-primary/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="w-16 h-10 rounded-xl bg-border overflow-hidden relative shadow-sm">
                    {world.banner_url ? (
                      <img src={world.banner_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/20" style={{ backgroundColor: world.color_primary }}>
                        <Globe size={14} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="font-bold text-primary">{world.name_en}</p>
                  <p className="text-primary/40 font-arabic text-sm">{world.name_ar}</p>
                </td>
                <td className="px-8 py-6">
                  {world.is_featured ? (
                    <span className="flex items-center gap-1.5 text-accent font-black text-xs uppercase tracking-wider">
                      <Star size={12} fill="currentColor" />
                      Featured
                    </span>
                  ) : (
                    <span className="text-primary/20 font-black text-xs uppercase tracking-wider">Standard</span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleOpenModal(world)}
                      className="w-10 h-10 rounded-xl border-primary/10 hover:bg-primary hover:text-white transition-all"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(world.id)}
                      className="w-10 h-10 rounded-xl border-red-100 text-red-400 hover:bg-red-400 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm" 
            />
            <motion.div
              layoutId="modal"
              className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-border flex items-center justify-between bg-[#FDFBF7]">
                <div>
                  <h3 className="text-2xl font-black text-primary font-cinematic uppercase">
                    {editingWorld ? 'World Architect' : 'Cosmic Birth'}
                  </h3>
                  <p className="text-primary/40 font-bold text-xs uppercase tracking-[0.2em]">Universe Definition & Books Binding</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-2xl w-12 h-12">
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-auto custom-scrollbar">
                {formData.banner_url && (
                  <div className="w-full h-48 rounded-[2rem] overflow-hidden relative group">
                    <img src={formData.banner_url} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-black uppercase tracking-wider text-xs">Aesthetic Preview</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1">Universal Tag (EN)</label>
                    <input 
                      required
                      value={formData.name_en}
                      onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                      className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="e.g. Chronicles of Al-Andalus"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-primary/40 block mr-1 text-right">عنوان الكون (AR)</label>
                    <input 
                      required
                      value={formData.name_ar}
                      onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                      className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary font-arabic text-right focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="مثال: وقائع الأندلس"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3 col-span-2 md:col-span-1">
                    <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1 flex items-center justify-between">
                       <span className="flex items-center gap-2"><ImageIcon size={12} /> Narrative Banner</span>
                       {isUploading && <Loader2 size={12} className="animate-spin text-accent" />}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        value={formData.banner_url}
                        onChange={(e) => setFormData({...formData, banner_url: e.target.value})}
                        className="flex-1 px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-xs"
                        placeholder="https://..."
                      />
                      <input 
                        type="file" 
                        id="world-banner" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        disabled={isUploading}
                        onClick={() => document.getElementById('world-banner')?.click()}
                        className="h-auto px-4 rounded-2xl border-primary/10"
                      >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1 flex items-center gap-2">
                      <Palette size={12} /> Essence Color
                    </label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="color"
                        value={formData.color_primary}
                        onChange={(e) => setFormData({...formData, color_primary: e.target.value})}
                        className="w-14 h-14 bg-transparent border-none cursor-pointer"
                      />
                      <input 
                        value={formData.color_primary}
                        onChange={(e) => setFormData({...formData, color_primary: e.target.value})}
                        className="flex-1 px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-primary/40 block ml-1">The Lore (EN)</label>
                  <textarea 
                    rows={4}
                    value={formData.description_en}
                    onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                    className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-primary/40 block mr-1 text-right">السرد المتكامل (AR)</label>
                  <textarea 
                    rows={4}
                    value={formData.description_ar}
                    onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                    className="w-full px-5 py-4 bg-[#FDFBF7] border border-border rounded-2xl font-bold text-primary font-arabic text-right focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                  />
                </div>

                {/* Book Binding Section */}
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
                        <p className="font-black text-primary uppercase tracking-wider text-xs">Bind Books to this World</p>
                        <p className="text-primary/40 text-xs font-bold">
                          {selectedBookIds.length} titles connected to this realm
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
                                  <p className={`text-xs truncate ${selectedBookIds.includes(book.id) ? 'text-white/60' : 'text-primary/40'}`}>
                                    {language === 'ar' ? book.authors?.name_ar : book.authors?.name_en}
                                  </p>
                                </div>
                                {selectedBookIds.includes(book.id) && <Check size={16} />}
                              </label>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                  className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                    formData.is_featured 
                    ? 'bg-accent/5 border-accent' 
                    : 'bg-white border-border hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      formData.is_featured ? 'bg-accent text-white' : 'bg-primary/5 text-primary/20'
                    }`}>
                      <Star size={20} fill={formData.is_featured ? 'currentColor' : 'none'} />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-primary uppercase tracking-wider text-xs">Featured World</p>
                      <p className="text-primary/40 text-xs font-bold">Display on home page hero carousel</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    formData.is_featured ? 'bg-accent text-white' : 'bg-border text-transparent'
                  }`}>
                    <Check size={16} strokeWidth={4} />
                  </div>
                </button>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={upsertWorld.isPending || assignBooks.isPending}
                    className="w-full py-8 rounded-[2rem] text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/20"
                  >
                    {upsertWorld.isPending || assignBooks.isPending ? 'Syncing Universe...' : editingWorld ? 'Preserve World Changes' : 'Ignite World'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
