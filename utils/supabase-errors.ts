export const supabaseErrors: Record<string, string> = {
    "invalid_credentials": "Email ou senha incorretos. Verifique suas credenciais.",
    "email_not_confirmed": "Email não confirmado. Verifique sua caixa de entrada.",
    "user_not_found": "Usuário não encontrado.",
    "weak_password": "A senha deve ter pelo menos 6 caracteres.",
    "user_already_exists": "Já existe um usuário com este email.",
    "invalid_grant": "Credenciais inválidas ou expiradas.",
    "over_email_send_rate_limit": "Muitas tentativas de envio de email. Tente novamente mais tarde.",
};

export function translateSupabaseError(error: { code?: string; message: string }): string {
    if (error.code && supabaseErrors[error.code]) {
        return supabaseErrors[error.code];
    }



    // Fallback para a mensagem original
    return error.message;
}
