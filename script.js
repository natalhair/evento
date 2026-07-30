document.addEventListener("DOMContentLoaded", () => {
    // Referências dos Elementos da Sidebar
    const openMenuBtn = document.getElementById("open-menu");
    const closeMenuBtn = document.getElementById("close-menu");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");

    // Função para Abrir o Menu
    function openSidebar() {
        sidebar.classList.add("active");
        sidebarOverlay.classList.add("active");
        document.body.style.overflow = "hidden"; // Previne scroll ao abrir menu
    }

    // Função para Fechar o Menu
    function closeSidebar() {
        sidebar.classList.remove("active");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    // Event Listeners
    if (openMenuBtn) openMenuBtn.addEventListener("click", openSidebar);
    if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

    // Fechar sidebar ao clicar em qualquer link de navegação
    const navLinks = document.querySelectorAll(".sidebar-nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            closeSidebar();
        });
    });
});
