// Substitua pela URL da implantação do seu Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwlCWx_sh6UvRiJhnwjy5wQ_ssdArmj7dFti8Enng_008slkXOFEGzBhZfgtLoxoFIG8A/exec";

// Credenciais e URL do Supabase
const SUPABASE_URL = "https://viwjlxtxhpjlrijpnjcl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2hXR0A_7bJp6qyGAtD5aLw_oFufu2Lq";

document.addEventListener("DOMContentLoaded", () => {
    const inputImg = document.getElementById("input-img");
    const hiddenImgUrl = document.getElementById("img-url");
    const previewContainer = document.getElementById("preview-container");
    const imgPreview = document.getElementById("img-preview");
    const uploadStatus = document.getElementById("upload-status");
    const form = document.getElementById("embaixadora-form");
    const btnSubmit = document.getElementById("btn-submit");
    const formMensagem = document.getElementById("form-mensagem");

    // Upload automático da imagem para o Google Drive ao selecionar o arquivo
    inputImg.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadStatus.textContent = "Enviando imagem para o Drive...";
        uploadStatus.style.color = "#d97706";
        previewContainer.style.display = "flex";

        try {
            const base64Data = await converterArquivoParaBase64(file);
            
            const payload = {
                fileName: file.name,
                mimeType: file.type,
                base64Data: base64Data
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === "success") {
                hiddenImgUrl.value = result.url;
                imgPreview.src = result.url;
                uploadStatus.textContent = "Imagem carregada com sucesso!";
                uploadStatus.style.color = "#16a34a";
            } else {
                throw new Error(result.message || "Erro no upload.");
            }
        } catch (error) {
            console.error(error);
            uploadStatus.textContent = "Erro ao enviar imagem. Tente novamente.";
            uploadStatus.style.color = "#dc2626";
            hiddenImgUrl.value = "";
        }
    });

    // Envio do formulário completo para a tabela 'embaixadoras' no Supabase
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!hiddenImgUrl.value) {
            formMensagem.textContent = "Por favor, aguarde o upload da imagem ser concluído.";
            formMensagem.style.color = "#dc2626";
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Enviando...";
        formMensagem.textContent = "";

        const dadosForm = {
            nome: document.getElementById("nome").value.trim(),
            cidade: document.getElementById("cidade").value.trim(),
            uf: document.getElementById("uf").value.trim().toUpperCase(),
            cpf_cnpj: document.getElementById("cpf_cnpj").value.trim(),
            historia: document.getElementById("historia").value.trim(),
            img: hiddenImgUrl.value
        };

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/embaixadoras`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(dadosForm)
            });

            if (!response.ok) {
                throw new Error("Erro ao salvar os dados no Supabase.");
            }

            formMensagem.textContent = "Cadastro realizado com sucesso! Em breve entraremos em contato.";
            formMensagem.style.color = "#16a34a";
            form.reset();
            previewContainer.style.display = "none";
            hiddenImgUrl.value = "";

        } catch (error) {
            console.error(error);
            formMensagem.textContent = "Ocorreu um erro ao enviar. Tente novamente.";
            formMensagem.style.color = "#dc2626";
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Cadastro";
        }
    });
});

function converterArquivoParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
