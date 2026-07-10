// ==========================================
// CONFIGURAÇÕES
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRsyohH9YA6FFtXPNjVxIK0ATOUpJwmSFNGbsoPdJu0rNs1TGrCzYKnTfawEuG1L8qAA/exec'; // Coloque a URL do Code.gs aqui

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// LÓGICA DE DATAS E TABELAS
// ==========================================
let currentTable = "";
const today = new Date();

function setupDateAndTable() {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').textContent = today.toLocaleDateString('pt-BR', dateOptions);

    // Dia 24 de Agosto de 2026 à meia-noite
    const dia2Date = new Date('2026-08-24T00:00:00');

    if (today < dia2Date) {
        currentTable = "natalhair2026_dia_1";
    } else {
        currentTable = "natalhair2026_dia_2";
    }

    document.getElementById('current-table-display').textContent = `Registrando na tabela: ${currentTable}`;
}

// ==========================================
// AUTENTICAÇÃO (Google Sheets)
// ==========================================
document.getElementById('login-btn').addEventListener('click', async () => {
    const inputPass = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    
    if (!inputPass) return;

    btn.textContent = "Verificando...";
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();

        if (data.status === "success" && data.senha === inputPass) {
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.body.style.display = 'block'; // Remove centralização do login
            setupDateAndTable();
            loadCheckedInUsers();
        } else {
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "Erro de conexão com o servidor de senhas.";
        errorDiv.style.display = "block";
    }
    btn.textContent = "Entrar";
});

// ==========================================
// CARREGAR USUÁRIOS (Dashboard)
// ==========================================
async function loadCheckedInUsers() {
    const container = document.getElementById('cards-container');
    container.innerHTML = "<p>Carregando...</p>";

    // 1. Pega os CPFs que já fizeram check-in hoje
    const { data: checkins, error: errCheckin } = await supabaseClient.from(currentTable).select('cpfEvento');
    if (errCheckin || !checkins.length) {
        container.innerHTML = "<p>Nenhum check-in registrado hoje.</p>";
        return;
    }

    const cpfsList = checkins.map(c => c.cpfEvento);

    // 2. Busca os dados desses CPFs na tabela users
    const { data: users, error: errUsers } = await supabaseClient.from('users').select('*').in('cpf', cpfsList);
    if (errUsers) {
        container.innerHTML = "<p>Erro ao carregar dados dos usuários.</p>";
        return;
    }

    container.innerHTML = "";
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <strong>${user.fullname}</strong>
            <span>CPF/CNPJ: ${user.cpf}</span>
            <span>Tel: ${user.numberphone}</span>
            <span>${user.city} - ${user.uf}</span>
            <button class="reemit-btn" onclick="reemitirPDF('${user.cpf}', '${user.fullname}', '${user.city}', '${user.uf}')">Reemitir QRCode</button>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// LÓGICA DE CHECK-IN (Validação e Insert)
// ==========================================
async function processCheckIn(rawCode, isManual = false) {
    const feedback = document.getElementById(isManual ? 'manual-feedback' : 'scanner-feedback');
    const code = rawCode.replace(/\D/g, ''); // Limpa caracteres

    if (code.length !== 11 && code.length !== 14) {
        feedback.textContent = "Este QRcode não é válido.";
        feedback.style.color = "#ff4c4c";
        if (!isManual) setTimeout(resumeScanner, 2000);
        return;
    }

    feedback.style.color = "white";
    feedback.textContent = "Verificando no banco de dados...";

    // Verifica se já está no evento HOJE
    const { data: existing, error: errCheck } = await supabaseClient
        .from(currentTable)
        .select('cpfEvento')
        .eq('cpfEvento', code);

    if (existing && existing.length > 0) {
        feedback.textContent = "Este usuário já está no evento.";
        feedback.style.color = "#ffaa00"; // Laranja para aviso
        if (!isManual) setTimeout(resumeScanner, 2000);
        return;
    }

    // Registra Check-in
    const { error: errInsert } = await supabaseClient
        .from(currentTable)
        .insert([{ cpfEvento: code }]);

    if (errInsert) {
        feedback.textContent = "Erro ao registrar. Tente novamente.";
        feedback.style.color = "#ff4c4c";
        if (!isManual) setTimeout(resumeScanner, 2000);
    } else {
        feedback.textContent = "Check-in realizado com sucesso!";
        feedback.style.color = "#00ff00"; // Verde
        
        // Atualiza a lista no fundo
        loadCheckedInUsers();

        // Limpa e fecha modal após sucesso
        setTimeout(() => {
            if (isManual) {
                document.getElementById('manual-modal').classList.add('hidden');
                document.getElementById('manual-cpf').value = "";
            } else {
                document.getElementById('scanner-modal').classList.add('hidden');
                stopScanner();
            }
            feedback.textContent = "";
        }, 1500);
    }
}

// ==========================================
// EVENTOS DOS MODAIS E BOTÕES
// ==========================================
document.getElementById('open-scanner-btn').addEventListener('click', () => {
    document.getElementById('scanner-modal').classList.remove('hidden');
    document.getElementById('scanner-feedback').textContent = "";
    startScanner(processCheckIn);
});

document.getElementById('close-scanner-btn').addEventListener('click', () => {
    document.getElementById('scanner-modal').classList.add('hidden');
    stopScanner();
});

document.getElementById('manual-entry-btn').addEventListener('click', () => {
    document.getElementById('scanner-modal').classList.add('hidden');
    stopScanner();
    document.getElementById('manual-modal').classList.remove('hidden');
    document.getElementById('manual-feedback').textContent = "";
});

document.getElementById('close-manual-btn').addEventListener('click', () => {
    document.getElementById('manual-modal').classList.add('hidden');
});

document.getElementById('submit-manual-btn').addEventListener('click', () => {
    const cpfInput = document.getElementById('manual-cpf').value;
    processCheckIn(cpfInput, true);
});

// ==========================================
// REEMITIR PDF
// ==========================================
function reemitirPDF(documento, nome, cidade, estado) {
    const qrDiv = document.getElementById('hidden-qrcode');
    qrDiv.innerHTML = ""; // Limpa anterior
    
    // Gera QR temporário na div oculta
    new QRCode(qrDiv, {
        text: documento,
        width: 200, height: 200,
        colorDark : "#000000", colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Aguarda geração da imagem no DOM
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFillColor(0, 0, 0); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("INGRESSO VIRTUAL - REEMISSÃO", 105, 25, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Nome: ${nome}`, 20, 60);
        doc.text(`Documento: ${documento}`, 20, 70);
        doc.text(`Origem: ${cidade} - ${estado}`, 20, 80);

        const qrCanvas = qrDiv.querySelector('canvas');
        if (qrCanvas) {
            const qrDataUrl = qrCanvas.toDataURL('image/png');
            doc.addImage(qrDataUrl, 'PNG', 65, 100, 80, 80);
        }

        doc.save(`Reemissao_${documento}.pdf`);
    }, 300);
}
