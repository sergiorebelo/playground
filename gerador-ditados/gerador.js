// JavaScript moved from gerador.html
// DADOS LOCAIS (funciona sem internet)
let palavras = {
    animaisM: ['Cavalo', 'Gato', 'Cachorro', 'Leão', 'Urso', 'Lobo', 'Macaco', 'Tigre', 'Elefante', 'Jacaré'],
    animaisF: ['Gata', 'Cadela', 'Leoa', 'Ursa', 'Loba', 'Macaca', 'Galinha', 'Vaca', 'Coruja', 'Raposa'],
    adjetivosM: ['frouxo', 'preguiçoso', 'esperto', 'teimoso', 'curioso', 'nervoso', 'calmo', 'bravo', 'feliz', 'triste'],
    adjetivosF: ['frouxa', 'preguiçosa', 'esperta', 'teimosa', 'curiosa', 'nervosa', 'calma', 'brava', 'feliz', 'triste'],
    negações: ['não', 'nunca', 'jamais', 'não pode', 'não deve', 'nem pensar em'],
    verbosPresente: ['vai', 'corre', 'pula', 'dorme', 'come', 'briga', 'foge', 'canta', 'dança', 'estuda'],
    verbosInfinitivo: ['ir', 'correr', 'pular', 'dormir', 'comer', 'brigar', 'fugir', 'cantar', 'dançar', 'estudar'],
    lugares: ['na escola', 'no trabalho', 'na festa', 'no cinema', 'na floresta', 'no rio', 'em date', 'na cidade', 'no campo']
};

// Histórico e estado atual
let historico = [];
let ditadoAtual = null;
let codigoAtual = '';
let selecoesAtuais = null;
let lastSheetLoadFailed = false;

