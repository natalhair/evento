// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis para armazenar os dados globais para o PDF
let dadosDia1 = [];
let dadosDia2 = [];

// Inicia o carregamento quando a página abre
document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
});

// ==========================================
// BUSCA E RENDERIZAÇÃO
// ==========================================
async function carregarDados() {
    try {
        // Busca os dados do Dia 1
        // Se você configurou a Foreign Key entre cpfEvento e users, 
        // você poderia usar: .select('*, users(fullname)') para puxar o nome automaticamente
        const resDia1 = await supabaseClient
            .from('natalhair2026_dia_1')
            .select('*, users(fullname)')
            .order('created_at', { ascending: false });

        if (!resDia1.error) {
            dadosDia1 = resDia1.data;
            renderizarTabela('tbody-dia1', dadosDia1);
            document.getElementById('count-dia1').textContent = dadosDia1.length;
        }

        // Busca os dados do Dia 2
        const resDia2 = await supabaseClient
            .from('natalhair2026_dia_2')
            .select('*, users(fullname)')
            .order('created_at', { ascending: false });

        if (!resDia2.error) {
            dadosDia2 = resDia2.data;
            renderizarTabela('tbody-dia2', dadosDia2);
            document.getElementById('count-dia2').textContent = dadosDia2.length;
        }

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        alert("Erro ao conectar com o banco de dados.");
    }
}

function renderizarTabela(tbodyId, dados) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="loading-text">Nenhum check-in registrado ainda.</td></tr>';
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        
        // Pega o nome do usuário. 
        // Se usar Foreign Key, puxa de item.users.fullname. Senão, puxa da coluna 'name'.
        const nomeUsuario = (item.users && item.users.fullname) ? item.users.fullname : (item.name || 'Nome não identificado');
        
        tr.innerHTML = `
            <td><strong>${nomeUsuario}</strong></td>
            <td>${formatarDataHora(item.created_at)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatarDataHora(dataIso) {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    return data.toLocaleString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ==========================================
// EXPORTAÇÃO PARA PDF (jsPDF + autoTable)
// ==========================================
document.getElementById('btn-export-dia1').addEventListener('click', () => {
    gerarPDF('Relatório de Check-in - Dia 1', dadosDia1, 'NatalHair_Dia1.pdf');
});

document.getElementById('btn-export-dia2').addEventListener('click', () => {
    gerarPDF('Relatório de Check-in - Dia 2', dadosDia2, 'NatalHair_Dia2.pdf');
});

function gerarPDF(titulo, dados, nomeArquivo) {
    if (dados.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    // Inicializa o jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Estilo do título no PDF
    doc.setFontSize(18);
    doc.setTextColor(230, 0, 0); // Vermelho
    doc.text("Natal Hair 2026", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(titulo, 14, 28);
    doc.text(`Total de registros: ${dados.length}`, 14, 34);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 40);

    // Prepara os dados para a tabela do PDF
    const bodyData = dados.map(item => {
        const nomeUsuario = (item.users && item.users.fullname) ? item.users.fullname : (item.name || 'Nome não identificado');
        return [
            nomeUsuario, 
            formatarDataHora(item.created_at)
        ];
    });

    // Gera a tabela no PDF
    doc.autoTable({
        startY: 45,
        head: [['Nome do Participante', 'Data e Hora do Check-in']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [230, 0, 0] }, // Cabeçalho vermelho
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Baixa o arquivo
    doc.save(nomeArquivo);
}

// ==========================================
// LÓGICA DO MODAL DE USUÁRIOS
// ==========================================
const btnUsuarios = document.getElementById('btn-usuarios');
const modalUsuarios = document.getElementById('modal-usuarios');
const closeModal = document.getElementById('close-modal');
const tbodyUsuarios = document.getElementById('tbody-usuarios');

btnUsuarios.addEventListener('click', async () => {
    modalUsuarios.classList.add('show');
    await carregarUsuarios();
});

closeModal.addEventListener('click', () => {
    modalUsuarios.classList.remove('show');
});

// Fechar o modal ao clicar fora da área de conteúdo dele
window.addEventListener('click', (e) => {
    if (e.target === modalUsuarios) {
        modalUsuarios.classList.remove('show');
    }
});

async function carregarUsuarios() {
    tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="loading-text">Buscando dados no servidor...</td></tr>';
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, fullname, numberphone, cpf, city, uf, pagamento')
            .order('fullname', { ascending: true }); // Ordena os usuários por nome em ordem alfabética
            
        if (error) {
            throw error;
        }
        
        tbodyUsuarios.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="loading-text">Nenhum usuário cadastrado encontrado.</td></tr>';
            return;
        }
        
        data.forEach(user => {
            const tr = document.createElement('tr');
            
            // Tratamento contra valores vazios para não deixar campo quebrado visualmente
            const nome = user.fullname || '-';
            const telefone = user.numberphone || '-';
            const documento = user.cpf || '-';
            const cidade = user.city || '-';
            const estado = user.uf || '-';
            
            const isPago = user.pagamento && user.pagamento.toLowerCase() === 'pago';
            const userId = user.id || user.cpf;

            tr.innerHTML = `
                <td><strong>${nome}</strong></td>
                <td>${telefone}</td>
                <td>${documento}</td>
                <td>${cidade}</td>
                <td>${estado}</td>
                <td>
                    <div class="switch-container">
                        <label class="switch">
                            <input type="checkbox" ${isPago ? 'checked' : ''} onchange="alternarPagamento('${userId}', this)">
                            <span class="slider"></span>
                        </label>
                        <span class="switch-status-text" style="color: ${isPago ? '#10b981' : 'var(--text-muted)'}">
                            ${isPago ? 'Pago' : 'Pendente'}
                        </span>
                    </div>
                </td>
            `;
            tbodyUsuarios.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        tbodyUsuarios.innerHTML = '<tr><td colspan="6" class="loading-text" style="color: var(--red-vivid);">Ocorreu um erro ao buscar os usuários. Tente novamente.</td></tr>';
    }
}
// ==========================================
// FUNÇÃO PARA ALTERNAR STATUS DE PAGAMENTO
// ==========================================
async function alternarPagamento(identifier, checkbox) {
    const novoStatus = checkbox.checked ? 'pago' : null;
    const statusText = checkbox.closest('.switch-container').querySelector('.switch-status-text');

    checkbox.disabled = true;

    try {
        let query = supabaseClient.from('users').update({ pagamento: novoStatus });

        // Tenta atualizar utilizando o ID ou o CPF
        if (Number.isInteger(Number(identifier))) {
            query = query.eq('id', identifier);
        } else {
            query = query.eq('cpf', identifier);
        }

        const { error } = await query;

        if (error) throw error;

        // Atualiza a interface
        if (novoStatus === 'pago') {
            statusText.textContent = 'Pago';
            statusText.style.color = '#10b981';
        } else {
            statusText.textContent = 'Pendente';
            statusText.style.color = 'var(--text-muted)';
        }

    } catch (error) {
        console.error('Erro ao atualizar pagamento:', error);
        alert('Erro ao atualizar o status de pagamento no banco de dados.');
        checkbox.checked = !checkbox.checked;
    } finally {
        checkbox.disabled = false;
    }
}
