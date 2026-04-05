import { useEffect, useMemo, useState } from "react";
import type {
  BlogImageRecord,
  BlogRecord,
  CreateBlogPayload,
  UpdateBlogPayload,
} from "@/interfaces/blog.interface";
import toast from "react-hot-toast";
import { FilterCard, FilterSearchInput, FilterSelect } from "@/components/ui/AppFilters";
import { getPublicationStatusStyles } from "@/shared/ui/statusStyles";
import agregarIcon from "../../../assets/images/Agregar.png";
import borrarIcon from "../../../assets/images/Borrar.png";
import editarDosIcon from "../../../assets/images/editar2.png";
import subirIcon from "../../../assets/images/subir1.png";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { ContentModal } from "../components/ContentModal";
import { DeleteContentConfirmModal } from "../components/DeleteContentConfirmModal";
import { useContentStore } from "../store/useContentStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ALL_CONTENT_STATES = "Todos los estados";

export function ContentPage() {
  const { can } = useHasPermission();

  // Validamos permisos para la llave "blogs"
  const canCreate = can("blogs", "crear");
  const canEdit = can("blogs", "actualizar");
  const canDelete = can("blogs", "eliminar");

  const { blogs, isLoading, fetchBlogs, addBlog, editBlog, removeBlog } =
    useContentStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_CONTENT_STATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogRecord | null>(null);
  const [deletingBlog, setDeletingBlog] = useState<BlogRecord | null>(null);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  const filteredItems = useMemo(() => {
    const query = normalizeText(search);

    return blogs.filter((item) => {
      const matchesTitle =
        query.length === 0 || normalizeText(item.titulo).includes(query);
      const currentStatus = item.publicado ? "Publicado" : "Borrador";
      const matchesStatus =
        statusFilter === ALL_CONTENT_STATES || currentStatus === statusFilter;
      return matchesTitle && matchesStatus;
    });
  }, [blogs, search, statusFilter]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Contenido</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Gestiona blogs y artículos del sitio web
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img
            src={agregarIcon}
            alt=""
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span>Nuevo articulo</span>
        </button>
      </header>

      <FilterCard description="Busca artículos por titulo y filtra por estado de publicación.">
        <div className="grid gap-3 md:grid-cols-2 lg:max-w-[540px]">
          <FilterSearchInput
            type="text"
            placeholder="Buscar por titulo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <FilterSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {[ALL_CONTENT_STATES, "Publicado", "Borrador"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>
        </div>
      </FilterCard>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            Cargando contenido...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-700">Sin resultados</p>
            <p className="mt-1">No se encontraron artículos</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
                  {getMainImageUrl(item.imagenes) ? (
                    <img
                      src={getMainImageUrl(item.imagenes) ?? ""}
                      alt={item.titulo || "Imagen del articulo"}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center text-sm font-medium text-slate-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-lg font-bold leading-6 text-slate-900">
                      {item.titulo?.trim() || "Sin titulo"}
                    </p>
                    <span
                      className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={getPublicationStatusStyles(item.publicado)}
                    >
                      {item.publicado ? "Publicado" : "Borrador"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[#4338CA]">
                    {item.subtitulo?.trim() || "Sin subtitulo"}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {item.resumen?.trim() || "Sin resumen"}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handlePublishBlog(item)}
                        disabled={item.publicado === true}
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <img
                          src={subirIcon}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Publicar</span>
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingBlog(item)}
                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#312C85] transition hover:bg-indigo-100"
                        style={{ backgroundColor: "#E0E7FF" }}
                      >
                        <img
                          src={editarDosIcon}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Editar</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingBlog(item)}
                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#CA5874] transition hover:bg-orange-100"
                        style={{ backgroundColor: "#FFEDD4" }}
                      >
                        <img
                          src={borrarIcon}
                          alt=""
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {canCreate && (
        <ContentModal
          isOpen={isCreateModalOpen}
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateBlog}
        />
      )}
      {canEdit && (
        <ContentModal
          isOpen={Boolean(editingBlog)}
          mode="edit"
          blog={editingBlog}
          onClose={() => setEditingBlog(null)}
          onSubmit={(payload, files) =>
            editingBlog
              ? handleEditBlog(
                  editingBlog.id,
                  payload as UpdateBlogPayload,
                  files,
                )
              : Promise.resolve("Articulo no valido.")
          }
        />
      )}
      {canDelete && (
        <DeleteContentConfirmModal
          isOpen={Boolean(deletingBlog)}
          blog={deletingBlog}
          onClose={() => setDeletingBlog(null)}
          onConfirm={handleDeleteBlog}
        />
      )}
    </div>
  );

  async function handleCreateBlog(
    payload: CreateBlogPayload | UpdateBlogPayload,
    files: File[],
  ): Promise<string | null> {
    try {
      await addBlog(payload as CreateBlogPayload, files);
      toast.success("El artículo se creó con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No fue posible crear el articulo.";
    }
  }

  async function handleEditBlog(
    blogId: number,
    payload: UpdateBlogPayload,
    files: File[],
  ): Promise<string | null> {
    try {
      await editBlog(blogId, payload, files);
      toast.success("El artículo se actualizó con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No fue posible actualizar el articulo.";
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
      toast.success(`El artículo "${blog.titulo}" se publicó con éxito.`);
    } catch {
      toast.error("No fue posible publicar el artículo.");
    }
  }

  async function handleDeleteBlog(blogId: number): Promise<string | null> {
    const targetBlog = blogs.find((item) => item.id === blogId) ?? deletingBlog;

    try {
      await removeBlog(blogId);
      setDeletingBlog(null);
      toast.success(`El articulo "${targetBlog?.titulo ?? 'seleccionado'}" se elimino con éxito.`);
      return null;
    } catch {
      toast.error("No fue posible eliminar el articulo.");
      return "No fue posible eliminar el articulo.";
    }
  }
}

function getMainImageUrl(images?: BlogImageRecord[] | null): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;

  const principalImage = images.find((image) => image?.principal) ?? images[0];
  if (!principalImage?.url) return null;

  return principalImage.url.startsWith("http")
    ? principalImage.url
    : `${API_URL}/${principalImage.url}`;
}

function normalizeText(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
