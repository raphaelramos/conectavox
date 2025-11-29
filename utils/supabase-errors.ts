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
    // Tenta traduzir pelo código primeiro
    if (error.code && supabaseErrors[error.code]) {
        return supabaseErrors[error.code];
    }

    // Se não tiver código ou não achar, tenta mapear mensagens comuns em inglês
    const messageLower = error.message.toLowerCase();

    if (messageLower.includes("invalid login credentials")) {
        return supabaseErrors["invalid_credentials"];
    }
    if (messageLower.includes("user not found")) {
        return supabaseErrors["user_not_found"];
    }
    if (messageLower.includes("password should be at least")) {
        return supabaseErrors["weak_password"];
    }
    if (messageLower.includes("user already registered")) {
        return supabaseErrors["user_already_exists"];
    }

    // Fallback para a mensagem original
    return error.message;
}
