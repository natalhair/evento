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
// BUSCA E RENDERIZAÇÃO - CHECK-INS
// ==========================================
async function carregarDados() {
    try {
        // Busca os dados do Dia 1
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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(230, 0, 0); 
    doc.text("Natal Hair 2026", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(titulo, 14, 28);
    doc.text(`Total de registros: ${dados.length}`, 14, 34);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 40);

    const bodyData = dados.map(item => {
        const nomeUsuario = (item.users && item.users.fullname) ? item.users.fullname : (item.name || 'Nome não identificado');
        return [
            nomeUsuario, 
            formatarDataHora(item.created_at)
        ];
    });

    doc.autoTable({
        startY: 45,
        head: [['Nome do Participante', 'Data e Hora do Check-in']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [230, 0, 0] },
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(nomeArquivo);
}

// ==========================================
// MODAL - USUÁRIOS CADASTRADOS
// ==========================================
const btnUsuarios = document.getElementById('btn-usuarios');
const modalUsuarios = document.getElementById('modal-usuarios');
const closeModal = document.getElementById('close-modal');
const tbodyUsuarios = document.getElementById('tbody-usuarios');
const totalUsuarios = document.getElementById('total-usuarios');

// Abrir modal e carregar
btnUsuarios.addEventListener('click', () => {
    modalUsuarios.style.display = 'block';
    carregarUsuarios();
});

// Fechar pelo botão X
closeModal.addEventListener('click', () => {
    modalUsuarios.style.display = 'none';
});

// Fechar ao clicar fora da janela
window.addEventListener('click', (event) => {
    if (event.target === modalUsuarios) {
        modalUsuarios.style.display = 'none';
    }
});

// Função para buscar e renderizar a tabela principal de Users
async function carregarUsuarios() {
    tbodyUsuarios.innerHTML = '<tr><td colspan="3" class="loading-text">Buscando usuários no banco de dados...</td></tr>';
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Atualiza contagem
        totalUsuarios.textContent = data.length;
        tbodyUsuarios.innerHTML = '';

        if (data.length === 0) {
            tbodyUsuarios.innerHTML = '<tr><td colspan="3" class="loading-text">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        // Renderiza cada linha
        data.forEach(user => {
            const tr = document.createElement('tr');
            
            // Tratamento caso a coluna não venha como esperado. 
            // Substitua 'email' se a coluna no supabase tiver outro nome.
            const nome = user.fullname || user.name || 'Sem nome';
            const email = user.email || 'Sem e-mail';
            const dataCad = formatarDataHora(user.created_at);

            tr.innerHTML = `
                <td><strong>${nome}</strong></td>
                <td>${email}</td>
                <td>${dataCad}</td>
            `;
            tbodyUsuarios.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        tbodyUsuarios.innerHTML = '<tr><td colspan="3" class="loading-text" style="color: var(--red-vivid);">Falha ao carregar lista de usuários.</td></tr>';
    }
}