// Elementos DOM
const ditadoDisplay = document.getElementById('ditadoDisplay');
const statusMessage = document.getElementById('statusMessage');
const gerarBtn = document.getElementById('gerarBtn');
const copiarBtn = document.getElementById('copiarBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const shareUrlBtn = document.getElementById('shareUrlBtn');
const shareCode = document.getElementById('shareCode');
const historyList = document.getElementById('historyList');
// DEFAULT_SHEETS_URL: fill this with your Google Sheets URL (author's sheet).
// Example: 'https://docs.google.com/spreadsheets/d/....'
const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1VeU8OadYcAOIbtH1AjKdaD4_KUcDr1xxmycCjYnyaSM/edit?usp=sharing';

// Diagnostic mode: when true the loader will log extra details to console and show
// more descriptive status messages. Set to false to silence verbose diagnostics.
const DIAGNOSTIC_MODE = true;

// Helper to show status messages to the user
function showStatus(message, type = 'info', duration = 3000) {
    if (!statusMessage) return;
    statusMessage.style.display = 'block';
    statusMessage.textContent = message;
    statusMessage.style.color = type === 'error' ? '#7a1f1f' : (type === 'success' ? '#155724' : '#0b69b3');
    statusMessage.style.background = type === 'error' ? '#ffdede' : (type === 'success' ? '#d4edda' : '#e9f5ff');
    // hide after duration
    clearTimeout(statusMessage._timeout);
    statusMessage._timeout = setTimeout(() => {
        statusMessage.style.display = 'none';
    }, duration);
}

// Sistema de codificação/decodificação SIMPLIFICADO
function codificarDitado(selecoes) {
    // Formato: AABBCCDDEE (10 caracteres)
    // Cada par é um número em base36 (0-9, A-Z)
    // To make decoding work we encode the animal index as a combined index
    // where female indices come after male indices. This preserves gender info.
    const animalEncoded = (selecoes.genero === 'F')
        ? (selecoes.animalIdx + palavras.animaisM.length)
        : selecoes.animalIdx;

    const partes = [
        animalEncoded.toString(36).toUpperCase().padStart(2, '0'),
        selecoes.adjetivoIdx.toString(36).toUpperCase().padStart(2, '0'),
        selecoes.negacaoIdx.toString(36).toUpperCase().padStart(2, '0'),
        selecoes.verboIdx.toString(36).toUpperCase().padStart(2, '0'),
        selecoes.lugarIdx.toString(36).toUpperCase().padStart(2, '0')
    ];

    return partes.join('');
}
    
function decodificarDitado(codigo) {
    try {
        // Verificar se o código tem 10 caracteres
        if (codigo.length !== 10) {
            throw new Error('Código inválido: deve ter 10 caracteres');
        }
        
        // Extrair partes (2 caracteres cada)
        const partes = [
            codigo.substring(0, 2),  // animal
            codigo.substring(2, 4),  // adjetivo
            codigo.substring(4, 6),  // negação
            codigo.substring(6, 8),  // verbo
            codigo.substring(8, 10)  // lugar
        ];
        
        // Converter de base36 para número
        const indices = partes.map(part => parseInt(part, 36));

        if (indices.some(i => Number.isNaN(i) || i < 0)) {
            throw new Error('Código contém partes inválidas');
        }

        // Combined animal index: if < animaisM.length => male, else female (offset)
        const combinedAnimalIdx = indices[0];
        const genero = combinedAnimalIdx < palavras.animaisM.length ? 'M' : 'F';
        const animalIdxAjustado = genero === 'M'
            ? combinedAnimalIdx
            : (combinedAnimalIdx - palavras.animaisM.length);

        // Basic range validations
        const adjetivoIdx = indices[1];
        const negacaoIdx = indices[2];
        const verboIdx = indices[3];
        const lugarIdx = indices[4];

        const adjetivosArray = genero === 'M' ? palavras.adjetivosM : palavras.adjetivosF;

        if (animalIdxAjustado < 0 || (genero === 'M' && animalIdxAjustado >= palavras.animaisM.length) || (genero === 'F' && animalIdxAjustado >= palavras.animaisF.length)) {
            throw new Error('Índice de animal fora do intervalo');
        }

        if (adjetivoIdx < 0 || adjetivoIdx >= adjetivosArray.length) {
            throw new Error('Índice de adjetivo fora do intervalo');
        }

        if (negacaoIdx < 0 || negacaoIdx >= palavras.negações.length) {
            throw new Error('Índice de negação fora do intervalo');
        }

        // verboIdx: allow if within either verbs arrays length (we choose present/infinitive later)
        const maxVerbos = Math.max(palavras.verbosPresente.length, palavras.verbosInfinitivo.length);
        if (verboIdx < 0 || verboIdx >= maxVerbos) {
            throw new Error('Índice de verbo fora do intervalo');
        }

        if (lugarIdx < 0 || lugarIdx >= palavras.lugares.length) {
            throw new Error('Índice de lugar fora do intervalo');
        }

        return {
            animalIdx: animalIdxAjustado,
            adjetivoIdx: adjetivoIdx,
            negacaoIdx: negacaoIdx,
            verboIdx: verboIdx,
            lugarIdx: lugarIdx,
            genero: genero
        };
    } catch (error) {
        console.error('Erro ao decodificar:', error);
        return null;
    }
}

// Função para obter item aleatório
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Função para gerar ditado
function gerarDitado(selecoesEspecificas = null) {
    let selecoes;
    
    if (selecoesEspecificas) {
        // Usar seleções específicas (de código)
        selecoes = selecoesEspecificas;
    } else {
        // Gerar seleções aleatórias
        const usarFeminino = Math.random() > 0.5;
        const genero = usarFeminino ? 'F' : 'M';
        
        // Escolher índices aleatórios dentro dos limites
        selecoes = {
            animalIdx: genero === 'F' 
                ? Math.floor(Math.random() * palavras.animaisF.length)
                : Math.floor(Math.random() * palavras.animaisM.length),
            adjetivoIdx: genero === 'F'
                ? Math.floor(Math.random() * palavras.adjetivosF.length)
                : Math.floor(Math.random() * palavras.adjetivosM.length),
            negacaoIdx: Math.floor(Math.random() * palavras.negações.length),
            verboIdx: Math.floor(Math.random() * palavras.verbosPresente.length),
            lugarIdx: Math.floor(Math.random() * palavras.lugares.length),
            genero: genero
        };
    }
    
    // Salvar seleções atuais
    selecoesAtuais = selecoes;
    
    // Recuperar palavras baseadas nas seleções
    const animal = selecoes.genero === 'F' 
        ? palavras.animaisF[selecoes.animalIdx] 
        : palavras.animaisM[selecoes.animalIdx];
    
    const adjetivo = selecoes.genero === 'F'
        ? palavras.adjetivosF[selecoes.adjetivoIdx]
        : palavras.adjetivosM[selecoes.adjetivoIdx];
    
    const negacao = palavras.negações[selecoes.negacaoIdx];
    
    // Escolher verbo correto baseado na negação
    let verbo;
    if (negacao === 'não pode' || negacao === 'não deve' || negacao === 'nem pensar em') {
        verbo = palavras.verbosInfinitivo[selecoes.verboIdx % palavras.verbosInfinitivo.length];
    } else {
        verbo = palavras.verbosPresente[selecoes.verboIdx % palavras.verbosPresente.length];
    }
    
    const lugar = palavras.lugares[selecoes.lugarIdx];
    
    // Montar ditado
    ditadoAtual = `${animal} ${adjetivo} ${negacao} ${verbo} ${lugar}`;
    
    // Gerar código
    codigoAtual = codificarDitado(selecoes);
    
    // Atualizar display
    ditadoDisplay.textContent = ditadoAtual;
    shareCode.textContent = codigoAtual;
    shareCode.style.cursor = 'pointer';
    
    // Adicionar ao histórico
    adicionarAoHistorico(ditadoAtual, codigoAtual);
    
    return { ditado: ditadoAtual, codigo: codigoAtual, selecoes };
}

// Adicionar ao histórico
function adicionarAoHistorico(ditado, codigo) {
    const item = {
        ditado,
        codigo,
        timestamp: new Date().toLocaleTimeString()
    };
    
    historico.unshift(item);
    if (historico.length > 5) historico.pop();
    
    // persist and update UI
    saveHistoricoToLocal();
    atualizarHistorico();
}

// Local storage helpers for history
function saveHistoricoToLocal() {
    try {
        localStorage.setItem('ditadosHistorico', JSON.stringify(historico));
    } catch (e) {
        console.warn('Não foi possível salvar histórico no localStorage', e);
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
        console.warn('Erro ao carregar histórico do localStorage', e);
    }
}

// Atualizar histórico na tela
function atualizarHistorico() {
    historyList.innerHTML = historico.map((item, index) => `
        <div class="history-item">
            <div>
                <strong>${historico.length - index}.</strong> ${item.ditado}
                <div class="history-meta">
                    ${item.timestamp} • Código: <span class="history-code" data-code="${item.codigo}">${item.codigo}</span>
                </div>
            </div>
            <div>
                <button class="btn btn-secondary" data-code="${item.codigo}">Recriar</button>
            </div>
        </div>
    `).join('');
}

// Click handler to restore a history item by code
historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-code]');
    if (!btn) return;
    const codigo = btn.getAttribute('data-code');
    if (!codigo) return;

    const selecoes = decodificarDitado(codigo);
    if (selecoes) {
        gerarDitado(selecoes);
        showStatus('Ditado restaurado do histórico', 'success', 2000);
    } else {
        showStatus('Código do histórico inválido', 'error', 3000);
    }
});

