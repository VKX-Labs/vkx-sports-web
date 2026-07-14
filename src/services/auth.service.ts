import { supabase } from "@/lib/supabase";

export async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não autenticado no sistema.");
  }

  return user.id;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { full_name?: string }
) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
