
// Local Data (fallback)
let palavras = {
    animaisM: ['Cavalo', 'Gato', 'Cachorro', 'Leão', 'Urso', 'Lobo', 'Macaco', 'Tigre', 'Elefante', 'Jacaré'],
    animaisF: ['Gata', 'Cadela', 'Leoa', 'Ursa', 'Loba', 'Macaca', 'Galinha', 'Vaca', 'Coruja', 'Raposa'],
    adjetivosM: ['frouxo', 'preguiçoso', 'esperto', 'teimoso', 'curioso', 'nervoso', 'calmo', 'bravo', 'feliz', 'triste'],
    adjetivosF: ['frouxa', 'preguiçosa', 'esperta', 'teimosa', 'curiosa', 'nervosa', 'calma', 'brava', 'feliz', 'triste'],
    negações: ['não', 'nunca', 'jamais', 'não pode', 'não deve', 'nem pensar em'],
    verbosPresente: ['vai', 'corre', 'pula', 'dorme', 'come', 'briga', 'foge', 'canta', 'dança', 'estuda'],
    verbosInfinitivo: ['ir', 'correr', 'pular', 'dormir', 'comer', 'brigar', 'fugir', 'cantar', 'dançar', 'estudar'],
    lugares: ['para a escola', 'para o trabalho', 'para a festa', 'no cinema', 'na floresta', 'no rio', 'em date', 'na cidade', 'no campo']
};

// Google Sheets URL
const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1VeU8OadYcAOIbtH1AjKdaD4_KUcDr1xxmycCjYnyaSM/edit?usp=sharing';

// History and actual state
let historyOfDitados = [];
let currentDitado = null;
let currentCode = '';
let work = 'local'; // this need to be set to remote when words are loaded

// DOM Elements
const ditadoDisplay = document.getElementById('ditadoDisplay');
const statusMessage = document.getElementById('statusMessage');
const gerarBtn = document.getElementById('gerarBtn');
const copiarBtn = document.getElementById('copiarBtn');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const shareUrlBtn = document.getElementById('shareUrlBtn');
const historyList = document.getElementById('historyList');



// Encodes ditado selections into a code
//
function encodeDitado(selected) {

    const code = [
        selected.animalIdx.toString(36).toUpperCase().padStart(2, '0'),
        selected.adjetivoIdx.toString(36).toUpperCase().padStart(2, '0'),
        selected.negacaoIdx.toString(36).toUpperCase().padStart(2, '0'),
        selected.verboIdx.toString(36).toUpperCase().padStart(2, '0'),
        selected.lugarIdx.toString(36).toUpperCase().padStart(2, '0'),
        selected.genero,
        work === 'remote' ? 'R' : 'L' // L for local, R for remote
    ];

    return code.join('');
}

// Decodes ditado code into selections
//
function decodeDitado(code) {
    try {
        if (code.length !== 12) return null;

        const fractions = [
            code.substring(0, 2),
            code.substring(2, 4),
            code.substring(4, 6),
            code.substring(6, 8),
            code.substring(8, 10),
            code.substring(10, 11),
            code.substring(11, 12)
        ];

        const indexes = fractions.map(fraction => parseInt(fraction, 36));

        if (indexes.some(i => Number.isNaN(i) || i < 0)) return null;

        // validation of codes can go here: 
        // todo: check max values based on gender
        // todo: check if code is local or remote (sheets loaded)

        return {
            animalIdx: indexes[0],
            adjetivoIdx: indexes[1],
            negacaoIdx: indexes[2],
            verboIdx: indexes[3],
            lugarIdx: indexes[4],
            genero: indexes[5]
        };
    } catch (error) {
        console.error('Erro ao descodificar:', error);
        return null;
    }
}

// Generates a random selection of words
//
function generateSelectionOfWords() {

    const genero = Math.random() > 0.5 ? 'F' : 'M';

    let selected = {
        animalIdx: genero === 'F'
            ? Math.floor(Math.random() * palavras.animaisF.length)
            : Math.floor(Math.random() * palavras.animaisM.length),
        adjetivoIdx: genero === 'F'
            ? Math.floor(Math.random() * palavras.adjetivosF.length)
            : Math.floor(Math.random() * palavras.adjetivosM.length),
        negacaoIdx: Math.floor(Math.random() * palavras.negações.length),
        // todo: depending on the negation, we may need ot use verbs in the infinitive
        verboIdx: Math.floor(Math.random() * palavras.verbosPresente.length),
        lugarIdx: Math.floor(Math.random() * palavras.lugares.length),
        genero: genero
    };
    return selected;
}


