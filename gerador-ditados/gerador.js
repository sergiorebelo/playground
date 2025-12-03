
// DADOS LOCAIS (funciona sem internet)
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

// Histórico e estado atual
let historico = [];
let ditadoAtual = null;
let codigoAtual = '';
let work = 'local'; // this need to be set to remote when words are loaded

// Elementos DOM
const ditadoDisplay = document.getElementById('ditadoDisplay');
const statusMessage = document.getElementById('statusMessage');
const gerarBtn = document.getElementById('gerarBtn');
const copiarBtn = document.getElementById('copiarBtn');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const shareUrlBtn = document.getElementById('shareUrlBtn');
const historyList = document.getElementById('historyList');

// URL do Google Sheets (MUDE AQUI com sua URL pública)
const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1VeU8OadYcAOIbtH1AjKdaD4_KUcDr1xxmycCjYnyaSM/edit?usp=sharing';

/**
 * Encodes ditado selections into a compact code
 * 
 * @param {} selected an object with selected indexes
 * @returns the ditado code
 */
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

/**
 * Decodes ditado code into selections
 * 
 * @param {} code a 12-character code
 * @returns  the selections or null if invalid
 */
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

/**
 * Generates a random selection of words based on gender
 * 
 * @returns 
 */
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


/**
 * Generates a new ditado
 * 
 * @param {} selectionOfWords 
 * @returns 
 */
function getDitadoFromSelectionOfWords(selectionOfWords) {

    // Recuperar palavras
    const animal = selectionOfWords.genero === 'F'
        ? palavras.animaisF[selecoes.animalIdx]
        : palavras.animaisM[selecoes.animalIdx];
        
    const adjetivo = selecoes.genero === 'F'
        ? palavras.adjetivosF[selecoes.adjetivoIdx]
        : palavras.adjetivosM[selecoes.adjetivoIdx];        
    const negacao = palavras.negações[selecoes.negacaoIdx];
    
    let verbo;
    if (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em') {
        verbo = palavras.verbosInfinitivo[selecoes.verboIdx % palavras.verbosInfinitivo.length];
    }


    else {        verbo = palavras.verbosPresente[selecoes.verboIdx % palavras.verbosPresente.length];
    }           
    const lugar = palavras.lugares[selecoes.lugarIdx];

    return `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;
}       


/** 
 *  Generates a new ditado
 *  
 * @param {null} [selectionOfWords=null] 
 * @returns { ditado: string, url: string, selecoes: object }   
 */
function gerarDitado(selectionOfWords = null) {

    if (!selectionOfWords) {
        selectionOfWords = generateSelectionOfWords();
    }

    const saying = getDitadoFromSelectionOfWords(selectionOfWords);

    // Recuperar palavras
    const animal = selecoes.genero === 'F'
        ? palavras.animaisF[selecoes.animalIdx]
        : palavras.animaisM[selecoes.animalIdx];

    const adjetivo = selecoes.genero === 'F'
        ? palavras.adjetivosF[selecoes.adjetivoIdx]
        : palavras.adjetivosM[selecoes.adjetivoIdx];

    const negacao = palavras.negações[selecoes.negacaoIdx];

    let verbo;
    if (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em') {
        verbo = palavras.verbosInfinitivo[selecoes.verboIdx % palavras.verbosInfinitivo.length];
    } else {
        verbo = palavras.verbosPresente[selecoes.verboIdx % palavras.verbosPresente.length];
    }

    const lugar = palavras.lugares[selecoes.lugarIdx];

    ditadoAtual = `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;

    // Gerar URL diretamente (não mostrar código isolado)
    const novaUrl = gerarUrlComDitado(selecoes);
    codigoAtual = extrairCodigoDaUrl(novaUrl);

    ditadoDisplay.textContent = ditadoAtual;

    adicionarAoHistorico(ditadoAtual, novaUrl);

    return { ditado: ditadoAtual, url: novaUrl, selecoes };
}

// GERAR URL com código embutido
function gerarUrlComDitado(selecoes) {
    const codigo = encodeDitado(selecoes);
    return `${window.location.origin}${window.location.pathname}?c=${codigo}`;
}

// Extrair código da URL
function extrairCodigoDaUrl(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('c') || '';
}

// Histórico com URLs (não códigos)
function adicionarAoHistorico(ditado, url) {
    const item = {
        ditado,
        url,
        timestamp: new Date().toLocaleTimeString(),
        codigo: extrairCodigoDaUrl(url)
    };

    historico.unshift(item);
    if (historico.length > 5) historico.pop();

    saveHistoricoToLocal();
    atualizarHistorico();
}

function saveHistoricoToLocal() {
    try {
        localStorage.setItem('ditadosHistorico', JSON.stringify(historico));
    } catch (e) {
        console.warn('Não foi possível salvar histórico', e);
    }
}

function loadHistoricoFromLocal() {
    try {
        const raw = localStorage.getItem('ditadosHistorico');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                historico = parsed;
            }
        }
    } catch (e) {
        console.warn('Erro ao carregar histórico', e);
    }
}

