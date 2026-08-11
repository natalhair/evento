// ==========================================
// MODAL E BUSCA DE USUÁRIOS
// ==========================================

const modalUsers = document.getElementById('modal-users');
const btnUsers = document.getElementById('btn-users');
const btnCloseModal = document.querySelector('.close-modal');

// Abrir Modal e Carregar Usuários
btnUsers.addEventListener('click', () => {
    modalUsers.style.display = 'block';
    carregarUsuarios(); // Chama a função para buscar no supabase
});

// Fechar Modal (no X)
btnCloseModal.addEventListener('click', () => {
    modalUsers.style.display = 'none';
});

// Fechar Modal (clicando fora dela)
window.addEventListener('click', (event) => {
    if (event.target === modalUsers) {
        modalUsers.style.display = 'none';
    }
});

// Função para buscar os usuários do Supabase
async function carregarUsuarios() {
    const tbody = document.getElementById('tbody-users');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Carregando usuários...</td></tr>';

    try {
        // Faz a requisição na tabela "users" puxando as colunas solicitadas
        const { data: usuarios, error } = await supabaseClient
            .from('users')
            .select('fullname, numberphone, cpf, city, uf')
            .order('fullname', { ascending: true }); // Ordena alfabeticamente

        if (error) {
            throw error;
        }

        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Nenhum usuário cadastrado.</td></tr>';
            return;
        }

        // Preenche a tabela com os dados
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td><strong>${user.fullname || '-'}</strong></td>
                <td>${user.numberphone || '-'}</td>
                <td>${user.cpf || '-'}</td>
                <td>${user.city || '-'}</td>
                <td>${user.uf || '-'}</td>
            `;
            
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text" style="color: var(--red-vivid);">Erro ao carregar os dados dos usuários.</td></tr>';
    }
}
