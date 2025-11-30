import { AuthError, PostgrestError } from "@supabase/supabase-js";

export const supabaseErrors: Record<string, string> = {
    "invalid_credentials": "Email ou senha incorretos. Verifique suas credenciais.",
    "email_not_confirmed": "Email não confirmado. Verifique sua caixa de entrada.",
    "user_not_found": "Usuário não encontrado.",
    "weak_password": "A senha deve ter pelo menos 6 caracteres.",
    "user_already_exists": "Já existe um usuário com este email.",
    "invalid_grant": "Credenciais inválidas ou expiradas.",
    "over_email_send_rate_limit": "Muitas tentativas de envio de email. Tente novamente mais tarde.",
};

export function translateSupabaseError(error: AuthError | PostgrestError | unknown): string {
    if (!error) return "Ocorreu um erro desconhecido.";

    if (typeof error === 'object' && 'message' in error) {
        const err = error as { code?: string; message: string };

        // Check for specific error codes in our dictionary
        if (err.code && supabaseErrors[err.code]) {
            return supabaseErrors[err.code];
        }

        if (supabaseErrors[err.message]) {
            return supabaseErrors[err.message];
        }

        return err.message;
    }

    return "Ocorreu um erro desconhecido.";
}
