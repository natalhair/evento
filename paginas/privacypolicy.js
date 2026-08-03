document.addEventListener("DOMContentLoaded", async () => {
    const contentDiv = document.getElementById("markdown-content");
    
    try {
        // Como o html e o txt estão na mesma pasta (paginas/), usamos o caminho direto
        const response = await fetch("privacypolicy.txt");
        
        if (!response.ok) {
            throw new Error("Não foi possível carregar o arquivo.");
        }
        
        const markdownText = await response.text();
        
        // Converte o Markdown para HTML usando a biblioteca Marked.js
        const htmlContent = marked.parse(markdownText);
        
        // Injeta o HTML resultante na div
        contentDiv.innerHTML = htmlContent;
        
    } catch (error) {
        console.error("Erro ao carregar a política de privacidade:", error);
        contentDiv.innerHTML = `<p class="status-message error-message">Erro ao carregar a política de privacidade. Por favor, tente novamente mais tarde.</p>`;
    }
});
