document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("feed-container");
    
    try {
        const response = await fetch("noticias.txt");
        
        if (!response.ok) {
            throw new Error("Não foi possível carregar o arquivo de notícias.");
        }
        
        const text = await response.text();
        
        // Separa os links por quebra de linha e limpa os espaços
        const links = text.split('\n')
                          .map(link => link.trim())
                          .filter(link => link.length > 0 && link.includes("instagram.com"));
        
        if (links.length === 0) {
            container.innerHTML = `<p class="status-message">Nenhuma publicação disponível no momento.</p>`;
            return;
        }

        // Limpa a mensagem de "carregando"
        container.innerHTML = "";

        links.forEach(link => {
            // Garante que o link tenha "https://" mesmo que você cole sem no .txt
            let formatLink = link;
            if (!formatLink.startsWith("http://") && !formatLink.startsWith("https://")) {
                formatLink = "https://" + formatLink;
            }

            const blockquote = document.createElement('blockquote');
            blockquote.className = 'instagram-media';
            blockquote.setAttribute('data-instgrm-permalink', formatLink);
            blockquote.setAttribute('data-instgrm-version', '14');
            
            // Estilos visuais temporários (para antes do Instagram renderizar o card final)
            blockquote.style.background = '#FFF';
            blockquote.style.border = '0';
            blockquote.style.borderRadius = '3px';
            blockquote.style.boxShadow = '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)';
            blockquote.style.margin = '1px';
            blockquote.style.maxWidth = '540px';
            blockquote.style.minWidth = '326px';
            blockquote.style.padding = '0';
            blockquote.style.width = '100%';

            container.appendChild(blockquote);
        });

        // Aciona a biblioteca do Instagram para transformar o bloco de texto no Post renderizado
        setTimeout(() => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        }, 500);

    } catch (error) {
        console.error("Erro ao carregar o feed:", error);
        container.innerHTML = `<p class="status-message error-message">Erro ao carregar o feed de notícias. Verifique o arquivo noticias.txt.</p>`;
    }
});