// Generates a new ditado from a selection of words
//
function getDitadoFromSelectionOfWords(selectionOfWords) {

    // Recuperar palavras
    const animal = selectionOfWords.genero === 'F'
        ? palavras.animaisF[selectionOfWords.animalIdx]
        : palavras.animaisM[selectionOfWords.animalIdx];
    const adjetivo = selectionOfWords.genero === 'F'
        ? palavras.adjetivosF[selectionOfWords.adjetivoIdx]
        : palavras.adjetivosM[selectionOfWords.adjetivoIdx];
    const negacao = palavras.negações[selectionOfWords.negacaoIdx];
    const verbo = (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em')
        ? palavras.verbosInfinitivo[selectionOfWords.verboIdx]
        : palavras.verbosPresente[selectionOfWords.verboIdx];
    const lugar = palavras.lugares[selectionOfWords.lugarIdx];

    return `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;
}

// Generate a new ditado
//
function generateDitado(selectionOfWords = null) {

    if (!selectionOfWords) {
        selectionOfWords = generateSelectionOfWords();
    }

    const saying = getDitadoFromSelectionOfWords(selectionOfWords);

    // Generate URL with ditado code
    const novaUrl = gerarUrlComDitado(selectionOfWords);
    currentCode = extractCodeFromURL(novaUrl);

    ditadoDisplay.textContent = saying;
    addToHistory(saying, novaUrl);

    return { ditado: saying, url: novaUrl, selecoes };
}

// Generate URL with ditado code
//
function gerarUrlComDitado(selecoes) {
    const codigo = encodeDitado(selecoes);
    return `${window.location.origin}${window.location.pathname}?c=${codigo}`;
}

// extract code from URL
//
function extractCodeFromURL(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('c') || '';
}

// History management
//
function addToHistory(ditado, url) {
    const item = {
        ditado,
        url,
        timestamp: new Date().toLocaleTimeString(),
        codigo: extractCodeFromURL(url)
    };

    historyOfDitados.unshift(item);
    if (historyOfDitados.length > 5) historyOfDitados.pop();

    saveHistoryToLocal();
    updateHistory();
}

// Save history to local storage
//
function saveHistoryToLocal() {
    try {
        localStorage.setItem('ditadosHistorico', JSON.stringify(historyOfDitados));
    } catch (e) {
        console.warn('Não foi possível salvar histórico', e);
    }
}

// Load history from local storage
//
function loadHistoryFromLocal() {
    try {
        const raw = localStorage.getItem('ditadosHistorico');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                historyOfDitados = parsed;
            }
        }
    } catch (e) {
        console.warn('Erro ao carregar histórico', e);
    }
}

// Update history display
//
function updateHistory() {
    historyList.innerHTML = historyOfDitados.map((item, index) => `
        <div class="history-item">
            <div>
                <strong>${historyOfDitados.length - index}.</strong> ${item.ditado}
                <div class="history-meta">
                    ${item.timestamp}
                </div>
            </div>
            <div>
                <button class="btn btn-secondary" data-url="${item.url}">🔗 Copiar Link</button>
            </div>
        </div>
    `).join('');
}

// Status messages
//
function showStatus(message, type = 'info', duration = 3000) {
    if (!statusMessage) return;
    statusMessage.style.display = 'block';
    statusMessage.textContent = message;
    statusMessage.style.color = type === 'error' ? '#7a1f1f' : (type === 'success' ? '#155724' : '#0b69b3');
    statusMessage.style.background = type === 'error' ? '#ffdede' : (type === 'success' ? '#d4edda' : '#e9f5ff');

    clearTimeout(statusMessage._timeout);
    if (duration && duration > 0) {
        statusMessage._timeout = setTimeout(() => {
            statusMessage.style.display = 'none';
        }, duration);
    }
}

// Load words from Google Sheets
//
async function loadWords(url) {
    try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            showStatus('URL do Google Sheets inválida', 'error', 4000);
            return false;
        }

        const spreadsheetId = match[1];
        const sheets = [
            { key: 'animaisM', name: 'AnimaisM' },
            { key: 'animaisF', name: 'AnimaisF' },
            { key: 'adjetivosM', name: 'AdjetivosM' },
            { key: 'adjetivosF', name: 'AdjetivosF' },
            { key: 'negações', name: 'Negações' },
            { key: 'verbosPresente', name: 'VerbosPresente' },
            { key: 'verbosInfinitivo', name: 'VerbosInfinitivo' },
            { key: 'lugares', name: 'Lugares' }
        ];

        let totalLoad = 0;

        for (const sheet of sheets) {
            try {
                const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet.name)}`;

                const response = await fetch(csvUrl);
                if (!response.ok) continue;

                const csvText = await response.text();
                const lines = csvText.split('\n')
                    .map(line => {
                        let text = line.trim();
                        if (text.startsWith('"') && text.endsWith('"')) {
                            text = text.substring(1, text.length - 1);
                        }
                        const parts = text.split(',');
                        return parts[0] ? parts[0].trim() : '';
                    })
                    .filter(text => text.length > 0 && !text.toLowerCase().includes('palavra'));

                if (lines.length > 0) {
                    palavras[sheet.key] = lines;
                    totalLoad++;
                }
            } catch (error) {
                console.warn(`Erro ao carregar aba ${sheet.name}:`, error);
            }
        }

        if (totalLoad > 0) {
            showStatus(`✅ Carregadas palavras de ${totalLoad} categorias`, 'success', 3000);
            return true;
        } else {
            showStatus('⚠️ Usando palavras locais', 'info', 4000);
            return false;
        }

    } catch (error) {
        console.error('Erro ao carregar do Google Sheets:', error);
        showStatus('❌ Erro ao carregar. Usando palavras locais.', 'error', 4000);
        return false;
    }
}

