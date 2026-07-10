import { supabase } from "@/lib/supabase";

export async function uploadTeamLogo(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();

  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from("team-logos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha no upload do escudo: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from("team-logos")
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Não foi possível gerar a URL pública do escudo.");
  }

  return data.publicUrl;
}