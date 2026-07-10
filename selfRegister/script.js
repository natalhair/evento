// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// Insira sua URL e Key da API (Project Settings -> API)
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';

// Inicializa o cliente do Supabase usando a biblioteca global do CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const form = document.getElementById('register-form');
const sectionForm = document.getElementById('registration-section');
const sectionSuccess = document.getElementById('success-section');
const submitBtn = document.getElementById('submit-btn');
const downloadBtn = document.getElementById('download-btn');
const qrcodeDiv = document.getElementById('qrcode');

// ==========================================
// FUNÇÕES DE VALIDAÇÃO
// ==========================================
function validateDocument(doc) {
    const cleanDoc = doc.replace(/\D/g, ''); // Remove tudo que não for número
    return cleanDoc.length === 11 || cleanDoc.length === 14;
}

function validateName(name) {
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return false;
    return words.every(word => word.length >= 3);
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Espera: 2 dígitos (DDD) + 9 (fixo) + 8 dígitos = 11 caracteres no total
    return cleanPhone.length === 11 && cleanPhone.charAt(2) === '9';
}

function showError(elementId, show) {
    const el = document.getElementById(elementId);
    el.style.display = show ? 'block' : 'none';
}

// ==========================================
// SUBMISSÃO DO FORMULÁRIO
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Coleta dados
    const rawCpf = document.getElementById('cpf').value;
    const rawName = document.getElementById('fullname').value;
    const rawPhone = document.getElementById('phone').value;
    const city = document.getElementById('city').value.trim();
    const uf = document.getElementById('uf').value;

    // Remove caracteres especiais para validação e salvamento
    const cpf = rawCpf.replace(/\D/g, '');
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const finalPhone = `+55${phoneDigits}`;

    // Validações
    const isDocValid = validateDocument(cpf);
    const isNameValid = validateName(rawName);
    const isPhoneValid = validatePhone(phoneDigits);

    showError('error-cpf', !isDocValid);
    showError('error-name', !isNameValid);
    showError('error-phone', !isPhoneValid);
    showError('global-error', false);

    if (!isDocValid || !isNameValid || !isPhoneValid) return;

    // Estado de carregamento
    submitBtn.textContent = 'Processando...';
    submitBtn.disabled = true;

    try {
        // Envio para o Supabase (Tabela: users)
        const { data, error } = await supabase
            .from('users')
            .insert([
                { 
                    cpf: cpf, 
                    fullname: rawName.trim(), 
                    numberphone: finalPhone, 
                    city: city, 
                    uf: uf 
                }
            ]);

        if (error) throw error;

        // Sucesso: Gera QRCode e exibe tela
        gerarIngresso(cpf, rawName.trim(), city, uf);
        
    } catch (err) {
        console.error('Erro Supabase:', err);
        document.getElementById('global-error').textContent = "Erro ao conectar. O documento já pode estar cadastrado.";
        showError('global-error', true);
        submitBtn.textContent = 'Realizar Cadastro';
        submitBtn.disabled = false;
    }
});

// ==========================================
// GERAÇÃO DE QR CODE E INGRESSO PDF
// ==========================================
let qrCodeInstance = null;
let userDataStore = {};

function gerarIngresso(documento, nome, cidade, estado) {
    // Esconde formulário, mostra sucesso
    sectionForm.classList.add('hidden');
    sectionSuccess.classList.remove('hidden');

    // Armazena dados para o PDF
    userDataStore = { documento, nome, cidade, estado };

    // Gera o QR Code
    qrcodeDiv.innerHTML = ""; // Limpa anterior se houver
    qrCodeInstance = new QRCode(qrcodeDiv, {
        text: documento,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

downloadBtn.addEventListener('click', () => {
    // Instancia o jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Estilização do PDF
    doc.setFillColor(0, 0, 0); // Fundo preto para o cabeçalho
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("INGRESSO VIRTUAL", 105, 25, { align: 'center' });
    doc.setFontSize(14);
    doc.text("Natal Hair 2026", 105, 34, { align: 'center' });

    // Dados do Usuário no PDF
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("Dados do Participante:", 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Nome: ${userDataStore.nome}`, 20, 75);
    doc.text(`Documento: ${userDataStore.documento}`, 20, 85);
    doc.text(`Origem: ${userDataStore.cidade} - ${userDataStore.estado}`, 20, 95);

    // Pega a imagem gerada pelo QRCode.js (que cria um canvas ou img)
    const qrCanvas = qrcodeDiv.querySelector('canvas');
    if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 65, 120, 80, 80);
        doc.text("Apresente este QR Code na entrada do evento.", 105, 210, { align: 'center' });
    }

    // Baixa o arquivo
    doc.save(`Ingresso_NatalHair_${userDataStore.documento}.pdf`);
});
