// 1. Inicialização do Supabase Client
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da DOM
const cpfInput = document.getElementById('cpf');
const cpfStatusMsg = document.getElementById('cpf-status-msg');
const userDetailsFields = document.getElementById('user-details-fields');
const fullnameInput = document.getElementById('fullname');
const numberphoneInput = document.getElementById('numberphone');
const cityInput = document.getElementById('city');
const ufInput = document.getElementById('uf');
const btnPay = document.getElementById('btn-pay');

const pendingBanner = document.getElementById('pending-ticket-banner');
const btnShowTicket = document.getElementById('btn-show-ticket');
const checkoutFormContainer = document.getElementById('checkout-form-container');
const ticketResultCard = document.getElementById('ticket-result-card');

let isExistingUser = false;

// Helper: Limpa caracteres não numéricos
function cleanDocument(doc) {
    return doc.replace(/\D/g, '');
}

// Helper: Gera código aleatório de letras e números (Ex: NH2026-X8A9)
function generateTicketCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NH';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 2. Event Listener de verificação do CPF ao digitar
cpfInput.addEventListener('input', async (e) => {
    const rawValue = e.target.value;
    const cleanCpf = cleanDocument(rawValue);

    // Dispara a busca quando atingir tamanho de CPF (11) ou CNPJ (14)
    if (cleanCpf.length === 11 || cleanCpf.length === 14) {
        cpfStatusMsg.className = 'status-msg info';
        cpfStatusMsg.textContent = 'Buscando cadastro...';

        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('cpf', cleanCpf)
                .maybeSingle();

            if (error) throw error;

            userDetailsFields.classList.remove('hidden');

            if (data) {
                // Usuário Existe -> Preenche e bloqueia edição
                isExistingUser = true;
                fullnameInput.value = data.fullname || '';
                numberphoneInput.value = data.numberphone || '';
                cityInput.value = data.city || '';
                ufInput.value = data.uf || '';

                fullnameInput.readOnly = true;
                numberphoneInput.readOnly = true;
                cityInput.readOnly = true;
                ufInput.readOnly = true;

                cpfStatusMsg.className = 'status-msg success';
                cpfStatusMsg.textContent = 'Cadastro encontrado! Verifique seus dados.';
            } else {
                // Usuário Não Existe -> Limpa e habilita campos
                isExistingUser = false;
                fullnameInput.value = '';
                numberphoneInput.value = '';
                cityInput.value = '';
                ufInput.value = '';

                fullnameInput.readOnly = false;
                numberphoneInput.readOnly = false;
                cityInput.readOnly = false;
                ufInput.readOnly = false;

                cpfStatusMsg.className = 'status-msg info';
                cpfStatusMsg.textContent = 'Preencha seus dados para prosseguir.';
            }
        } catch (err) {
            console.error('Erro ao consultar Supabase:', err);
            cpfStatusMsg.textContent = 'Erro ao consultar banco de dados.';
        }
    } else {
        userDetailsFields.classList.add('hidden');
        cpfStatusMsg.textContent = '';
    }
});

// 3. Ação do Botão "Finalizar Pagamento"
btnPay.addEventListener('click', async () => {
    const cleanCpf = cleanDocument(cpfInput.value);
    const fullname = fullnameInput.value.trim();
    const numberphone = numberphoneInput.value.trim();
    const city = cityInput.value.trim();
    const uf = ufInput.value.trim();

    if (!cleanCpf || !fullname || !numberphone || !city || !uf) {
        alert('Por favor, preencha todos os campos antes de continuar.');
        return;
    }

    try {
        // Se for um novo usuário, cadastra no banco de dados
        if (!isExistingUser) {
            const { error } = await supabaseClient
                .from('users')
                .insert([
                    { cpf: cleanCpf, fullname, numberphone, city, uf }
                ]);

            if (error) {
                console.error('Erro ao salvar usuário:', error);
                alert('Erro ao registrar seus dados. Tente novamente.');
                return;
            }
        }

        // Gera o código do ingresso e guarda no cache (localStorage)
        const ticketCode = generateTicketCode();
        const checkoutTime = Date.now();

        localStorage.setItem('pending_cpf', cleanCpf);
        localStorage.setItem('pending_ticket_code', ticketCode);
        localStorage.setItem('checkout_timestamp', checkoutTime);
        localStorage.setItem('user_fullname', fullname);

        // Payload para criar o link via API da InfinitePay (mantendo o webhook_url)
        const payloadInfinitePay = {
            handle: "audaces",
            items: [
                {
                    description: "Ingresso NatalHair 2026",
                    quantity: 1,
                    price: 2500
                }
            ],
            order_nsu: cleanCpf,
            webhook_url: "https://viwjlxtxhpjlrijpnjcl.supabase.co/functions/v1/super-responder"
        };

        const originalText = btnPay.innerText;
        btnPay.innerText = "Gerando pagamento...";
        btnPay.disabled = true;

        const response = await fetch('https://api.checkout.infinitepay.io/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadInfinitePay)
        });

        if (!response.ok) {
            throw new Error(`Erro na API InfinitePay: ${response.status}`);
        }

        const data = await response.json();
        let checkoutUrl = data.url || data.link || (data.data && data.data.url);

        if (checkoutUrl) {
            // Insere manualmente o redirect_url correto com a pasta 'paginas' no final do link retornado
            checkoutUrl += '&redirect_url=https://natalhair.github.io/evento/paginas/ingressos.html';

            // Redireciona para o checkout ajustado
            window.location.href = checkoutUrl;
        } else {
            console.error("Resposta da InfinitePay sem URL:", data);
            alert("Erro ao ler o link de pagamento gerado. Verifique o console.");
            btnPay.innerText = originalText;
            btnPay.disabled = false;
        }

    } catch (err) {
        console.error('Erro na operação:', err);
        alert('Erro de conexão ao gerar o pagamento. Verifique seu console.');
        btnPay.innerText = "Finalizar Pagamento";
        btnPay.disabled = false;
    }
});

