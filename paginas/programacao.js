document.addEventListener("DOMContentLoaded", () => {
    carregarProgramacao();
    
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', gerarPDFProgramacao);
    }
});

let dadosProgramacaoGlobal = [];

async function carregarProgramacao() {
    const container = document.getElementById('programacao-content');

    try {
        const response = await fetch('../programacao.txt');
        if (!response.ok) throw new Error('Não foi possível carregar o arquivo de programação.');

        const texto = await response.text();
        dadosProgramacaoGlobal = processarTextoProgramacao(texto);
        
        renderizarTela(dadosProgramacaoGlobal, container);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align: center; color: red;">Erro ao carregar a programação. Tente novamente mais tarde.</p>`;
    }
}

function processarTextoProgramacao(texto) {
    const linhas = texto.split('\n');
    let dias = [];
    let diaAtual = null;
    let localAtual = null;

    linhas.forEach(linhaOriginal => {
        const linha = linhaOriginal.trim();
        if (!linha) return;

        if (linha.startsWith('[DIA]')) {
            diaAtual = {
                dia: linha.replace('[DIA]', '').trim(),
                locais: []
            };
            dias.push(diaAtual);
            localAtual = null;
        } else if (linha.startsWith('[LOCAL]')) {
            localAtual = {
                local: linha.replace('[LOCAL]', '').trim(),
                eventos: []
            };
            if (diaAtual) {
                diaAtual.locais.push(localAtual);
            }
        } else if (linha.includes('=')) {
            const partes = linha.split('=');
            const horario = partes[0].trim();
            const descricao = partes[1].trim();

            if (localAtual) {
                localAtual.eventos.push({ horario, descricao });
            }
        }
    });

    return dias;
}

function renderizarTela(dias, container) {
    container.innerHTML = '';

    dias.forEach(d => {
        const blocoDia = document.createElement('div');
        blocoDia.className = 'dia-bloco';

        const h2 = document.createElement('h2');
        h2.className = 'dia-titulo';
        h2.textContent = d.dia;
        blocoDia.appendChild(h2);

        d.locais.forEach(l => {
            const blocoLocal = document.createElement('div');
            blocoLocal.className = 'local-bloco';

            const h3 = document.createElement('div');
            h3.className = 'local-titulo';
            h3.textContent = l.local;
            blocoLocal.appendChild(h3);

            l.eventos.forEach(ev => {
                const item = document.createElement('div');
                item.className = 'evento-item';

                const horario = document.createElement('span');
                horario.className = 'evento-horario';
                horario.textContent = ev.horario;

                const desc = document.createElement('span');
                desc.className = 'evento-descricao';
                desc.textContent = ev.descricao;

                item.appendChild(horario);
                item.appendChild(desc);
                blocoLocal.appendChild(item);
            });

            blocoDia.appendChild(blocoLocal);
        });

        container.appendChild(blocoDia);
    });
}

// Função para gerar o PDF formatado
async function gerarPDFProgramacao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    let currentY = 15;

    // 1. Container Gradiente no Topo (Preto e Vermelho) com a Logo Branca
    // Desenhamos retângulos simulando o gradiente ou faixa elegante
    doc.setFillColor(15, 15, 15); // Fundo preto base
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Detalhe vermelho lateral ou barra
    doc.setFillColor(185, 28, 28);
    doc.rect(0, 33, pageWidth, 2, 'F');

    // Carrega a logo branca para colocar no topo do PDF
    try {
        const logoDataUrl = await carregarImagemComoBase64('../logo.png');
        if (logoDataUrl) {
            // Centraliza a logo no topo
            doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 25, 6, 50, 20);
        }
    } catch (e) {
        // Fallback caso a imagem falhe
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text("NATAL HAIR 2026", pageWidth / 2, 20, { align: 'center' });
    }

    currentY = 45;

    // Título do Documento
    doc.setTextColor(20, 20, 20);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text("Programação Oficial", pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;

    // Itera sobre os dados estruturados e escreve no PDF
    dadosProgramacaoGlobal.forEach(diaObj => {
        // Verifica quebra de página
        if (currentY > 260) {
            doc.addPage();
            currentY = 20;
        }

        // Título do Dia
        doc.setFillColor(185, 28, 28);
        doc.rect(15, currentY, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(diaObj.dia.toUpperCase(), 18, currentY + 6);
        
        currentY += 14;

        diaObj.locais.forEach(localObj => {
            if (currentY > 265) {
                doc.addPage();
                currentY = 20;
            }

            // Título do Local
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(localObj.local.toUpperCase(), 15, currentY);
            currentY += 6;

            localObj.eventos.forEach(ev => {
                if (currentY > 275) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                
                // Horário em negrito vermelho
                doc.setTextColor(185, 28, 28);
                doc.setFont('helvetica', 'bold');
                doc.text(ev.horario, 18, currentY);

                // Descrição do Evento (com quebra de linha automática para textos longos)
                doc.setTextColor(40, 40, 40);
                doc.setFont('helvetica', 'normal');
                
                const splitDesc = doc.splitTextToSize(ev.descricao, pageWidth - 70);
                doc.text(splitDesc, 55, currentY);

                currentY += (splitDesc.length * 5) + 3;
            });

            currentY += 4;
        });

        currentY += 6;
    });

    // Rodapé do PDF nas páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Natal Hair 2026 - Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    }

    // Salva o arquivo PDF
    doc.save('Programacao-NatalHair-2026.pdf');
}

// Helper para converter imagem local em base64 para o jsPDF
function carregarImagemComoBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function(error) {
            reject(error);
        };
        img.src = url;
    });
}
