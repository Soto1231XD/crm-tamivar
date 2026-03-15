import { useEffect, useMemo, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import borrarIcon from '../../../assets/images/Borrar.png';
import editarDosIcon from '../../../assets/images/editar2.png';
import subirIcon from '../../../assets/images/subir1.png';
import { useAuth } from '../../../shared/context/AuthContext';
import { ContentModal } from '../components/ContentModal';
import { useContentStore } from '../store/useContentStore';
import type {
  BlogImageRecord,
  BlogRecord,
  CreateBlogPayload,
  UpdateBlogPayload,
} from '../services/content.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ALL_CONTENT_STATES = 'Todos los estados';

export function ContentPage() {
  const { user } = useAuth();
  const { blogs, isLoading, fetchBlogs, addBlog, editBlog, removeBlog } = useContentStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_CONTENT_STATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogRecord | null>(null);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  const filteredItems = useMemo(() => {
    const query = normalizeText(search);

    return blogs.filter((item) => {
      const matchesTitle = query.length === 0 || normalizeText(item.titulo).includes(query);
      const currentStatus = item.publicado ? 'Publicado' : 'Borrador';
      const matchesStatus = statusFilter === ALL_CONTENT_STATES || currentStatus === statusFilter;
      return matchesTitle && matchesStatus;
    });
  }, [blogs, search, statusFilter]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contenido</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona blogs y articulos del sitio web</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo articulo</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Buscar por titulo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {[ALL_CONTENT_STATES, 'Publicado', 'Borrador'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            Cargando contenido...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            No se encontraron articulos
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="overflow-hidden rounded-xl bg-slate-100">
                  {getMainImageUrl(item.imagenes) ? (
                    <img
                      src={getMainImageUrl(item.imagenes) ?? ''}
                      alt={item.titulo || 'Imagen del articulo'}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-sm font-medium text-slate-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="mt-3 px-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-1 text-lg font-extrabold text-[#4338CA]">
                      {item.titulo?.trim() || 'Sin titulo'}
                    </p>
                    <span
                      className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={getPublicationStatusStyles(item.publicado)}
                    >
                      {item.publicado ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-base font-bold leading-5 text-slate-900">
                    {item.subtitulo?.trim() || 'Sin subtitulo'}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">
                    {item.resumen?.trim() || 'Sin resumen'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => handlePublishBlog(item)}
                    disabled={item.publicado === true}
                    className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md bg-[#16A34A] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <img src={subirIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>Publicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingBlog(item)}
                    className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#312C85]"
                    style={{ backgroundColor: '#E0E7FF', boxShadow: 'inset 0 0 0 999px rgba(199, 210, 254, 0.2)' }}
                  >
                    <img src={editarDosIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlog(item)}
                    className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#CA5874]"
                    style={{ backgroundColor: '#FFEDD4' }}
                  >
                    <img src={borrarIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ContentModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBlog}
      />
      <ContentModal
        isOpen={Boolean(editingBlog)}
        mode="edit"
        blog={editingBlog}
        onClose={() => setEditingBlog(null)}
        onSubmit={(payload, files) =>
          editingBlog ? handleEditBlog(editingBlog.id, payload as UpdateBlogPayload, files) : Promise.resolve('Articulo no valido.')
        }
      />
    </div>
  );

  async function handleCreateBlog(
    payload: CreateBlogPayload | UpdateBlogPayload,
    files: File[],
  ): Promise<string | null> {
    try {
      if (!user?.id) return 'No se encontro el usuario autenticado.';
      await addBlog(
        {
          ...(payload as Omit<CreateBlogPayload, 'autor_id'>),
          autor_id: user.id,
        },
        files,
      );
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el articulo.';
    }
  }

  async function handleEditBlog(
    blogId: number,
    payload: UpdateBlogPayload,
    files: File[],
  ): Promise<string | null> {
    try {
      await editBlog(blogId, payload, files);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar el articulo.';
    }
  }

  async function handlePublishBlog(blog: BlogRecord) {
    try {
      await editBlog(
        blog.id,
        {
          publicado: true,
          fechaPublico: new Date().toISOString(),
          imagenes: Array.isArray(blog.imagenes) ? blog.imagenes : [],
        },
        [],
      );
    } catch {
      // noop
    }
  }

  async function handleDeleteBlog(blog: BlogRecord) {
    const confirmed = window.confirm(`Se eliminara el articulo "${blog.titulo}".`);
    if (!confirmed) return;

    try {
      await removeBlog(blog.id);
    } catch {
      // noop
    }
  }
}

function getPublicationStatusStyles(publicado?: boolean | null): { backgroundColor: string; color: string } {
  if (publicado === true) {
    return { backgroundColor: '#DBFCE7', color: '#4D8236' };
  }

  return { backgroundColor: '#FFEDD4', color: '#CA5874' };
}

function getMainImageUrl(images?: BlogImageRecord[] | null): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const principalImage = images.find((image) => image?.principal) ?? images[0];
  if (!principalImage?.url) return null;

  return principalImage.url.startsWith('http')
    ? principalImage.url
    : `${API_URL}/${principalImage.url}`;
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
