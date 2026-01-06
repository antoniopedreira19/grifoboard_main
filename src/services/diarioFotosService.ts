import { supabase } from "@/integrations/supabase/client";

const BUCKET = "diario-obra";

export interface DiarioFoto {
  id: string;
  obra_id: string;
  data: string;
  path: string;
  legenda?: string;
  criado_por: string;
  criado_em: string;
  url?: string;
}

export interface DiarioFotoInsert {
  obra_id: string;
  data: string;
  path: string;
  legenda?: string;
  criado_por: string;
}

export const diarioFotosService = {
  /**
   * Converte uma data para formato ISO (YYYY-MM-DD) no fuso America/Bahia
   */
  toISODateBahia(date: Date | string): string {
    const dt = new Date(date);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * Cria URL assinada para acessar foto no bucket privado
   */
  async createSignedUrl(path: string, expiresIn = 86400): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Carrega fotos do diário com filtros
   */
  async loadPhotos(
    obraId: string,
    isoDate: string,
    userFilter: "todos" | string,
    page = 0,
    pageSize = 30
  ): Promise<DiarioFoto[]> {
    let query = supabase
      .from("diario_fotos")
      .select("id, obra_id, data, path, legenda, criado_em, criado_por")
      .eq("obra_id", obraId)
      .eq("data", isoDate)
      .order("criado_em", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (userFilter !== "todos") {
      query = query.eq("criado_por", userFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Gerar URLs assinadas para cada foto
    const photosWithUrls = await Promise.all(
      (data ?? []).map(async (photo) => ({
        ...photo,
        url: await this.createSignedUrl(photo.path),
      }))
    );

    return photosWithUrls;
  },

  /**
   * Faz upload de múltiplas fotos do dia
   */
  async uploadDailyPhotos(
    obraId: string,
    isoDate: string,
    files: File[],
    legendaPadrao?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const id = crypto.randomUUID();
      const path = `obra/${obraId}/diario/${isoDate}/${user.id}/${id}.${ext}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Inserir registro na tabela
      const { error: insertError } = await supabase
        .from("diario_fotos")
        .insert({
          obra_id: obraId,
          data: isoDate,
          path,
          legenda: legendaPadrao ?? null,
          criado_por: user.id,
        });

      if (insertError) {
        // Se falhar ao inserir no DB, remove o arquivo
        await supabase.storage.from(BUCKET).remove([path]);
        throw insertError;
      }
    }
  },

  /**
   * Exclui uma foto (apenas se o usuário tiver permissão)
   */
  async deletePhoto(id: string, path: string): Promise<void> {
    // Primeiro tenta deletar do DB (RLS vai verificar permissão)
    const { error: dbError } = await supabase
      .from("diario_fotos")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    // Se conseguiu deletar do DB, remove o arquivo
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    // Ignora erro 404 do storage (arquivo já foi removido)
    if (storageError && !storageError.message.includes("404")) {
      throw storageError;
    }
  },

  /**
   * Conta total de fotos com os filtros aplicados
   */
  async countPhotos(
    obraId: string,
    isoDate: string,
    userFilter: "todos" | string
  ): Promise<number> {
    let query = supabase
      .from("diario_fotos")
      .select("id", { count: "exact", head: true })
      .eq("obra_id", obraId)
      .eq("data", isoDate);

    if (userFilter !== "todos") {
      query = query.eq("criado_por", userFilter);
    }

    const { count, error } = await query;
    if (error) throw error;

    return count ?? 0;
  },
};