// check if there's a code in the URL and load the ditado
//
function checkCodeinURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');

    if (code) {
        const selectedWords = decodeDitado(code);
        if (selectedWords) {
            // Generate Ditado from code
            const animal = selectedWords.genero === 'F'
                ? palavras.animaisF[selectedWords.animalIdx]
                : palavras.animaisM[selectedWords.animalIdx];

            const adjetivo = selectedWords.genero === 'F'
                ? palavras.adjetivosF[selectedWords.adjetivoIdx]
                : palavras.adjetivosM[selectedWords.adjetivoIdx];

            const negacao = palavras.negações[selectedWords.negacaoIdx];

            let verbo;
            if (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em') {
                verbo = palavras.verbosInfinitivo[selectedWords.verboIdx % palavras.verbosInfinitivo.length];
            } else {
                verbo = palavras.verbosPresente[selectedWords.verboIdx % palavras.verbosPresente.length];
            }

            const lugar = palavras.lugares[selectedWords.lugarIdx];

            ditadoAtual = `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;
            ditadoDisplay.textContent = ditadoAtual;

            // update current code
            const novaUrl = `${window.location.origin}${window.location.pathname}?c=${code}`;
            window.history.replaceState({}, '', novaUrl);

            showStatus('📨 Ditado carregado do link compartilhado', 'success', 3000);
            return true;
        } else {
            showStatus('Link inválido ou expirado', 'error', 4000);
            // Remove code from URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
    return false;
}

//
// Event Listeners
//

// Generate new ditado (button "Gerar Ditado")
gerarBtn.addEventListener('click', () => {
    const resultado = generateDitado();

    // Atualizar URL no navegador com o novo ditado
    window.history.pushState({}, '', `?c=${extractCodeFromURL(resultado.url)}`);

    showStatus('🎲 Novo ditado gerado!', 'success', 2000);
});

// Copy ditado to clipboard (button "Copiar Ditado")
copiarBtn.addEventListener('click', () => {
    if (!ditadoAtual) return;

    navigator.clipboard.writeText(ditadoAtual)
        .then(() => {
            showStatus('📝 Ditado copiado!', 'success', 1500);
        });
});

// Copy URL to clipboard (button "Copiar Link")
copyUrlBtn.addEventListener('click', () => {
    if (!currentCode && !window.location.search.includes('c=')) {
        showStatus('Gere um ditado primeiro!', 'error', 2000);
        return;
    }

    const urlParaCopiar = window.location.href;
    navigator.clipboard.writeText(urlParaCopiar)
        .then(() => {
            showStatus('🔗 Link copiado! Cole para compartilhar', 'success', 2000);
        });
});

// Share URL (button "Compartilhar Link")
shareUrlBtn.addEventListener('click', () => {
    if (!currentCode && !window.location.search.includes('c=')) {
        showStatus('Gere um ditado primeiro!', 'error', 2000);
        return;
    }

    const urlParaCompartilhar = window.location.href;
    const textoParaCompartilhar = `Veja este ditado que gerei: "${ditadoAtual || 'Ditado popular engraçado'}"`;

    // Try to use Web Share API, fallback to clipboard
    if (navigator.share) {
        navigator.share({
            title: 'Ditado Popular Gerado',
            text: textoParaCompartilhar,
            url: urlParaCompartilhar
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${textoParaCompartilhar}\n${urlParaCompartilhar}`)
            .then(() => {
                showStatus('📤 Link pronto para compartilhar! (copiado)', 'success', 2000);
            });
    }
});

// Copy link from history items 
historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-url]');
    if (!btn) return;
    const url = btn.getAttribute('data-url');

    navigator.clipboard.writeText(url)
        .then(() => {
            showStatus('🔗 Link do histórico copiado!', 'success', 2000);
        });
});

// Button that reloads words from Google Sheets
const reloadSheetsBtn = document.getElementById('reloadSheetsBtn');

if (reloadSheetsBtn) {
    reloadSheetsBtn.addEventListener('click', () => {
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('🔄 Recarregando palavras...', 'info', 2000);
            loadWords(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success) {
                    generateDitado();
                }
            });
        } else {
            showStatus('❌ URL do Google Sheets não configurada', 'error', 4000);
        }
    });
}

// keyboard shortcut: space to generate new ditado
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        gerarBtn.click();
    }
});

// Manage navigation code changes
window.addEventListener('popstate', () => {
    checkCodeinURL();
});

// Inicialization
window.addEventListener('DOMContentLoaded', () => {
    // Load history from local storage
    loadHistoryFromLocal();
    updateHistory();

    // check if there's a code in the URL
    const veioDeLink = checkCodeinURL();

    if (!veioDeLink) {
        // load words from Google Sheets if URL is set
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('📥 Carregando palavras...', 'info', 2000);
            loadWords(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success || historico.length === 0) {
                    generateDitado();
                }
            });
        } else {
            // generate new ditado if no code in URL
            setTimeout(() => {
                generateDitado();
            }, 500);
        }
    }
});