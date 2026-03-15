import { create } from 'zustand';
import {
  createBlog,
  deleteBlog,
  getBlog,
  getBlogs,
  updateBlog,
  type BlogRecord,
  type CreateBlogPayload,
  type UpdateBlogPayload,
} from '../services/content.api';

type ContentState = {
  blogs: BlogRecord[];
  currentBlog: BlogRecord | null;
  isLoading: boolean;
  error: string | null;
  fetchBlogs: () => Promise<void>;
  fetchBlog: (id: number) => Promise<void>;
  addBlog: (payload: CreateBlogPayload, files?: File[]) => Promise<BlogRecord>;
  editBlog: (id: number, payload: UpdateBlogPayload, files?: File[]) => Promise<BlogRecord>;
  removeBlog: (id: number) => Promise<void>;
  clearCurrentBlog: () => void;
};

export const useContentStore = create<ContentState>((set) => ({
  blogs: [],
  currentBlog: null,
  isLoading: false,
  error: null,

  fetchBlogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const blogs = await getBlogs();
      set({ blogs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar el contenido',
        isLoading: false,
      });
    }
  },

  fetchBlog: async (id: number) => {
    set({ isLoading: true, error: null, currentBlog: null });
    try {
      const blog = await getBlog(id);
      set({ currentBlog: blog, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar el articulo',
        isLoading: false,
      });
    }
  },

  addBlog: async (payload: CreateBlogPayload, files: File[] = []) => {
    set({ isLoading: true, error: null });
    try {
      const createdBlog = await createBlog(payload, files);
      set((state) => ({
        blogs: [createdBlog, ...state.blogs],
        isLoading: false,
      }));
      return createdBlog;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el articulo';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  editBlog: async (id: number, payload: UpdateBlogPayload, files: File[] = []) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBlog = await updateBlog(id, payload, files);
      set((state) => ({
        blogs: state.blogs.map((blog) => (blog.id === id ? updatedBlog : blog)),
        currentBlog: updatedBlog,
        isLoading: false,
      }));
      return updatedBlog;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el articulo';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  removeBlog: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteBlog(id);
      set((state) => ({
        blogs: state.blogs.filter((blog) => blog.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al eliminar el articulo',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentBlog: () => set({ currentBlog: null }),
}));
