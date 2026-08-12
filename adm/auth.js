// ==========================================
// AUTENTICAÇÃO DO PAINEL ADMINISTRATIVO (auth.js)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const authOverlay = document.getElementById("auth-overlay");
    const authForm = document.getElementById("auth-form");
    const authInput = document.getElementById("auth-password");
    const authError = document.getElementById("auth-error");
    const authBtn = document.getElementById("auth-btn");

    // Mantém a sessão ativa enquanto o navegador/aba estiver aberto
    if (sessionStorage.getItem("adm_authenticated") === "true") {
        liberarAcesso();
        return;
    }

    // Bloqueia a rolagem da página enquanto a tela estiver sobreposta
    document.body.style.overflow = "hidden";

    // Submissão da senha
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const senhaDigitada = authInput.value.trim();

        if (!senhaDigitada) {
            exibirErro("Por favor, digite a senha.");
            return;
        }

        // Estado de carregamento no botão
        authBtn.disabled = true;
        authBtn.textContent = "Verificando...";
        authError.style.display = "none";

        try {
            // Consulta a tabela 'adm' no Supabase procurando pela senha informada
            const { data, error } = await supabaseClient
                .from('adm')
                .select('senha')
                .eq('senha', senhaDigitada);

            if (error) {
                throw error;
            }

            // Se encontrou a senha correspondente na tabela
            if (data && data.length > 0) {
                sessionStorage.setItem("adm_authenticated", "true");
                liberarAcesso();
            } else {
                exibirErro("Senha incorreta. Tente novamente.");
                authInput.value = "";
                authInput.focus();
            }
        } catch (err) {
            console.error("Erro na autenticação:", err);
            exibirErro("Erro ao verificar senha no servidor.");
        } finally {
            authBtn.disabled = false;
            authBtn.textContent = "Entrar";
        }
    });

    function liberarAcesso() {
        if (authOverlay) {
            authOverlay.style.display = "none";
        }
        document.body.style.overflow = "auto";
    }

    function exibirErro(mensagem) {
        authError.textContent = mensagem;
        authError.style.display = "block";
    }
});
