// ==========================================
// MANIPULAÇÃO DO MENU SIDEBAR (HAMBÚRGUER)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const openSidebarBtn = document.getElementById("openSidebarBtn");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const btnProgramacao = document.getElementById("btnProgramacao");

    // Função para abrir o menu
    function openSidebar() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");
        document.body.style.overflow = "hidden"; // Impede scroll do fundo
    }

    // Função para fechar o menu
    function closeSidebar() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = ""; // Restaura scroll
    }

    // Eventos de clique
    if (openSidebarBtn) openSidebarBtn.addEventListener("click", openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

    // Fechar sidebar com a tecla ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("open")) {
            closeSidebar();
        }
    });

    // Redirecionamento do Botão de Programação
    if (btnProgramacao) {
        btnProgramacao.addEventListener("click", (e) => {
            // Garante o redirecionamento dentro da mesma aba para a página de programação
            window.location.href = "paginas/programacao.html";
        });
    }
});