// 4. Checagem ao carregar a página (Verificação de retorno do InfinitePay)
window.addEventListener('DOMContentLoaded', () => {
    const pendingCpf = localStorage.getItem('pending_cpf');
    const pendingTicketCode = localStorage.getItem('pending_ticket_code');
    const checkoutTimestamp = localStorage.getItem('checkout_timestamp');

    if (pendingCpf && pendingTicketCode && checkoutTimestamp) {
        const timeElapsed = Date.now() - parseInt(checkoutTimestamp, 10);
        const ONE_MINUTE_MS = 60000; // 1 minuto em ms

        // Se passou 1 minuto ou mais desde a ida ao checkout
        if (timeElapsed >= ONE_MINUTE_MS) {
            checkoutFormContainer.classList.add('hidden');
            pendingBanner.classList.remove('hidden');
        }
    }
});

// 5. Clique em "VER MEU INGRESSO"
btnShowTicket.addEventListener('click', async () => {
    const pendingCpf = localStorage.getItem('pending_cpf');
    const pendingTicketCode = localStorage.getItem('pending_ticket_code');
    const userFullname = localStorage.getItem('user_fullname') || 'Cliente';

    if (!pendingCpf || !pendingTicketCode) return;

    try {
        const originalBtnText = btnShowTicket.innerText;
        btnShowTicket.disabled = true;
        btnShowTicket.innerText = 'Verificando pagamento...';

        // === VERIFICAÇÃO DE PAGAMENTO ===
        const { data: userData, error: checkError } = await supabaseClient
            .from('users')
            .select('pagamento')
            .eq('cpf', pendingCpf)
            .maybeSingle();

        if (checkError) {
            console.error('Erro ao checar status do pagamento:', checkError);
            alert('Erro ao conectar com o banco de dados. Tente novamente.');
            btnShowTicket.disabled = false;
            btnShowTicket.innerText = originalBtnText;
            return;
        }

        // Se não for 'pago', barra a geração do ingresso e exibe aviso
        if (!userData || userData.pagamento !== 'pago') {
            alert('Seu pagamento ainda está sendo processado ou não foi aprovado. Por favor, aguarde mais alguns instantes e tente novamente.');
            btnShowTicket.disabled = false;
            btnShowTicket.innerText = originalBtnText;
            return; 
        }
        
        btnShowTicket.innerText = 'Gerando Ingresso...';

        // Atualiza a coluna "ingresso" na tabela users no Supabase
        const { error } = await supabaseClient
            .from('users')
            .update({ ingresso: pendingTicketCode })
            .eq('cpf', pendingCpf);

        if (error) {
            console.error('Erro ao salvar código do ingresso:', error);
            alert('Atenção: Houve um erro ao salvar o ingresso no banco, mas seu comprovante será exibido.');
        }

        // Exibe o Card do Ingresso e esconde o Banner
        pendingBanner.classList.add('hidden');
        ticketResultCard.classList.remove('hidden');

        document.getElementById('ticket-user-name').textContent = userFullname;
        document.getElementById('ticket-user-cpf').textContent = pendingCpf;
        document.getElementById('ticket-code-display').textContent = pendingTicketCode;

        // Gera o QR Code com a informação exclusiva do CPF puro (11 ou 14 dígitos)
        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = ''; 
        new QRCode(qrContainer, {
            text: pendingCpf,
            width: 140,
            height: 140,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Limpa o cache temporário do checkout
        localStorage.removeItem('pending_cpf');
        localStorage.removeItem('pending_ticket_code');
        localStorage.removeItem('checkout_timestamp');

    } catch (err) {
        console.error('Erro ao gerar ingresso final:', err);
    }
});

// Reference do botão de download do QR Code
const btnDownloadQr = document.getElementById('btn-download-qr');

btnDownloadQr.addEventListener('click', () => {
    const qrContainer = document.getElementById('qrcode-container');
    const qrElement = qrContainer.querySelector('img') || qrContainer.querySelector('canvas');

    if (!qrElement) {
        alert('QR Code ainda não gerado.');
        return;
    }

    // Obtém o DataURL do QR Code
    let qrDataUrl = '';
    if (qrElement.tagName.toLowerCase() === 'img') {
        qrDataUrl = qrElement.src;
    } else {
        qrDataUrl = qrElement.toDataURL('image/png');
    }

    // Cria um Canvas invisível em memória para desenhar o PNG final
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const canvasWidth = 400;
    const canvasHeight = 480;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 1. Preenche fundo BRANCO
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Desenha a moldura PRETA externa
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, canvasWidth - 24, canvasHeight - 24);

    // 3. Escreve o texto "Ingresso NatalHair 2026" em PRETO
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ingresso NatalHair 2026', canvasWidth / 2, 60);

    // 4. Desenha o QR Code centralizado abaixo do texto
    const img = new Image();
    img.onload = () => {
        const qrSize = 280;
        const qrX = (canvasWidth - qrSize) / 2;
        const qrY = 95;

        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // 5. Gera e dispara o download do arquivo PNG
        const link = document.createElement('a');
        link.download = 'Ingresso-NatalHair-2026.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.src = qrDataUrl;
});
