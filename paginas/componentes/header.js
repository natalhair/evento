class SiteHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <style>
                .inner-header {
                    width: 100%;
                    background: var(--grad-red-black);
                    padding: 15px 5%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .inner-logo {
                    max-width: 140px;
                }
            </style>

            <header class="inner-header">
                <a href="../index.html">
                    <img src="../logo.png" alt="Natal Hair" class="inner-logo">
                </a>
                <button id="open-menu" class="hamburger-btn" aria-label="Abrir Menu">
                    <div class="hamburger-circle">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
            </header>
        `;
        const btn = this.querySelector("#open-menu");
        if (btn) {
            btn.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("toggle-sidebar"));
            });
        }
    }
}
customElements.define('site-header', SiteHeader);
