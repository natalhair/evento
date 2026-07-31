const SUPABASE_URL = "https://viwjlxtxhpjlrijpnjcl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq";

document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("embaixadoras-grid");

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/embaixadoras?select=*`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar dados do Supabase.");
        }

        const embaixadoras = await response.json();

        if (embaixadoras.length === 0) {
            grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Nenhuma embaixadora cadastrada no momento.</p>";
            return;
        }

        grid.innerHTML = "";

        embaixadoras.forEach(emb => {
            const nomeCompleto = emb.nome || "Embaixadora";
            const primeiraPalavraNome = nomeCompleto.split(" ")[0];
            const cidade = emb.cidade || "Cidade não informada";
            const historia = emb.historia || "História não informada.";
            const imagem = emb.img || "https://via.placeholder.com/150";

            // Sorteia aleatoriamente um tamanho para o card a cada atualização da página
            const tamanhos = ["card-size-small", "card-size-medium", "card-size-large"];
            const tamanhoAleatorio = tamanhos[Math.floor(Math.random() * tamanhos.length)];

            const card = document.createElement("div");
            card.className = `flip-card ${tamanhoAleatorio}`;

            card.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <img src="${imagem}" alt="${nomeCompleto}">
                        <h3>${nomeCompleto}</h3>
                    </div>
                    <div class="flip-card-back">
                        <p class="story-text">"${historia}"</p>
                        <div class="story-author">- ${primeiraPalavraNome}, ${cidade}.</div>
                    </div>
                </div>
            `;

            // Permite virar o card ao clicar (essencial para dispositivos móveis)
            card.addEventListener("click", () => {
                card.classList.toggle("flipped");
            });

            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #dc2626;'>Erro ao carregar as embaixadoras.</p>";
    }
});