// Verificar código na URL
function verificarCodigoNaUrl() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    
    if (codigo) {
        try {
            const selecoes = decodificarDitado(codigo);
            if (selecoes) {
                gerarDitado(selecoes);
                
                // Atualizar URL sem recarregar
                const novaUrl = `${window.location.origin}${window.location.pathname}?c=${codigo}`;
                window.history.replaceState({}, '', novaUrl);
                
                // Mostrar mensagem
                ditadoDisplay.textContent = `📨 Ditado compartilhado: ${ditadoAtual}`;
                showStatus('Ditado carregado a partir da URL', 'success', 3000);
                return true;
            }
            else {
                showStatus('Código na URL é inválido ou está corrompido', 'error', 4000);
                return false;
            }
        } catch (error) {
            console.error('Código inválido na URL:', error);
            showStatus('Código inválido na URL', 'error', 4000);
        }
    }
    return false;
}

// Gerar URL compartilhável
function gerarUrlCompartilhavel() {
    if (!codigoAtual) return '';
    return `${window.location.origin}${window.location.pathname}?c=${codigoAtual}`;
}

// Carregar do Google Sheets
async function carregarDoGoogleSheets(url, options = { applyOnSuccess: true }) {
    try {
        lastSheetLoadFailed = false;
        // Extrair ID do spreadsheet da URL
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            showStatus('URL do Google Sheets inválida', 'error', 4000);
            return;
        }
        
        const spreadsheetId = match[1];
        
        // Lista de abas esperadas
        const sheets = [
            { key: 'animaisM', name: 'AnimaisM' },
            { key: 'animaisF', name: 'AnimaisF' },
            { key: 'adjetivosM', name: 'AdjetivosM' },
            { key: 'adjetivosF', name: 'AdjetivosF' },
            { key: 'negações', name: 'Negacoes' },
            { key: 'verbosPresente', name: 'VerbosPresente' },
            { key: 'verbosInfinitivo', name: 'VerbosInfinitivo' },
            { key: 'lugares', name: 'Lugares' }
        ];
        
        // Carregar cada aba (diagnóstico mais detalhado)
        let loadedAny = false;
        for (const sheet of sheets) {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet.name)}`;
            if (DIAGNOSTIC_MODE) console.debug('Tentando:', csvUrl);
            showStatus(`Carregando aba ${sheet.name}...`, 'info', 3000);

            let response;
            try {
                response = await fetch(csvUrl, { method: 'GET' });
            } catch (fetchError) {
                console.error(`Falha ao buscar ${sheet.name}:`, fetchError);
                showStatus(`Falha ao buscar aba ${sheet.name}: ${fetchError.message}`, 'error', 6000);
                continue;
            }

            if (!response.ok) {
                console.warn(`Aba ${sheet.name} retornou HTTP ${response.status} ${response.statusText}`);
                showStatus(`Aba ${sheet.name} retornou HTTP ${response.status}`, 'error', 6000);
                try {
                    const bodySnippet = await response.text().then(t => t.slice(0, 500));
                    if (DIAGNOSTIC_MODE) console.debug(`Resposta ${sheet.name} snippet:`, bodySnippet);
                } catch (e) {
                    /* ignore */
                }
                continue;
            }

            const contentType = response.headers.get('content-type') || '';
            const csvText = await response.text();

            // Quick diagnostics: if response looks like HTML (login/permission page), warn
            const lower = csvText.toLowerCase();
            if (lower.includes('<!doctype html') || lower.includes('<html') || lower.includes('you need permission') || lower.includes('signin') || lower.includes('login')) {
                console.warn(`Resposta inesperada para ${sheet.name} — pode ser página de login/permissão.`);
                showStatus(`Aba ${sheet.name} retornou conteúdo inesperado (login/permissão). Verifique permissões.`, 'error', 8000);
                if (DIAGNOSTIC_MODE) console.debug(`Conteúdo ${sheet.name} (primeiros 500 chars):`, csvText.slice(0, 500));
                continue;
            }

            // Split lines (support CRLF)
            const linhas = csvText.split(/\r?\n/)
                .map(linha => linha.trim())
                .filter(linha => linha.length > 0);

            // If first line looks like a header, optionally drop it — keep diagnostics
            let effective = linhas;
            if (linhas.length > 0 && /palavra|word|item|valor/i.test(linhas[0])) {
                if (DIAGNOSTIC_MODE) console.debug(`Aba ${sheet.name}: detectado header "${linhas[0]}" — removendo para carregar.`);
                effective = linhas.slice(1).filter(l => l.length > 0);
            }

            if (effective.length > 0) {
                palavras[sheet.key] = effective;
                loadedAny = true;
                console.log(`Carregado ${effective.length} itens da aba ${sheet.name}`);
                if (DIAGNOSTIC_MODE) console.debug(`Aba ${sheet.name} amostra:`, effective.slice(0, 6));
            } else {
                console.warn(`Aba ${sheet.name} não possui linhas úteis após parse.`);
                showStatus(`Aba ${sheet.name} está vazia ou tem apenas cabeçalho.`, 'info', 5000);
            }
        }

        if (!loadedAny) {
            throw new Error('Nenhuma aba foi carregada com sucesso — verifique URL/permissões/nomes das abas');
        }

        // Se ao menos uma aba foi carregada, notifique. Opcionalmente aplicamos (sobrescrevemos)
        if (options && options.applyOnSuccess === false) {
            showStatus('Palavras carregadas em background (não sobrescreveu o ditado atual)', 'success', 3000);
        } else {
            showStatus('Palavras carregadas do Google Sheets com sucesso!', 'success', 3000);
            gerarDitado(); // Gerar novo ditado com novas palavras
        }
        
    } catch (error) {
        console.error('Erro ao carregar do Google Sheets:', error);
        lastSheetLoadFailed = true;
        showStatus('Erro ao carregar. Certifique-se que o Sheets está público.', 'error', 5000);
    }
}

// Event Listeners
gerarBtn.addEventListener('click', () => {
    gerarDitado();
    
    // Limpar código da URL se estiver usando um gerado
    if (window.location.search.includes('c=')) {
        window.history.replaceState({}, '', window.location.pathname);
    }
});

copiarBtn.addEventListener('click', () => {
    if (!ditadoAtual) return;
    
    navigator.clipboard.writeText(ditadoAtual)
        .then(() => {
            const originalText = ditadoDisplay.textContent;
            ditadoDisplay.textContent = "✓ Ditado copiado!";
            ditadoDisplay.style.color = '#27ae60';
            
            setTimeout(() => {
                ditadoDisplay.textContent = originalText;
                ditadoDisplay.style.color = '#333';
            }, 1500);
        });
});


// Copiar código compartilhável
copyCodeBtn.addEventListener('click', () => {
    if (!codigoAtual) return;
    
    navigator.clipboard.writeText(codigoAtual)
        .then(() => {
            const originalText = shareCode.textContent;
            shareCode.textContent = "✓ Código copiado!";
            shareCode.style.color = '#27ae60';
            shareCode.style.fontWeight = 'bold';
            
            setTimeout(() => {
                shareCode.textContent = originalText;
                shareCode.style.color = '#333';
                shareCode.style.fontWeight = 'normal';
            }, 1500);
        });
});

// Gerar URL compartilhável
shareUrlBtn.addEventListener('click', () => {
    if (!codigoAtual) return;
    
    const url = gerarUrlCompartilhavel();
    navigator.clipboard.writeText(url)
        .then(() => {
            // Atualizar URL no navegador
            window.history.pushState({}, '', `?c=${codigoAtual}`);
            
            const originalText = shareCode.textContent;
            shareCode.textContent = "✓ URL copiada!";
            shareCode.style.color = '#27ae60';
            shareCode.style.fontWeight = 'bold';
            
            setTimeout(() => {
                shareCode.textContent = originalText;
                shareCode.style.color = '#333';
                shareCode.style.fontWeight = 'normal';
            }, 1500);
        });
});

// Copiar código ao clicar nele
shareCode.addEventListener('click', () => {
    if (!codigoAtual || codigoAtual === 'Gere um ditado primeiro...') return;
    copyCodeBtn.click();
});

// Reload sheets button (force reload)
const reloadSheetsBtn = document.getElementById('reloadSheetsBtn');
if (reloadSheetsBtn) {
    reloadSheetsBtn.addEventListener('click', () => {
        if (typeof DEFAULT_SHEETS_URL === 'string' && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('Recarregando palavras do Google Sheets...', 'info', 2000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim(), { applyOnSuccess: true });
        } else {
            showStatus('DEFAULT_SHEETS_URL não configurado em gerador.js', 'error', 4000);
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

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    // Load persisted history first
    loadHistoricoFromLocal();
    atualizarHistorico();

    // Verificar se há código na URL
    const temCodigo = verificarCodigoNaUrl();

    if (!temCodigo) {
        // If we have a persisted history, show the last item instead of immediately generating
        if (historico && historico.length > 0) {
            const last = historico[0];
            ditadoAtual = last.ditado;
            codigoAtual = last.codigo;
            shareCode.textContent = codigoAtual;
            ditadoDisplay.textContent = ditadoAtual;
            // try to restore selections if possible
            const selecoes = decodificarDitado(codigoAtual);
            if (selecoes) selecoesAtuais = selecoes;
        } else {
            // Try to load default Google Sheets data (if URL set); otherwise generate using local data
            if (typeof DEFAULT_SHEETS_URL === 'string' && DEFAULT_SHEETS_URL.trim().length > 0) {
                showStatus('Carregando palavras do Google Sheets configurado...', 'info', 3000);
                carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim(), { applyOnSuccess: true });
            } else {
                setTimeout(() => {
                    gerarDitado();
                }, 500);
            }
        }
    } else {
        // Page loaded from a shared code; still attempt a background load of the sheet
        // so the sheet can update words for future generations, but do not overwrite
        // the ditado that was loaded from the code.
        if (typeof DEFAULT_SHEETS_URL === 'string' && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('Carregando palavras do Google Sheets (background)...', 'info', 3000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim(), { applyOnSuccess: false });
        }
    }
});