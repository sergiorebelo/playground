// gerador.js - VERSÃO CORRIGIDA
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
let selecoesAtuais = null;

// Elementos DOM
const ditadoDisplay = document.getElementById('ditadoDisplay');
const statusMessage = document.getElementById('statusMessage');
const gerarBtn = document.getElementById('gerarBtn');
const copiarBtn = document.getElementById('copiarBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const shareUrlBtn = document.getElementById('shareUrlBtn');
const shareCode = document.getElementById('shareCode');
const historyList = document.getElementById('historyList');

// URL do Google Sheets (MUDE AQUI com sua URL pública)
// O Sheets deve estar configurado como "Qualquer pessoa com o link pode visualizar"
const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1VeU8OadYcAOIbtH1AjKdaD4_KUcDr1xxmycCjYnyaSM/edit?usp=sharing';

// Sistema de codificação/decodificação
function codificarDitado(selecoes) {
    // Formato: AABBCCDDEE (10 caracteres) - base36
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
        if (codigo.length !== 10) {
            throw new Error('Código inválido');
        }
        
        const partes = [
            codigo.substring(0, 2),
            codigo.substring(2, 4),
            codigo.substring(4, 6),
            codigo.substring(6, 8),
            codigo.substring(8, 10)
        ];
        
        const indices = partes.map(part => parseInt(part, 36));

        if (indices.some(i => Number.isNaN(i) || i < 0)) {
            throw new Error('Código inválido');
        }

        // Determinar gênero
        const combinedAnimalIdx = indices[0];
        const genero = combinedAnimalIdx < palavras.animaisM.length ? 'M' : 'F';
        const animalIdxAjustado = genero === 'M'
            ? combinedAnimalIdx
            : (combinedAnimalIdx - palavras.animaisM.length);

        // Validar índices
        const adjetivosArray = genero === 'M' ? palavras.adjetivosM : palavras.adjetivosF;
        
        if (animalIdxAjustado < 0 || 
            (genero === 'M' && animalIdxAjustado >= palavras.animaisM.length) || 
            (genero === 'F' && animalIdxAjustado >= palavras.animaisF.length)) {
            throw new Error('Índice de animal inválido');
        }

        if (indices[1] < 0 || indices[1] >= adjetivosArray.length ||
            indices[2] < 0 || indices[2] >= palavras.negações.length ||
            indices[4] < 0 || indices[4] >= palavras.lugares.length) {
            throw new Error('Índice inválido');
        }

        return {
            animalIdx: animalIdxAjustado,
            adjetivoIdx: indices[1],
            negacaoIdx: indices[2],
            verboIdx: indices[3],
            lugarIdx: indices[4],
            genero: genero
        };
    } catch (error) {
        console.error('Erro ao decodificar:', error);
        return null;
    }
}

