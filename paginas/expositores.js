document.addEventListener("DOMContentLoaded", () => {
    carregarExpositores();
});

async function carregarExpositores() {
    const gridContainer = document.getElementById('expositores-grid');

    try {
        // Caminho para o arquivo na pasta 'expositores' na raíz
        const response = await fetch('../expositores/links.txt');
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar links.txt: Status ${response.status}`);
        }

        const texto = await response.text();
        
        // Separa as linhas por ponto e vírgula
        const linhas = texto.split(';');
        const expositores = [];

        // Trata cada linha (1.png = https://site.com)
        linhas.forEach(linha => {
            const linhaLimpa = linha.trim();
            if (linhaLimpa) {
                // Separa imagem e link
                const partes = linhaLimpa.split('=');
                if (partes.length === 2) {
                    expositores.push({
                        img: partes[0].trim(),
                        link: partes[1].trim()
                    });
                }
            }
        });

        // Embaralha o array para que a posição dos expositores mude a cada refresh
        expositores.sort(() => Math.random() - 0.5);

        // Limpa o grid de loading (caso haja)
        gridContainer.innerHTML = '';

        // Possíveis tamanhos dos cards definidos no CSS
        const tamanhos = ['size-1x1', 'size-2x2', 'size-2x1', 'size-1x2'];

        expositores.forEach(expo => {
            const card = document.createElement('div');
            card.classList.add('card-expositor');

            // Sorteia um tamanho aleatório para o card
            const tamanhoAleatorio = tamanhos[Math.floor(Math.random() * tamanhos.length)];
            card.classList.add(tamanhoAleatorio);

            // Aplica a logo como background
            card.style.backgroundImage = `url('../expositores/${expo.img}')`;

            // Evento de clique abrindo numa nova janela
            card.addEventListener('click', () => {
                let urlFinal = expo.link;
                // Garante que o link tenha http ou https caso tenha esquecido de colocar no txt
                if (!urlFinal.startsWith('http://') && !urlFinal.startsWith('https://')) {
                    urlFinal = 'https://' + urlFinal;
                }
                window.open(urlFinal, '_blank');
            });

            gridContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Falha ao carregar a lista de expositores:", error);
        gridContainer.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; color: red;">
                Não foi possível carregar os expositores no momento.
            </p>
        `;
    }
}
