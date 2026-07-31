// 1. Inicialização do Supabase Client
const SUPABASE_URL = 'https://viwjlxtxhpjlrijpnjcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
            const { data, error } = await _supabase
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
            const { error } = await _supabase
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

        // Redireciona para o checkout do InfinitePay
        const infinitePayUrl = 'https://checkout.infinitepay.io/audaces?items=[{"name":"Ingresso%20NatalHair%202026","price":2500,"quantity":1}]&redirect_url=https://natalhair.github.io/evento/pages/ingressos.html';
        window.location.href = infinitePayUrl;

    } catch (err) {
        console.error('Erro na operação:', err);
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
        btnShowTicket.disabled = true;
        btnShowTicket.innerText = 'Gerando Ingresso...';

        // Atualiza a coluna "ingresso" na tabela users no Supabase
        const { error } = await _supabase
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
