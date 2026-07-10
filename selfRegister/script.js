// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';

// Mudamos o nome de 'supabase' para 'supabaseClient' para evitar conflito com o CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const form = document.getElementById('register-form');
const sectionForm = document.getElementById('registration-section');
const sectionSuccess = document.getElementById('success-section');
const submitBtn = document.getElementById('submit-btn');
const downloadBtn = document.getElementById('download-btn');
const qrcodeDiv = document.getElementById('qrcode');

if (!form || !submitBtn) {
    console.error("Erro: Elementos do formulário não encontrados. Verifique os IDs no HTML.");
} else {
    // ==========================================
    // SUBMISSÃO DO FORMULÁRIO
    // ==========================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // Coleta dados (já corrigido para 'numberphone')
        const rawCpf = document.getElementById('cpf').value;
        const rawName = document.getElementById('fullname').value;
        const rawPhone = document.getElementById('numberphone').value; 
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
            return;
        }

        submitBtn.textContent = 'Processando...';
        submitBtn.disabled = true;

        try {
            // Usamos 'supabaseClient' em vez de 'supabase' aqui!
            const { data, error } = await supabaseClient
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

            gerarIngresso(cpf, rawName.trim(), city, uf);
            
        } catch (err) {
            console.error('Erro no banco:', err);
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
