import { createClient } from "@/utils/supabase/server";

export class AuthenticationError extends Error {
  constructor(message = "Autenticacao obrigatoria.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string;
};

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  const email = user.email?.trim();
  if (!email) {
    throw new AuthenticationError("Usuario autenticado sem email valido.");
  }

  const fullName = user.user_metadata?.full_name;
  const name = typeof fullName === "string" && fullName.trim() ? fullName.trim() : undefined;

  return {
    id: user.id,
    email,
    name,
  };
}