// Função para gerar ditado
function gerarDitado(selecoesEspecificas = null) {
    let selecoes;
    
    if (selecoesEspecificas) {
        selecoes = selecoesEspecificas;
    } else {
        const usarFeminino = Math.random() > 0.5;
        const genero = usarFeminino ? 'F' : 'M';
        
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
    
    selecoesAtuais = selecoes;
    
    // Recuperar palavras CORRETAS de cada categoria
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
    
    codigoAtual = codificarDitado(selecoes);
    
    ditadoDisplay.textContent = ditadoAtual;
    shareCode.textContent = codigoAtual;
    shareCode.style.cursor = 'pointer';
    
    adicionarAoHistorico(ditadoAtual, codigoAtual);
    
    return { ditado: ditadoAtual, codigo: codigoAtual, selecoes };
}

// Histórico
function adicionarAoHistorico(ditado, codigo) {
    const item = {
        ditado,
        codigo,
        timestamp: new Date().toLocaleTimeString()
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
                    ${item.timestamp} • Código: <span class="history-code" data-code="${item.codigo}">${item.codigo}</span>
                </div>
            </div>
            <div>
                <button class="btn btn-secondary" data-code="${item.codigo}">Recriar</button>
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

// Carregar do Google Sheets - VERSÃO SIMPLIFICADA E FUNCIONAL
async function carregarDoGoogleSheets(url) {
    try {
        // Extrair ID do spreadsheet
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            showStatus('URL do Google Sheets inválida', 'error', 4000);
            return false;
        }
        
        const spreadsheetId = match[1];
        
        // Lista de abas que PRECISAM existir
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
                if (!response.ok) {
                    console.warn(`Aba ${sheet.name} não encontrada, usando padrão`);
                    continue;
                }
                
                const csvText = await response.text();
                
                // Processar CSV corretamente
                const linhas = csvText.split('\n')
                    .map(linha => {
                        // Remover aspas e processar CSV simples
                        let texto = linha.trim();
                        if (texto.startsWith('"') && texto.endsWith('"')) {
                            texto = texto.substring(1, texto.length - 1);
                        }
                        // Separar por vírgula e pegar primeira coluna
                        const partes = texto.split(',');
                        return partes[0] ? partes[0].trim() : '';
                    })
                    .filter(texto => texto.length > 0 && !texto.toLowerCase().includes('palavra'));
                
                if (linhas.length > 0) {
                    palavras[sheet.key] = linhas;
                    totalCarregado++;
                    console.log(`✅ Carregado ${linhas.length} ${sheet.key} da aba ${sheet.name}`);
                }
            } catch (error) {
                console.warn(`Erro ao carregar aba ${sheet.name}:`, error);
            }
        }
        
        if (totalCarregado > 0) {
            showStatus(`✅ Carregadas palavras de ${totalCarregado} categorias do Google Sheets`, 'success', 3000);
            return true;
        } else {
            showStatus('⚠️ Nenhuma aba carregada. Usando palavras locais.', 'info', 4000);
            return false;
        }
        
    } catch (error) {
        console.error('Erro ao carregar do Google Sheets:', error);
        showStatus('❌ Erro ao carregar do Google Sheets. Usando palavras locais.', 'error', 4000);
        return false;
    }
}

// Verificar código na URL
function verificarCodigoNaUrl() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    
    if (codigo) {
        const selecoes = decodificarDitado(codigo);
        if (selecoes) {
            gerarDitado(selecoes);
            const novaUrl = `${window.location.origin}${window.location.pathname}?c=${codigo}`;
            window.history.replaceState({}, '', novaUrl);
            showStatus('📨 Ditado carregado do link compartilhado', 'success', 3000);
            return true;
        } else {
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

// Event Listeners
gerarBtn.addEventListener('click', () => {
    gerarDitado();
    
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

shareUrlBtn.addEventListener('click', () => {
    if (!codigoAtual) return;
    
    const url = gerarUrlCompartilhavel();
    navigator.clipboard.writeText(url)
        .then(() => {
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

shareCode.addEventListener('click', () => {
    if (!codigoAtual || codigoAtual === 'Gere um ditado primeiro...') return;
    copyCodeBtn.click();
});

// Click handler para histórico
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

// Botão para recarregar do Sheets
const reloadSheetsBtn = document.getElementById('reloadSheetsBtn');
if (reloadSheetsBtn) {
    reloadSheetsBtn.addEventListener('click', () => {
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('🔄 Recarregando palavras do Google Sheets...', 'info', 2000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success) {
                    gerarDitado(); // Gerar novo com palavras atualizadas
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

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    // Carregar histórico
    loadHistoricoFromLocal();
    atualizarHistorico();

    // Verificar código na URL
    const temCodigo = verificarCodigoNaUrl();

    if (!temCodigo) {
        // Carregar do Google Sheets se configurado
        if (DEFAULT_SHEETS_URL && DEFAULT_SHEETS_URL.trim().length > 0) {
            showStatus('📥 Carregando palavras do Google Sheets...', 'info', 2000);
            carregarDoGoogleSheets(DEFAULT_SHEETS_URL.trim()).then(success => {
                if (success || historico.length === 0) {
                    gerarDitado();
                }
            });
        } else {
            // Usar palavras locais
            setTimeout(() => {
                gerarDitado();
            }, 500);
        }
    }
});