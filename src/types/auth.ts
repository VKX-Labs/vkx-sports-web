import type { User } from "@supabase/supabase-js";

export interface Profile {
  full_name?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
