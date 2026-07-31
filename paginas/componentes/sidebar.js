class SiteSidebar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 998;
                    display: none;
                }
                .sidebar-overlay.active {
                    display: block;
                }
                .sidebar {
                    position: fixed;
                    top: 0;
                    right: -320px;
                    width: 300px;
                    height: 100vh;
                    background-color: var(--black, #111);
                    color: var(--white, #fff);
                    z-index: 999;
                    transition: right 0.3s ease;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
                    overflow-y: auto;
                }
                .sidebar.active {
                    right: 0;
                }
                .close-btn {
                    align-self: flex-end;
                    background: none;
                    border: none;
                    color: var(--white, #fff);
                    font-size: 2rem;
                    cursor: pointer;
                }
                .sidebar-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .sidebar-logo {
                    max-width: 150px;
                    height: auto;
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .sidebar-nav a {
                    color: #cccccc;
                    font-size: 0.95rem;
                    padding: 8px 12px;
                    border-radius: 4px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .sidebar-nav a:hover, .sidebar-nav a.active {
                    background-color: var(--primary-red, #b91c1c);
                    color: var(--white, #fff);
                }
                /* WHATSAPP FLOATING BUTTON */
                .whatsapp-float {
                    position: fixed;
                    bottom: 25px;
                    right: 25px;
                    width: 60px;
                    height: 60px;
                    background-color: #25d366;
                    color: var(--white, #fff);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
                    z-index: 900;
                    transition: transform 0.2s;
                    text-decoration: none;
                }
                .whatsapp-float:hover {
                    transform: scale(1.1);
                }
            </style>

            <div id="sidebar-overlay" class="sidebar-overlay"></div>
            <aside id="sidebar" class="sidebar">
                <button id="close-menu" class="close-btn" aria-label="Fechar Menu">&times;</button>
                <div class="sidebar-header">
                    <img src="../logo.png" alt="Natal Hair" class="sidebar-logo">
                </div>
                <nav class="sidebar-nav">
                    <a href="../index.html">Página Inicial</a>
                    <a href="ingressos.html">Ingressos</a>
                    <a href="embaixadoras.html">Embaixadoras</a>
                    <a href="seja-uma-embaixadora.html">Seja uma embaixadora</a>
                    <a href="expositores.html">Expositores</a>
                    <a href="seja-um-expositor.html">Seja um expositor</a>
                    <a href="politica-de-privacidade.html">Política de Privacidade</a>
                    <a href="outros-eventos.html">Outros eventos</a>
                    <a href="nossa-equipe.html">Nossa equipe</a>
                    <a href="nossa-historia.html">Nossa história</a>
                    <a href="noticias.html">Notícias</a>
                    <a href="programacao.html">Programação</a>
                </nav>
            </aside>

            <a href="https://wa.me/5584999215473" target="_blank" class="whatsapp-float" aria-label="Contato via WhatsApp">
                <i class="fa-brands fa-whatsapp"></i>
            </a>
        `;

        // Referências dos Elementos
        const closeMenuBtn = this.querySelector("#close-menu");
        const sidebar = this.querySelector("#sidebar");
        const sidebarOverlay = this.querySelector("#sidebar-overlay");

        function openSidebar() {
            sidebar.classList.add("active");
            sidebarOverlay.classList.add("active");
            document.body.style.overflow = "hidden";
        }

        function closeSidebar() {
            sidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");
            document.body.style.overflow = "";
        }

        // Abre o menu 
        document.addEventListener("click", (e) => {
            if (e.target.closest("#open-menu")) {
                openSidebar();
            }
        });
        
        // Mantém os eventos para fechar (que estão dentro do próprio componente sidebar)
        if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

        // Fecha a sidebar ao clicar em qualquer link de navegação interno
        const navLinks = this.querySelectorAll(".sidebar-nav a");
        navLinks.forEach(link => {
            link.addEventListener("click", closeSidebar);
        });
        const navLinks = this.querySelectorAll(".sidebar-nav a");
        navLinks.forEach(link => {
            link.addEventListener("click", closeSidebar);
        });
    }
}
customElements.define('site-sidebar', SiteSidebar);
