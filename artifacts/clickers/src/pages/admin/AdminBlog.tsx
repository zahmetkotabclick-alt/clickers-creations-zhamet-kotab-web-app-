import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { AdminLayout, AdminPageHeader } from '@/components/admin/AdminLayout';
import { useBlogPosts, useUpsertBlogPost, useAuthors } from '@/services/supabase.hooks';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/lib/database.types';

type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

const CATEGORIES = ['Literary', 'News', 'Interview', 'Review', 'Culture', 'General'];

function BlogFormModal({ post, onClose }: { post?: Record<string, unknown> | null; onClose: () => void }) {
  const { data: authors } = useAuthors();
  const upsert = useUpsertBlogPost();
  const [form, setForm] = useState<Record<string, unknown>>({
    title_ar: '', title_en: '', excerpt_ar: '', excerpt_en: '',
    content_ar: '', content_en: '', author_id: '', image_url: '',
    category: 'Literary', read_time: '5 min', status: 'draft',
    ...(post ?? {}),
  });
  const [isUploading, setIsUploading] = useState(false);
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-black text-primary font-cinematic">
            {post ? 'Edit Article' : 'New Article'}
          </h2>
          <button onClick={onClose} className="text-primary/40 hover:text-primary text-2xl font-bold">✕</button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = { ...form } as Record<string, unknown>;
            if (payload.status === 'published' && !payload.published_at) {
              payload.published_at = new Date().toISOString();
            }
            if (!payload.author_id) delete payload.author_id;
            
            // Cleanup relations before upsert
            delete (payload as any).authors;

            await upsert.mutateAsync(payload);
            onClose();
          }}
          className="p-8 space-y-6"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Cover Image</label>
            <div className="flex gap-4 items-center">
              {Boolean(form.image_url) && (
                <img src={form.image_url as string} alt="Preview" className="h-24 w-40 object-cover rounded-xl shadow-lg border border-border" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    
                    const ext = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${ext}`;
                    const filePath = `blog/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage.from('covers').upload(filePath, file);
                    if (uploadError) {
                      alert('Error: ' + uploadError.message);
                      setIsUploading(false);
                      return;
                    }
                    
                    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(filePath);
                    set('image_url', publicUrl);
                    setIsUploading(false);
                  }}
                  className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold bg-[#FDFBF7] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                />
                <p className="text-xs uppercase text-primary/40 tracking-wider mt-2 font-bold">
                  {isUploading ? 'Uploading...' : 'Recommended: 1200x800px'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Arabic Title *</label>
              <input required value={(form.title_ar as string) || ''} onChange={(e) => set('title_ar', e.target.value)} dir="rtl" className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold font-arabic focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#FDFBF7] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">English Title *</label>
              <input required value={(form.title_en as string) || ''} onChange={(e) => set('title_en', e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#FDFBF7] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Author</label>
              <select value={(form.author_id as string) || ''} onChange={(e) => set('author_id', e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7]">
                <option value="">No Author</option>
                {authors?.map((a) => <option key={a.id} value={a.id}>{a.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Category</label>
              <select value={(form.category as string) || 'Literary'} onChange={(e) => set('category', e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7]">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Read Time</label>
              <input value={(form.read_time as string) || ''} onChange={(e) => set('read_time', e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7] transition-all" placeholder="5 min" />
            </div>
          </div>

          {/* Image preview */}
          {!!form.image_url && (
            <div className="relative h-40 rounded-2xl overflow-hidden border border-border">
              <img src={form.image_url as string} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Arabic Excerpt</label>
              <textarea value={(form.excerpt_ar as string) || ''} onChange={(e) => set('excerpt_ar', e.target.value)} rows={3} dir="rtl" className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7] font-arabic resize-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">English Excerpt</label>
              <textarea value={(form.excerpt_en as string) || ''} onChange={(e) => set('excerpt_en', e.target.value)} rows={3} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">Arabic Content</label>
              <textarea value={(form.content_ar as string) || ''} onChange={(e) => set('content_ar', e.target.value)} rows={8} dir="rtl" className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7] font-arabic resize-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-primary/40 mb-2">English Content</label>
              <textarea value={(form.content_en as string) || ''} onChange={(e) => set('content_en', e.target.value)} rows={8} className="w-full px-4 py-3 border border-border rounded-xl text-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[#FDFBF7] resize-none" />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <label className="text-xs font-black uppercase tracking-wider text-primary/40">Status</label>
              <div className="flex gap-2">
                {(['draft', 'published'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${form.status === s ? 'bg-primary text-white' : 'bg-primary/5 text-primary/50 hover:text-primary'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={onClose} className="px-8 py-3 border border-border rounded-2xl text-primary font-bold hover:bg-primary/5 transition-all">Cancel</button>
              <button type="submit" disabled={upsert.isPending} className="px-10 py-3 bg-primary text-white font-black rounded-2xl hover:bg-accent hover:text-primary transition-all disabled:opacity-50">
                {upsert.isPending ? 'Saving...' : (post ? 'Save Changes' : 'Publish Article')}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AdminBlog() {
  const { data: posts, isLoading } = useBlogPosts({ status: undefined });
  const [editing, setEditing] = useState<Record<string, unknown> | null | undefined>(undefined);
  const qc = useQueryClient();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['blog'] });
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    const update: BlogPostUpdate = { status: newStatus };
    if (newStatus === 'published') update.published_at = new Date().toISOString();
    await supabase.from('blog_posts').update(update as never).eq('id', id);
    qc.invalidateQueries({ queryKey: ['blog'] });
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Blog Management"
        subtitle={`${posts?.length ?? 0} articles`}
        action={
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl hover:bg-accent hover:text-primary transition-all text-sm uppercase tracking-wider shadow-xl shadow-primary/20"
          >
            <Plus size={18} /> New Article
          </button>
        }
      />

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl p-6 animate-pulse h-24" />
            ))
          : (posts ?? []).map((post) => (
              <motion.div
                key={post.id}
                className="bg-white border border-border rounded-2xl p-6 flex items-center gap-6 group hover:shadow-lg hover:shadow-primary/5 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-20 h-14 object-cover rounded-xl shadow-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-bold text-primary text-lg line-clamp-1" dir="rtl">{post.title_ar}</h3>
                      <p className="text-primary/50 text-sm line-clamp-1">{post.title_en}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 bg-primary/5 text-primary font-bold text-xs rounded-lg">{post.category}</span>
                      <span className={`px-3 py-1 rounded-xl border text-xs font-black ${post.status === 'published' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-primary/30 text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : 'Not published'}
                    </span>
                    <span>{post.read_time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(post.id as string, post.status)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${post.status === 'published' ? 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'}`}
                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {post.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => setEditing(post as Record<string, unknown>)}
                    className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id as string)}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
        {!isLoading && (posts ?? []).length === 0 && (
          <div className="text-center py-20 text-primary/30 font-bold">No articles yet. Write your first one!</div>
        )}
      </div>

      <AnimatePresence>
        {editing !== undefined && (
          <BlogFormModal post={editing} onClose={() => setEditing(undefined)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