function atualizarHistorico() {
    historyList.innerHTML = historico.map((item, index) => `
        <div class="history-item">
            <div>
                <strong>${historico.length - index}.</strong> ${item.ditado}
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

// Carregar do Google Sheets
async function carregarDoGoogleSheets(url) {
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

        let totalCarregado = 0;

        for (const sheet of sheets) {
            try {
                const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet.name)}`;

                const response = await fetch(csvUrl);
                if (!response.ok) continue;

                const csvText = await response.text();
                const linhas = csvText.split('\n')
                    .map(linha => {
                        let texto = linha.trim();
                        if (texto.startsWith('"') && texto.endsWith('"')) {
                            texto = texto.substring(1, texto.length - 1);
                        }
                        const partes = texto.split(',');
                        return partes[0] ? partes[0].trim() : '';
                    })
                    .filter(texto => texto.length > 0 && !texto.toLowerCase().includes('palavra'));

                if (linhas.length > 0) {
                    palavras[sheet.key] = linhas;
                    totalCarregado++;
                }
            } catch (error) {
                console.warn(`Erro ao carregar aba ${sheet.name}:`, error);
            }
        }

        if (totalCarregado > 0) {
            showStatus(`✅ Carregadas palavras de ${totalCarregado} categorias`, 'success', 3000);
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

// Verificar código na URL ao carregar a página
function verificarCodigoNaUrl() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');

    if (codigo) {
        const selecoes = decodeDitado(codigo);
        if (selecoes) {
            // Generate Ditado from code
            const animal = selecoes.genero === 'F'
                ? palavras.animaisF[selecoes.animalIdx]
                : palavras.animaisM[selecoes.animalIdx];

            const adjetivo = selecoes.genero === 'F'
                ? palavras.adjetivosF[selecoes.adjetivoIdx]
                : palavras.adjetivosM[selecoes.adjetivoIdx];

            const negacao = palavras.negações[selecoes.negacaoIdx];

            let verbo;
            if (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em') {
                verbo = palavras.verbosInfinitivo[selecoes.verboIdx % palavras.verbosInfinitivo.length];
            } else {
                verbo = palavras.verbosPresente[selecoes.verboIdx % palavras.verbosPresente.length];
            }

            const lugar = palavras.lugares[selecoes.lugarIdx];

            ditadoAtual = `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;
            ditadoDisplay.textContent = ditadoAtual;

            // Atualizar URL para manter o código
            const novaUrl = `${window.location.origin}${window.location.pathname}?c=${codigo}`;
            window.history.replaceState({}, '', novaUrl);

            showStatus('📨 Ditado carregado do link compartilhado', 'success', 3000);
            return true;
        } else {
            showStatus('Link inválido ou expirado', 'error', 4000);
            // Remover código inválido da URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }
    return false;
}

// Event Listeners
gerarBtn.addEventListener('click', () => {
    const resultado = gerarDitado();

    // Atualizar URL no navegador com o novo ditado
    window.history.pushState({}, '', `?c=${extrairCodigoDaUrl(resultado.url)}`);

    showStatus('🎲 Novo ditado gerado!', 'success', 2000);
});

copiarBtn.addEventListener('click', () => {
    if (!ditadoAtual) return;

    navigator.clipboard.writeText(ditadoAtual)
        .then(() => {
            showStatus('📝 Ditado copiado!', 'success', 1500);
        });
});

// Copiar URL atual (botão "Copiar Link")
copyUrlBtn.addEventListener('click', () => {
    if (!codigoAtual && !window.location.search.includes('c=')) {
        showStatus('Gere um ditado primeiro!', 'error', 2000);
        return;
    }

    const urlParaCopiar = window.location.href;
    navigator.clipboard.writeText(urlParaCopiar)
        .then(() => {
            showStatus('🔗 Link copiado! Cole para compartilhar', 'success', 2000);
        });
});

// Compartilhar em redes sociais (botão "Compartilhar")
shareUrlBtn.addEventListener('click', () => {
    if (!codigoAtual && !window.location.search.includes('c=')) {
        showStatus('Gere um ditado primeiro!', 'error', 2000);
        return;
    }

    const urlParaCompartilhar = window.location.href;
    const textoParaCompartilhar = `Veja este ditado que gerei: "${ditadoAtual || 'Ditado popular engraçado'}"`;

    // Tenta usar Web Share API se disponível
    if (navigator.share) {
        navigator.share({
            title: 'Ditado Popular Gerado',
            text: textoParaCompartilhar,
            url: urlParaCompartilhar
        });
    } else {
        // Fallback: copia para clipboard
        navigator.clipboard.writeText(`${textoParaCompartilhar}\n${urlParaCompartilhar}`)
            .then(() => {
                showStatus('📤 Link pronto para compartilhar! (copiado)', 'success', 2000);
            });
    }
});

// Click handler para histórico (copiar link do histórico)
historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-url]');
    if (!btn) return;
    const url = btn.getAttribute('data-url');

    navigator.clipboard.writeText(url)
        .then(() => {
            showStatus('🔗 Link do histórico copiado!', 'success', 2000);
        });
});

// Botão para recarregar do Sheets
const reloadSheetsBtn = document.getElementById('reloadSheetsBtn');
if (reloadSheetsBtn) {
    reloadSheetsBtn.addEventListener('click', () => {
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('🔄 Recarregando palavras...', 'info', 2000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success) {
                    gerarDitado();
                }
            });
        } else {
            showStatus('❌ URL do Google Sheets não configurada', 'error', 4000);
        }
    });
}

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        gerarBtn.click();
    }
});

// Gerenciar navegação no histórico do navegador
window.addEventListener('popstate', () => {
    verificarCodigoNaUrl();
});

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    // Carregar histórico
    loadHistoricoFromLocal();
    atualizarHistorico();

    // Verificar se veio de um link compartilhado
    const veioDeLink = verificarCodigoNaUrl();

    if (!veioDeLink) {
        // Carregar do Google Sheets se configurado
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('📥 Carregando palavras...', 'info', 2000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success || historico.length === 0) {
                    gerarDitado();
                }
            });
        } else {
            // Gerar primeiro ditado
            setTimeout(() => {
                gerarDitado();
            }, 500);
        }
    }
});