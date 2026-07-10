let html5QrcodeScanner = null;

function startScanner(onScanSuccess) {
    if (html5QrcodeScanner) return; // Evita múltiplas instâncias

    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
    };

    html5QrcodeScanner = new Html5Qrcode("reader");
    
    html5QrcodeScanner.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            // Pausa a leitura enquanto processa para evitar flood
            html5QrcodeScanner.pause();
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // Ignora erros de frame vazio
        }
    ).catch(err => {
        console.error("Erro ao iniciar câmera:", err);
        document.getElementById('scanner-feedback').textContent = "Permita o acesso à câmera.";
    });
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
        }).catch(err => {
            console.error("Erro ao parar scanner.", err);
        });
    }
}

function resumeScanner() {
    if (html5QrcodeScanner && html5QrcodeScanner.getState() === 2) { // 2 = PAUSED
        html5QrcodeScanner.resume();
    }
}
