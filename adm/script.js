// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis para armazenar os dados globais
let dadosDia1 = [];
let dadosDia2 = [];
let dadosUsuariosFull = [];

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
    tbodyUsuarios.innerHTML = '<tr><td colspan="7" class="loading-text">Buscando dados no servidor...</td></tr>';
    
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
            tbodyUsuarios.innerHTML = '<tr><td colspan="7" class="loading-text">Nenhum usuário cadastrado encontrado.</td></tr>';
            document.getElementById('contador-usuarios').textContent = 'Total: 0';
            return;
        }
        
        dadosUsuariosFull = data;
        document.getElementById('contador-usuarios').textContent = `Total: ${data.length}`;
        
        data.forEach(user => {
            const tr = document.createElement('tr');
            
            const nome = user.fullname || '-';
            const telefone = user.numberphone || '-';
            
            // Tratamento CPF/CNPJ
            let docStr = user.cpf ? String(user.cpf) : '';
            let digits = docStr.replace(/\D/g, '');
            let cpfVal = '-';
            let cnpjVal = '-';

            if (digits.length === 11) {
                cpfVal = docStr;
            } else if (digits.length === 14) {
                cnpjVal = docStr;
            } else if (digits.length > 0 && digits.length < 11) {
                cpfVal = `${docStr} (CPF INCOMPLETO)`;
            } else if (digits.length > 11 && digits.length < 14) {
                cnpjVal = `${docStr} (CNPJ INCOMPLETO)`;
            } else if (digits.length > 14) {
                cnpjVal = docStr;
            }

            const cidade = user.city || '-';
            const estado = user.uf || '-';
            
            const isPago = user.pagamento && user.pagamento.toLowerCase() === 'pago';
            const userId = user.id || user.cpf;

            tr.innerHTML = `
                <td><strong>${nome}</strong></td>
                <td>${telefone}</td>
                <td>${cpfVal}</td>
                <td>${cnpjVal}</td>
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
        tbodyUsuarios.innerHTML = '<tr><td colspan="7" class="loading-text" style="color: var(--red-vivid);">Ocorreu um erro ao buscar os usuários. Tente novamente.</td></tr>';
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

// ==========================================
// EXPORTAÇÃO DOS USUÁRIOS CADASTRADOS
// ==========================================
document.getElementById('btn-export-usuarios').addEventListener('click', () => {
    if (!dadosUsuariosFull || dadosUsuariosFull.length === 0) {
        alert("Não há dados de usuários para baixar.");
        return;
    }

    const formato = prompt("Qual formato deseja baixar? (pdf, csv ou txt)");
    if (!formato) return;

    const tipo = formato.trim().toLowerCase();
    
    if (tipo === 'pdf' || tipo === 'csv' || tipo === 'txt') {
        baixarDadosUsuarios(tipo);
    } else {
        alert("Formato inválido. Escolha pdf, csv ou txt.");
    }
});

function organizarDadosUsuariosParaExportacao() {
    return dadosUsuariosFull.map(user => {
        const nome = user.fullname || '-';
        const telefone = user.numberphone || '-';
        
        let docStr = user.cpf ? String(user.cpf) : '';
        let digits = docStr.replace(/\D/g, '');
        let cpfVal = '-';
        let cnpjVal = '-';

        if (digits.length === 11) {
            cpfVal = docStr;
        } else if (digits.length === 14) {
            cnpjVal = docStr;
        } else if (digits.length > 0 && digits.length < 11) {
            cpfVal = `${docStr} (CPF INCOMPLETO)`;
        } else if (digits.length > 11 && digits.length < 14) {
            cnpjVal = `${docStr} (CNPJ INCOMPLETO)`;
        } else if (digits.length > 14) {
            cnpjVal = docStr;
        }

        const cidade = user.city || '-';
        const estado = user.uf || '-';
        const status = (user.pagamento && user.pagamento.toLowerCase() === 'pago') ? 'Pago' : 'Pendente';

        return [nome, telefone, cpfVal, cnpjVal, cidade, estado, status];
    });
}

function baixarDadosUsuarios(formato) {
    const bodyData = organizarDadosUsuariosParaExportacao();
    const head = ['Nome completo', 'Telefone', 'CPF', 'CNPJ', 'Cidade', 'UF', 'Status Pagamento'];

    if (formato === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(16);
        doc.setTextColor(230, 0, 0);
        doc.text("Relatório de Usuários Cadastrados - Natal Hair 2026", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Total: ${bodyData.length} | Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

        doc.autoTable({
            startY: 35,
            head: [head],
            body: bodyData,
            theme: 'striped',
            headStyles: { fillColor: [230, 0, 0] },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        doc.save('Usuarios_NatalHair.pdf');

    } else if (formato === 'csv') {
        let csvContent = head.join(";") + "\n";
        bodyData.forEach(row => {
            csvContent += row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(";") + "\n";
        });
        
        // \uFEFF é o BOM para forçar o Excel a ler os caracteres (acentos) corretamente
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Usuarios_NatalHair.csv";
        link.click();
        URL.revokeObjectURL(url);

    } else if (formato === 'txt') {
        let txtContent = "RELATÓRIO DE USUÁRIOS CADASTRADOS - NATAL HAIR 2026\n";
        txtContent += `Total de registros: ${bodyData.length} | Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
        txtContent += "=".repeat(80) + "\n\n";

        bodyData.forEach(row => {
            txtContent += `Nome: ${row[0]}\n`;
            txtContent += `Telefone: ${row[1]}\n`;
            txtContent += `CPF: ${row[2]}\n`;
            txtContent += `CNPJ: ${row[3]}\n`;
            txtContent += `Cidade/UF: ${row[4]} - ${row[5]}\n`;
            txtContent += `Status Pagamento: ${row[6]}\n`;
            txtContent += "-".repeat(50) + "\n";
        });

        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Usuarios_NatalHair.txt";
        link.click();
        URL.revokeObjectURL(url);
    }
}
