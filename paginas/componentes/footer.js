class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                .main-footer {
                    background-color: #ffffff;
                    color: #ffffff;
                    width: 100%;
                    font-family: Arial, sans-serif;
                }
                .footer-container {
                    display: flex;
                    justify-content: space-between;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 25px;
                }
                .footer-logo {
                    max-width: 150px;
                    margin-bottom: 20px;
                }
                .nav-title {
                    font-size: 1.2rem;
                    margin-bottom: 15px;
                    color: #fff;
                }
                .footer-nav-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 20px 0;
                }
                .footer-nav-list li {
                    margin-bottom: 8px;
                }
                .footer-nav-list a {
                    color: #ccc;
                    text-decoration: none;
                    transition: color 0.3s;
                }
                .footer-nav-list a:hover {
                    color: var(--primary-red, #b91c1c);
                }
                .dev-credits {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9rem;
                    color: #888;
                }
                .dev-logo {
                    height: 40px;
                }
                .footer-col-right {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    align-items: flex-start;
                }
                .footer-oct-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #ffffff;
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: background 0.3s;
                }
                .footer-oct-btn:hover {
                    background: #f0f0f0;
                }

                /* Responsividade enviada */
                @media (max-width: 768px) {
                    .footer-container {
                        flex-direction: column;
                        padding: 40px 25px 30px 25px;
                        gap: 40px;
                    }
                    .footer-col-left, .footer-col-right {
                        width: 100%;
                    }
                }
            </style>

            <footer class="main-footer">
                <div class="footer-container">
                    <div class="footer-col-left">
                        <img src="../logo.png" alt="Natal Hair" class="footer-logo">
                        <h3 class="nav-title">Navegue</h3>
                        <ul class="footer-nav-list">
                            <li><a href="../index.html">Página Inicial</a></li>
                            <li><a href="ingressos.html">Ingressos</a></li>
                            <li><a href="embaixadoras.html">Embaixadoras</a></li>
                            <li><a href="seja-uma-embaixadora.html">Seja uma embaixadora</a></li>
                            <li><a href="expositores.html">Expositores</a></li>
                            <li><a href="seja-um-expositor.html">Seja um expositor</a></li>
                            <li><a href="politica-de-privacidade.html">Política de Privacidade</a></li>
                            <li><a href="outros-eventos.html">Outros eventos</a></li>
                            <li><a href="nossa-equipe.html">Nossa equipe</a></li>
                            <li><a href="nossa-historia.html">Nossa história</a></li>
                            <li><a href="noticias.html">Notícias</a></li>
                            <li><a href="programacao.html">Programação</a></li>
                        </ul>
                    </div>

                    <div class="footer-col-right">
                        <a href="https://wa.me/5584999215473" target="_blank" class="footer-oct-btn">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>Contate-nos</span>
                        </a>
                        <a href="https://instagram.com/fafamedeiros_natalhair" target="_blank" class="footer-oct-btn">
                            <i class="fa-brands fa-instagram"></i>
                            <span>Acompanhe-nos</span>
                        </a>
                    </div>
                    <div class="dev-credits">
                            <span>Desenvolvido por</span>
                            <a href="https://micadevsparkles.github.io/mywork" target="_blank">
                                <img src="../assets/media/devlogo.png" alt="MicaDev" class="dev-logo">
                            </a>
                        </div>
                </div>
            </footer>
        `;
    }
}
customElements.define('site-footer', SiteFooter);
