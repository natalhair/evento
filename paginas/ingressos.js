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

// Helper: Redireciona para o WhatsApp em caso de erro com mensagem detalhada
function redirectErrorToWhatsApp(contexto, detalheErro) {
    const mensagem = `Olá Micael, um cliente enfrentou um erro no sistema de ingressos.\n\n*Contexto do erro:* ${contexto}\n*Detalhe técnico:* ${detalheErro}`;
    const whatsappUrl = `https://wa.me/5584991000682?text=${encodeURIComponent(mensagem)}`;
    
    alert('Ocorreu um erro inesperado no sistema. Você será redirecionado para o nosso suporte no WhatsApp para resolvermos isso na hora.');
    window.location.href = whatsappUrl;
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

            if (data) {
                isExistingUser = true;

                // --- INÍCIO DA NOVA LÓGICA DE EXIBIÇÃO AUTOMÁTICA DE INGRESSO ---
                // Verifica se já tem ingresso preenchido OU se o pagamento consta como "pago"
                if (data.ingresso || data.pagamento === 'pago') {
                    let finalTicketCode = data.ingresso;

                    // Se não tiver código de ingresso gerado, mas estiver "pago", gera e salva
                    if (!data.ingresso && data.pagamento === 'pago') {
                        finalTicketCode = generateTicketCode();
                        const { error: updateError } = await supabaseClient
                            .from('users')
                            .update({ ingresso: finalTicketCode })
                            .eq('cpf', cleanCpf);
                        
                        if (updateError) {
                            console.error('Erro ao gerar ingresso automático:', updateError);
                            redirectErrorToWhatsApp('Geração automática de ingresso na busca por CPF', JSON.stringify(updateError));
                            return;
                        }
                    }

                    // Prepara a interface para mostrar o ingresso diretamente
                    cpfStatusMsg.className = 'status-msg success';
                    cpfStatusMsg.textContent = 'Pagamento identificado! Carregando seu ingresso...';
                    
                    // Oculta os formulários/banners e exibe o cartão do ingresso
                    if (checkoutFormContainer) checkoutFormContainer.classList.add('hidden');
                    if (userDetailsFields) userDetailsFields.classList.add('hidden');
                    if (pendingBanner) pendingBanner.classList.add('hidden');
                    ticketResultCard.classList.remove('hidden');

                    // Preenche as informações do ingresso
                    document.getElementById('ticket-user-name').textContent = data.fullname || 'Cliente';
                    document.getElementById('ticket-user-cpf').textContent = cleanCpf;
                    document.getElementById('ticket-code-display').textContent = finalTicketCode;

                    // Gera o QR Code com o CPF puro
                    const qrContainer = document.getElementById('qrcode-container');
                    qrContainer.innerHTML = ''; 
                    new QRCode(qrContainer, {
                        text: cleanCpf,
                        width: 140,
                        height: 140,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });

                    // Retorna para encerrar a função e não exibir os campos de checkout
                    return; 
                }
                // --- FIM DA NOVA LÓGICA ---

                // Se o usuário existe, mas AINDA NÃO pagou -> Mostra campos e bloqueia edição
                userDetailsFields.classList.remove('hidden');
                
                fullnameInput.value = data.fullname || '';
                numberphoneInput.value = data.numberphone || '';
                cityInput.value = data.city || '';
                ufInput.value = data.uf || '';

                fullnameInput.readOnly = true;
                numberphoneInput.readOnly = true;
                cityInput.readOnly = true;
                ufInput.readOnly = true;

                cpfStatusMsg.className = 'status-msg success';
                cpfStatusMsg.textContent = 'Cadastro encontrado! Prossiga com o pagamento.';
            } else {
                // Usuário Não Existe -> Limpa, exibe e habilita campos
                isExistingUser = false;
                userDetailsFields.classList.remove('hidden');

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
        // Gera o código do ingresso agora, logo no início
        const ticketCode = generateTicketCode();
        const checkoutTime = Date.now();

        // Se for um novo usuário, cadastra no banco de dados JÁ com o ingresso
        if (!isExistingUser) {
            const { error } = await supabaseClient
                .from('users')
                .insert([
                    { cpf: cleanCpf, fullname, numberphone, city, uf, ingresso: ticketCode }
                ]);

            if (error) {
                console.error('Erro ao salvar usuário:', error);
                redirectErrorToWhatsApp('Salvar novo usuário no banco de dados', JSON.stringify(error));
                return;
            }
        } else {
            // Se o usuário já existe, atualiza a linha dele para garantir que o ingresso fique salvo
            const { error } = await supabaseClient
                .from('users')
                .update({ ingresso: ticketCode })
                .eq('cpf', cleanCpf);
            
            if (error) {
                console.error('Erro ao atualizar ingresso na planilha:', error);
                redirectErrorToWhatsApp('Atualizar ingresso no banco de dados', JSON.stringify(error));
                return;
            }
        }

        // Guarda no cache (localStorage) para quando a página for recarregada após o pagamento
        localStorage.setItem('pending_cpf', cleanCpf);
        localStorage.setItem('pending_ticket_code', ticketCode);
        localStorage.setItem('checkout_timestamp', checkoutTime);
        localStorage.setItem('user_fullname', fullname);

        // Payload para criar o link via API da InfinitePay
        const payloadInfinitePay = {
            handle: "fafa_medeiros_",
            items: [
                {
                    description: "Ingresso NatalHair 2026",
                    quantity: 1,
                    price: 2500
                }
            ],
            order_nsu: cleanCpf,
            webhook_url: "https://viwjlxtxhpjlrijpnjcl.supabase.co/functions/v1/super-responder",
            redirect_url: "https://natalhair.github.io/evento/paginas/ingressos.html"
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
            throw new Error(`Erro API InfinitePay HTTP: ${response.status}`);
        }

        const data = await response.json();
        let checkoutUrl = data.url || data.link || (data.data && data.data.url);

        if (checkoutUrl) {
            // Redireciona para o checkout gerado corretamente pela API
            window.location.href = checkoutUrl;
        } else {
            console.error("Resposta da InfinitePay sem URL:", data);
            redirectErrorToWhatsApp('Retorno da InfinitePay', 'Link de checkout ausente no payload retornado');
        }

    } catch (err) {
        console.error('Erro na operação:', err);
        redirectErrorToWhatsApp('Geração do pagamento / Requisição Fetch', err.message || err);
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
    const userFullname = localStorage.getItem('user_fullname') || 'Cliente';

    if (!pendingCpf) return;

    try {
        const originalBtnText = btnShowTicket.innerText;
        btnShowTicket.disabled = true;
        btnShowTicket.innerText = 'Verificando pagamento...';

        // === VERIFICAÇÃO DE PAGAMENTO E LEITURA DO INGRESSO ===
        const { data: userData, error: checkError } = await supabaseClient
            .from('users')
            .select('pagamento, ingresso')
            .eq('cpf', pendingCpf)
            .maybeSingle();

        if (checkError) {
            console.error('Erro ao checar status do pagamento:', checkError);
            redirectErrorToWhatsApp('Consulta de pagamento no banco de dados', JSON.stringify(checkError));
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

        // Usa o ingresso do banco de dados, com fallback para o cache se necessário
        const finalTicketCode = userData.ingresso || localStorage.getItem('pending_ticket_code');

        // Exibe o Card do Ingresso e esconde o Banner
        pendingBanner.classList.add('hidden');
        ticketResultCard.classList.remove('hidden');

        document.getElementById('ticket-user-name').textContent = userFullname;
        document.getElementById('ticket-user-cpf').textContent = pendingCpf;
        document.getElementById('ticket-code-display').textContent = finalTicketCode;

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
        redirectErrorToWhatsApp('Renderização do ingresso final na tela', err.message || err);
    }
});

// Reference do botão de download do QR Code
const btnDownloadQr = document.getElementById('btn-download-qr');

btnDownloadQr.addEventListener('click', () => {
    const qrContainer = document.getElementById('qrcode-container');
    const qrImg = qrContainer.querySelector('img');
    const qrCanvas = qrContainer.querySelector('canvas');

    let qrDataUrl = '';
    
    // Assegura captura correta baseado em como o qrcode.js renderiza na DOM
    if (qrImg && qrImg.src && qrImg.src.startsWith('data:image')) {
        qrDataUrl = qrImg.src;
    } else if (qrCanvas) {
        qrDataUrl = qrCanvas.toDataURL('image/png');
    } else {
        alert('QR Code ainda não gerado.');
        return;
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

    // 3. Escreve o texto "Ingresso natalhair 2026" em PRETO
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ingresso natalhair 2026', canvasWidth / 2, 60);

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
