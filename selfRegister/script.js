// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';

let supabase; // ÚNICA declaração da variável no arquivo inteiro

try {
    if (!window.supabase) {
        throw new Error("A biblioteca do Supabase não foi carregada pelo CDN no HTML.");
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase inicializado com sucesso!");
} catch (error) {
    console.error("Erro crítico na inicialização:", error);
    alert("Erro de configuração: " + error.message);
}

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const form = document.getElementById('register-form');
const sectionForm = document.getElementById('registration-section');
const sectionSuccess = document.getElementById('success-section');
const submitBtn = document.getElementById('submit-btn');
const downloadBtn = document.getElementById('download-btn');
const qrcodeDiv = document.getElementById('qrcode');

// Valida se os elementos existem antes de rodar o código
if (!form || !submitBtn) {
    console.error("Erro: Elementos do formulário não foram encontrados no DOM. Verifique os IDs no HTML.");
} else {
    // ==========================================
    // SUBMISSÃO DO FORMULÁRIO
    // ==========================================
    form.addEventListener('submit', async (e) => {
        // INTERCEPTA O RECARREGAMENTO DA PÁGINA (Precisa ser a 1ª linha)
        e.preventDefault(); 
        console.log("Formulário interceptado. Iniciando validações...");

        if (!supabase) {
            alert("Não é possível cadastrar: O cliente do Supabase falhou.");
            return;
        }
        
        // Coleta dados
        const rawCpf = document.getElementById('cpf').value;
        const rawName = document.getElementById('fullname').value;
        const rawPhone = document.getElementById('phone').value;
        const city = document.getElementById('city').value.trim();
        const uf = document.getElementById('uf').value;

        // Limpeza de strings
        const cpf = rawCpf.replace(/\D/g, '');
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const finalPhone = `+55${phoneDigits}`;

        // Validações
        const isDocValid = (cpf.length === 11 || cpf.length === 14);
        const isNameValid = rawName.trim().split(/\s+/).length >= 2 && rawName.trim().split(/\s+/).every(w => w.length >= 3);
        const isPhoneValid = (phoneDigits.length === 11 && phoneDigits.charAt(2) === '9');

        // Exibe/Oculta erros na tela
        document.getElementById('error-cpf').style.display = !isDocValid ? 'block' : 'none';
        document.getElementById('error-name').style.display = !isNameValid ? 'block' : 'none';
        document.getElementById('error-phone').style.display = !isPhoneValid ? 'block' : 'none';
        document.getElementById('global-error').style.display = 'none';

        if (!isDocValid || !isNameValid || !isPhoneValid) {
            console.warn("Validação falhou. Usuário precisa corrigir os campos.");
            return;
        }

        submitBtn.textContent = 'Processando...';
        submitBtn.disabled = true;

        try {
            console.log("Enviando para o Supabase...", { cpf, fullname: rawName.trim(), numberphone: finalPhone, city, uf });
            
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

            console.log("Salvo no banco com sucesso! Chamando gerador de ingresso...");
            gerarIngresso(cpf, rawName.trim(), city, uf);
            
        } catch (err) {
            console.error('Erro retornado pelo Supabase:', err);
            document.getElementById('global-error').textContent = `Erro: ${err.message || 'Verifique duplicidade de documento.'}`;
            document.getElementById('global-error').style.display = 'block';
            submitBtn.textContent = 'Realizar Cadastro';
            submitBtn.disabled = false;
        }
    });
}

// ==========================================
// GERAÇÃO DE QR CODE E INGRESSO PDF
// ==========================================
let qrCodeInstance = null;
let userDataStore = {};

function gerarIngresso(documento, nome, cidade, estado) {
    sectionForm.classList.add('hidden');
    sectionSuccess.classList.remove('hidden');

    userDataStore = { documento, nome, cidade, estado };

    qrcodeDiv.innerHTML = ""; 
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
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(0, 0, 0); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("INGRESSO VIRTUAL", 105, 25, { align: 'center' });
    doc.setFontSize(14);
    doc.text("Natal Hair 2026", 105, 34, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("Dados do Participante:", 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Nome: ${userDataStore.nome}`, 20, 75);
    doc.text(`Documento: ${userDataStore.documento}`, 20, 85);
    doc.text(`Origem: ${userDataStore.cidade} - ${userDataStore.estado}`, 20, 95);

    const qrCanvas = qrcodeDiv.querySelector('canvas');
    if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 65, 120, 80, 80);
        doc.text("Apresente este QR Code na entrada do evento.", 105, 210, { align: 'center' });
    }

    doc.save(`Ingresso_NatalHair_${userDataStore.documento}.pdf`);
});
