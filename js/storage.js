/**
 * ==========================================================================
 * COLABORADOR - MOTOR DE DADOS & SINCRONIZAÇÃO NUVEM (GOOGLE SHEETS)
 * Armazenamento Local Ultrarrápido + Sincronização em Segundo Plano
 * ==========================================================================
 */

const DEFAULT_CATALOGO_PLACAS = [
  { id: 'mdf-1', nome: 'MDF Cru 3mm', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-2', nome: 'MDF Cru 3mm Branco', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-3', nome: 'MDF Cru 3mm Preto', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-4', nome: 'MDF Cru 3mm Amadeirado', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-5', nome: 'MDF Cru 3mm Rosa bebe', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-6', nome: 'MDF Cru 3mm Azul bebe', categoria: 'MDF', espessura: '3mm' },
  { id: 'mdf-7', nome: 'MDF Cru 4mm', categoria: 'MDF', espessura: '4mm' },
  { id: 'mdf-8', nome: 'MDF Cru 6mm Preto e Branco', categoria: 'MDF', espessura: '6mm' },
  { id: 'acr-1', nome: 'Acrilico Cristal 2mm', categoria: 'Acrílico', espessura: '2mm' },
  { id: 'acr-2', nome: 'Acrilico Branco 2mm', categoria: 'Acrílico', espessura: '2mm' },
  { id: 'acr-3', nome: 'Acrilico Preto 2mm', categoria: 'Acrílico', espessura: '2mm' },
  { id: 'acr-4', nome: 'Acrilico Espelhado Dourado 2mm', categoria: 'Acrílico', espessura: '2mm' },
  { id: 'acr-5', nome: 'Acrilico Espelhado Prata 2mm', categoria: 'Acrílico', espessura: '2mm' },
  { id: 'acr-6', nome: 'Acrilico Espelhado Rose Gold 2mm', categoria: 'Acrílico', espessura: '2mm' }
];

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx9UZOTwDs8gY-q_QSsWFTRB4eaU6l-HBrJ5_6i7qetE4vjUFFsEcwcfU4lv-Wi6_NA/exec';

const StorageEngine = {
  KEYS: {
    COMPRAS: 'colab_compras_v1',
    VENDAS: 'colab_vendas_v1',
    FECHAMENTOS: 'colab_fechamentos_v1',
    SETTINGS: 'colab_settings_v1',
    CATALOGO: 'colab_catalogo_placas_v1',
    ABATIMENTOS: 'colab_abatimentos_estoque_v1',
    PENDING_SYNC: 'colab_pending_sync_v1',
    DELETED_QUEUE: 'colab_deleted_queue_v1'
  },

  // Fila de exclusões pendentes para garantir exclusão na nuvem
  getDeletedQueue() {
    try {
      const data = localStorage.getItem(this.KEYS.DELETED_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addDeletedItem(type, id) {
    const queue = this.getDeletedQueue();
    const cleanId = String(id).trim();
    if (!queue.some(d => d.type === type && String(d.id).trim() === cleanId)) {
      queue.push({ type, id: cleanId, timestamp: Date.now() });
      localStorage.setItem(this.KEYS.DELETED_QUEUE, JSON.stringify(queue));
    }
  },

  removeDeletedItem(type, id) {
    let queue = this.getDeletedQueue();
    const cleanId = String(id).trim();
    queue = queue.filter(d => !(d.type === type && String(d.id).trim() === cleanId));
    localStorage.setItem(this.KEYS.DELETED_QUEUE, JSON.stringify(queue));
  },

  isDeletedLocally(type, id) {
    const queue = this.getDeletedQueue();
    const cleanId = String(id).trim();
    return queue.some(d => d.type === type && String(d.id).trim() === cleanId);
  },

  // Inicializa o armazenamento
  init() {
    let settings = this.getSettings();
    if (!settings || !settings.empresaNome) {
      settings = {
        empresaNome: 'Controle Interno & Fechamento',
        sheetsUrl: DEFAULT_SHEETS_URL,
        contas: ['Conta Principal', 'Conta 02', 'Balcão', 'Cliente A', 'Obra Especial'],
        materiais: DEFAULT_CATALOGO_PLACAS.map(p => p.nome)
      };
      this.saveSettings(settings);
    } else if (!settings.sheetsUrl) {
      settings.sheetsUrl = DEFAULT_SHEETS_URL;
      this.saveSettings(settings);
    }

    // Inicializa catálogo de placas se ainda não existir
    if (!localStorage.getItem(this.KEYS.CATALOGO)) {
      localStorage.setItem(this.KEYS.CATALOGO, JSON.stringify(DEFAULT_CATALOGO_PLACAS));
    }

    // LIMPEZA COMPLETA DE DADOS DE TESTE:
    // Garante base 100% zerada de pedidos e compras anteriores
    if (!localStorage.getItem('colab_cleaned_tests_v2')) {
      localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify([]));
      localStorage.setItem(this.KEYS.VENDAS, JSON.stringify([]));
      localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify([]));
      localStorage.setItem('colab_cleaned_tests_v2', 'true');
    }
  },

  // --- CATÁLOGO DE PLACAS (MDF & ACRÍLICO) ---
  getCatalogo() {
    try {
      const data = localStorage.getItem(this.KEYS.CATALOGO);
      return data ? JSON.parse(data) : DEFAULT_CATALOGO_PLACAS;
    } catch (e) {
      return DEFAULT_CATALOGO_PLACAS;
    }
  },

  saveCatalogo(catalogo) {
    localStorage.setItem(this.KEYS.CATALOGO, JSON.stringify(catalogo));
  },

  addMaterialCatalogo(item) {
    const cat = this.getCatalogo();
    const nomeLimpo = (item.nome || '').trim();
    if (!nomeLimpo) {
      throw new Error('Informe o nome da placa ou material!');
    }
    const jaExiste = cat.some(p => p.nome.trim().toLowerCase() === nomeLimpo.toLowerCase());
    if (jaExiste) {
      throw new Error(`A placa "${nomeLimpo}" já está cadastrada no catálogo!`);
    }

    const novoItem = {
      id: item.id || 'mat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      nome: nomeLimpo,
      categoria: item.categoria || (nomeLimpo.toLowerCase().includes('acrilico') ? 'Acrílico' : 'MDF'),
      espessura: item.espessura || ''
    };
    cat.push(novoItem);
    this.saveCatalogo(cat);

    // Se o usuário informou uma quantidade inicial maior que 0, adiciona como entrada de estoque inicial
    const qtdInicial = Number(item.qtdInicial) || 0;
    if (qtdInicial > 0) {
      this.addAjusteEstoque({
        tipo: 'aumentar',
        material: nomeLimpo,
        quantidade: qtdInicial,
        dataHora: new Date().toISOString(),
        motivo: 'Estoque inicial de cadastro'
      });
    }

    // Adiciona à lista de materiais das configurações se não estiver
    const settings = this.getSettings();
    if (settings.materiais && !settings.materiais.some(m => m.toLowerCase() === nomeLimpo.toLowerCase())) {
      settings.materiais.push(nomeLimpo);
      this.saveSettings(settings);
    }

    // Sincroniza novo material com o Google Sheets
    this.syncItemToSheets('add_material', novoItem);

    return novoItem;
  },

  async deleteMaterialCatalogo(id) {
    let cat = this.getCatalogo();
    const cleanId = String(id).trim();
    const item = cat.find(p => String(p.id).trim() === cleanId);
    cat = cat.filter(p => String(p.id).trim() !== cleanId);
    this.saveCatalogo(cat);
    this.addDeletedItem('material', cleanId);

    const res = await this.syncItemToSheets('delete_material', { id: cleanId });
    if (res && res.success) {
      this.removeDeletedItem('material', cleanId);
    }
    return item;
  },

  isPlacaControlada(nome) {
    if (!nome) return false;
    const cat = this.getCatalogo();
    const nomeLimpo = nome.trim().toLowerCase();
    return cat.some(p => p.nome.trim().toLowerCase() === nomeLimpo);
  },

  // --- AJUSTES MANUAIS DE ESTOQUE (AUMENTAR & ABATER À MÃO) ---
  getAjustesEstoque() {
    try {
      const data = localStorage.getItem(this.KEYS.ABATIMENTOS);
      const list = data ? JSON.parse(data) : [];
      // Garante tipo padronizado ('abater' por padrão para compatibilidade com registros legados)
      return list.map(item => ({
        ...item,
        tipo: item.tipo === 'aumentar' ? 'aumentar' : 'abater'
      }));
    } catch (e) {
      return [];
    }
  },

  getAbatimentos() {
    return this.getAjustesEstoque();
  },

  addAjusteEstoque(ajuste) {
    const list = this.getAjustesEstoque();
    ajuste.id = ajuste.id || 'ajs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    ajuste.dataHora = ajuste.dataHora || new Date().toISOString();
    ajuste.tipo = ajuste.tipo === 'aumentar' ? 'aumentar' : 'abater';
    ajuste.quantidade = Number(ajuste.quantidade) || 0;
    list.unshift(ajuste);
    localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(list));
    this.syncItemToSheets('add_ajuste', ajuste);
    return ajuste;
  },

  addAbatimento(abatimento) {
    return this.addAjusteEstoque({
      ...abatimento,
      tipo: abatimento.tipo || 'abater'
    });
  },

  async deleteAjusteEstoque(id) {
    let list = this.getAjustesEstoque();
    const cleanId = String(id).trim();
    list = list.filter(item => String(item.id).trim() !== cleanId);
    localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(list));
    this.addDeletedItem('ajuste', cleanId);

    const res = await this.syncItemToSheets('delete_ajuste', { id: cleanId });
    if (res && res.success) {
      this.removeDeletedItem('ajuste', cleanId);
    }
    return true;
  },

  // --- CONFIGURAÇÕES ---
  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      const parsed = data ? JSON.parse(data) : {};
      if (!parsed.sheetsUrl && typeof DEFAULT_SHEETS_URL !== 'undefined') {
        parsed.sheetsUrl = DEFAULT_SHEETS_URL;
      }
      return parsed;
    } catch (e) {
      return { sheetsUrl: typeof DEFAULT_SHEETS_URL !== 'undefined' ? DEFAULT_SHEETS_URL : '' };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- COMPRAS (ENTRADAS DE MATERIAIS) ---
  getCompras() {
    try {
      const data = localStorage.getItem(this.KEYS.COMPRAS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addCompra(compra) {
    const compras = this.getCompras();
    compra.id = compra.id || 'cmp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    compra.dataHora = compra.dataHora || new Date().toISOString();
    compra.synced = false;
    
    // Adiciona no início da lista (mais recentes primeiro)
    compras.unshift(compra);
    localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(compras));

    // Envia para o Google Sheets em segundo plano se configurado
    this.syncItemToSheets('add_compra', compra);
    return compra;
  },

  async updateCompra(id, updatedData) {
    let compras = this.getCompras();
    const idx = compras.findIndex(item => item.id === id);
    if (idx !== -1) {
      compras[idx] = { ...compras[idx], ...updatedData, synced: false };
      localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(compras));
      this.syncItemToSheets('add_compra', compras[idx]);
      return compras[idx];
    }
    return null;
  },

  async deleteCompra(id) {
    let compras = this.getCompras();
    const cleanId = String(id).trim();
    compras = compras.filter(item => String(item.id).trim() !== cleanId);
    localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(compras));
    this.addDeletedItem('compra', cleanId);

    const res = await this.syncItemToSheets('delete_compra', { id: cleanId });
    if (res && res.success) {
      this.removeDeletedItem('compra', cleanId);
    }
    return true;
  },

  // --- PEDIDOS / VENDAS ---
  getVendas() {
    try {
      const data = localStorage.getItem(this.KEYS.VENDAS);
      const list = data ? JSON.parse(data) : [];
      // Garante que pedidos antigos tenham numeroPedido atribuído se faltar
      let changed = false;
      list.forEach((item, index) => {
        if (!item.numeroPedido) {
          item.numeroPedido = list.length - index;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return [];
    }
  },

  getNextNumeroPedido() {
    const vendas = this.getVendas();
    if (vendas.length === 0) return 1;
    const max = vendas.reduce((m, v) => Math.max(m, Number(v.numeroPedido) || 0), 0);
    return max + 1;
  },

  async addVenda(venda) {
    const vendas = this.getVendas();
    venda.id = venda.id || 'ped_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    venda.dataHora = venda.dataHora || new Date().toISOString();
    if (!venda.numeroPedido) {
      venda.numeroPedido = this.getNextNumeroPedido();
    }
    venda.synced = false;

    vendas.unshift(venda);
    localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(vendas));

    // Envia para o Google Sheets em segundo plano se configurado
    this.syncItemToSheets('add_venda', venda);
    return venda;
  },

  async updateVenda(id, updatedData) {
    let vendas = this.getVendas();
    const idx = vendas.findIndex(item => item.id === id);
    if (idx !== -1) {
      vendas[idx] = { ...vendas[idx], ...updatedData, synced: false };
      localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(vendas));
      this.syncItemToSheets('add_venda', vendas[idx]);
      return vendas[idx];
    }
    return null;
  },

  async deleteVenda(id) {
    let vendas = this.getVendas();
    const cleanId = String(id).trim();
    vendas = vendas.filter(item => String(item.id).trim() !== cleanId);
    localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(vendas));
    this.addDeletedItem('venda', cleanId);

    const res = await this.syncItemToSheets('delete_venda', { id: cleanId });
    if (res && res.success) {
      this.removeDeletedItem('venda', cleanId);
    }
    return true;
  },

  // --- FECHAMENTOS CONSOLIDADOS ---
  getFechamentos() {
    try {
      const data = localStorage.getItem(this.KEYS.FECHAMENTOS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async addFechamento(fechamento) {
    const fechamentos = this.getFechamentos();
    fechamento.id = fechamento.id || 'fch_' + Date.now();
    fechamento.dataFechamento = new Date().toISOString();
    fechamentos.unshift(fechamento);
    localStorage.setItem(this.KEYS.FECHAMENTOS, JSON.stringify(fechamentos));

    this.syncItemToSheets('fechamento', fechamento);
    return fechamento;
  },

  // --- CÁLCULO DINÂMICO DE ESTOQUE (EXCLUSIVO PARA PLACAS DE MDF & ACRÍLICO) ---
  calculateStock() {
    const catalogo = this.getCatalogo();
    const compras = this.getCompras();
    const vendas = this.getVendas();
    const ajustes = this.getAjustesEstoque();

    // Cria mapa inicial com TODAS as placas do catálogo
    const stockMap = {};
    catalogo.forEach(item => {
      const chave = item.nome.trim().toLowerCase();
      stockMap[chave] = {
        id: item.id,
        nome: item.nome,
        categoria: item.categoria || (item.nome.toLowerCase().includes('acrilico') ? 'Acrílico' : 'MDF'),
        espessura: item.espessura || '',
        totalEntrada: 0,
        totalEntradaManual: 0,
        totalSaida: 0,
        totalAbatido: 0,
        saldo: 0,
        valorGasto: 0,
        custoMedio: 0,
        valorEstoqueAtual: 0
      };
    });

    // 1. Entradas de Compras (Apenas placas do catálogo são contabilizadas no estoque)
    compras.forEach(c => {
      const nome = (c.material || '').trim().toLowerCase();
      if (stockMap[nome]) {
        const qtd = Number(c.quantidade) || 0;
        const total = Number(c.valorTotal) || 0;
        stockMap[nome].totalEntrada += qtd;
        stockMap[nome].valorGasto += total;
      }
    });

    // 2. Saídas vinculadas a Pedidos
    vendas.forEach(v => {
      const nome = (v.material || '').trim().toLowerCase();
      if (stockMap[nome]) {
        const qtd = Number(v.quantidade) || 0;
        stockMap[nome].totalSaida += qtd;
      }
    });

    // 3. Ajustes manuais de placas (Aumentos e Abatimentos à Mão)
    ajustes.forEach(a => {
      const nome = (a.material || '').trim().toLowerCase();
      if (stockMap[nome]) {
        const qtd = Number(a.quantidade) || 0;
        if (a.tipo === 'aumentar') {
          stockMap[nome].totalEntradaManual += qtd;
        } else {
          stockMap[nome].totalAbatido += qtd;
        }
      }
    });

    // 4. Calcula saldo final e custo médio ponderado
    return Object.values(stockMap).map(item => {
      const entradasTotais = item.totalEntrada + item.totalEntradaManual;
      const saidasTotais = item.totalSaida + item.totalAbatido;
      item.saldo = entradasTotais - saidasTotais;
      item.custoMedio = item.totalEntrada > 0 ? (item.valorGasto / item.totalEntrada) : 0;
      item.valorEstoqueAtual = item.saldo > 0 ? (item.saldo * item.custoMedio) : 0;
      return item;
    });
  },

  // --- SINCRONIZAÇÃO GOOGLE SHEETS VIA APPS SCRIPT ---
  async syncItemToSheets(action, payload) {
    const settings = this.getSettings();
    if (!settings.sheetsUrl || !settings.sheetsUrl.startsWith('http')) {
      return { success: false, reason: 'Sheets URL não configurada' };
    }

    try {
      const body = {
        action: action,
        ...payload
      };

      const res = await fetch(settings.sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {}

      if (json && json.success) {
        if (payload && payload.id) {
          this.markItemAsSynced(action, payload.id);
        }
        return { success: true };
      } else {
        console.warn('Aviso retornado do Google Apps Script:', text);
        return { success: false, error: text };
      }
    } catch (err) {
      console.warn('Falha na sincronização imediata com Google Sheets:', err);
      return { success: false, error: err };
    }
  },

  markItemAsSynced(action, id) {
    if (action === 'add_compra') {
      const compras = this.getCompras();
      const item = compras.find(c => c.id === id);
      if (item) {
        item.synced = true;
        localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(compras));
      }
    } else if (action === 'add_venda') {
      const vendas = this.getVendas();
      const item = vendas.find(v => v.id === id);
      if (item) {
        item.synced = true;
        localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(vendas));
      }
    } else if (action === 'add_ajuste') {
      const ajustes = this.getAjustesEstoque();
      const item = ajustes.find(a => a.id === id);
      if (item) {
        item.synced = true;
        localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(ajustes));
      }
    }
  },

  // Envia todos os dados que ainda não foram sincronizados para o Sheets
  async pushPendingToSheets() {
    const settings = this.getSettings();
    if (!settings.sheetsUrl || !settings.sheetsUrl.startsWith('http')) {
      return { success: false, reason: 'URL não configurada' };
    }

    const deletions = this.getDeletedQueue();
    const unSyncedCompras = this.getCompras().filter(c => !c.synced);
    const unSyncedVendas = this.getVendas().filter(v => !v.synced);
    const unSyncedAjustes = this.getAjustesEstoque().filter(a => !a.synced);

    if (deletions.length === 0 && unSyncedCompras.length === 0 && unSyncedVendas.length === 0 && unSyncedAjustes.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      const payload = {
        action: 'sync_all',
        deletions: deletions,
        compras: unSyncedCompras,
        vendas: unSyncedVendas,
        ajustes: unSyncedAjustes
      };

      const res = await fetch(settings.sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (e) {}

      if (json && json.success) {
        // Limpa fila de exclusões já processadas na nuvem
        localStorage.setItem(this.KEYS.DELETED_QUEUE, JSON.stringify([]));

        const compras = this.getCompras().map(c => ({ ...c, synced: true }));
        const vendas = this.getVendas().map(v => ({ ...v, synced: true }));
        const ajustes = this.getAjustesEstoque().map(a => ({ ...a, synced: true }));
        localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(compras));
        localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(vendas));
        localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(ajustes));
        return { success: true, count: unSyncedCompras.length + unSyncedVendas.length + deletions.length };
      }
      return { success: false, error: text };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  // Consulta dados remotos da planilha (Pull) e reconcilia bidirecionalmente (Google Sheets = Fonte da Verdade)
  async pullFromSheets() {
    const settings = this.getSettings();
    if (!settings.sheetsUrl || !settings.sheetsUrl.startsWith('http')) {
      throw new Error('Configure a URL do Google Apps Script nas configurações primeiro!');
    }

    const res = await fetch(settings.sheetsUrl);
    const text = await res.text();
    let result = null;
    try {
      result = JSON.parse(text);
    } catch (e) {
      if (text.includes('Função de script não encontrada') || text.includes('Script function not found')) {
        throw new Error('A API do Google Sheets precisa ser reimplantada no Apps Script (doGet não encontrado). Siga o tutorial em Configurações!');
      }
      throw new Error('Resposta inesperada da planilha. Verifique a URL do Web App.');
    }

    if (result && result.success && result.data) {
      // 1. RECONCILIAÇÃO DE COMPRAS
      if (Array.isArray(result.data.compras)) {
        const remoteMap = new Map();
        result.data.compras.forEach(rc => {
          if (!rc.ID || String(rc.ID).trim() === '') return;
          const id = String(rc.ID).trim();
          remoteMap.set(id, {
            id: id,
            dataHora: rc.DataHora || new Date().toISOString(),
            material: rc.Material_Insumo || '',
            fornecedor: rc.Fornecedor || '',
            quantidade: Number(rc.Quantidade) || 0,
            valorUnitario: Number(rc.ValorUnitario) || 0,
            valorTotal: Number(rc.ValorTotal) || 0,
            statusFechamento: rc.StatusFechamento || 'Finalizado',
            nf: rc.NF_Comprovante || '',
            obs: rc.Obs || '',
            synced: true
          });
        });

        const local = this.getCompras();
        const reconciled = [];
        const processedIds = new Set();

        for (const lc of local) {
          const id = String(lc.id).trim();
          if (remoteMap.has(id)) {
            reconciled.push(remoteMap.get(id));
            processedIds.add(id);
          } else if (lc.synced === false && !this.isDeletedLocally('compra', id)) {
            // Criado offline e ainda pendente de envio
            reconciled.push(lc);
          }
          // Se lc.synced === true e não existe mais no Sheets, foi EXCLUÍDO na nuvem -> não entra!
        }

        for (const [id, remoteItem] of remoteMap.entries()) {
          if (!processedIds.has(id) && !this.isDeletedLocally('compra', id)) {
            reconciled.push(remoteItem);
          }
        }

        reconciled.sort((a, b) => new Date(b.dataHora || 0) - new Date(a.dataHora || 0));
        localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(reconciled));
      }

      // 2. RECONCILIAÇÃO DE PEDIDOS / VENDAS
      if (Array.isArray(result.data.vendas)) {
        const remoteMap = new Map();
        result.data.vendas.forEach(rv => {
          if (!rv.ID || String(rv.ID).trim() === '') return;
          const id = String(rv.ID).trim();
          let num = null;
          if (rv.NumeroPedido) {
            num = parseInt(String(rv.NumeroPedido).replace(/\D/g, ''), 10) || null;
          }
          remoteMap.set(id, {
            id: id,
            numeroPedido: num,
            dataHora: rv.DataHora || new Date().toISOString(),
            conta: rv.Conta || 'Geral',
            material: rv.Material_Produto || '',
            quantidade: Number(rv.Quantidade) || 0,
            valorUnitario: Number(rv.ValorUnitario) || 0,
            valorTotal: Number(rv.ValorTotal) || 0,
            formaPagamento: rv.FormaPagamento || 'Dinheiro/Pix',
            status: rv.Status || 'Finalizado',
            obs: rv.Obs || '',
            synced: true
          });
        });

        const local = this.getVendas();
        const reconciled = [];
        const processedIds = new Set();

        for (const lv of local) {
          const id = String(lv.id).trim();
          if (remoteMap.has(id)) {
            reconciled.push(remoteMap.get(id));
            processedIds.add(id);
          } else if (lv.synced === false && !this.isDeletedLocally('venda', id)) {
            // Criado offline e ainda pendente de envio
            reconciled.push(lv);
          }
          // Se lv.synced === true e não existe mais no Sheets, foi EXCLUÍDO na nuvem -> não entra!
        }

        for (const [id, remoteItem] of remoteMap.entries()) {
          if (!processedIds.has(id) && !this.isDeletedLocally('venda', id)) {
            reconciled.push(remoteItem);
          }
        }

        reconciled.sort((a, b) => new Date(b.dataHora || 0) - new Date(a.dataHora || 0));
        localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(reconciled));
      }

      // 3. RECONCILIAÇÃO DE AJUSTES DE ESTOQUE (AUMENTOS E ABATIMENTOS)
      if (Array.isArray(result.data.ajustes)) {
        const remoteMap = new Map();
        result.data.ajustes.forEach(ra => {
          if (!ra.ID || String(ra.ID).trim() === '') return;
          const id = String(ra.ID).trim();
          const tipo = (ra.Tipo && String(ra.Tipo).toLowerCase().includes('aumento')) ? 'aumentar' : 'abater';
          remoteMap.set(id, {
            id: id,
            dataHora: ra.DataHora || new Date().toISOString(),
            tipo: tipo,
            material: ra.Material_Placa || '',
            quantidade: Number(ra.Quantidade) || 0,
            motivo: ra.Motivo || '',
            synced: true
          });
        });

        const local = this.getAjustesEstoque();
        const reconciled = [];
        const processedIds = new Set();

        for (const la of local) {
          const id = String(la.id).trim();
          if (remoteMap.has(id)) {
            reconciled.push(remoteMap.get(id));
            processedIds.add(id);
          } else if (la.synced === false && !this.isDeletedLocally('ajuste', id)) {
            reconciled.push(la);
          }
          // Se la.synced === true e não existe mais no Sheets, foi EXCLUÍDO na nuvem -> não entra!
        }

        for (const [id, remoteItem] of remoteMap.entries()) {
          if (!processedIds.has(id) && !this.isDeletedLocally('ajuste', id)) {
            reconciled.push(remoteItem);
          }
        }

        reconciled.sort((a, b) => new Date(b.dataHora || 0) - new Date(a.dataHora || 0));
        localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(reconciled));
      }

      // 4. RECONCILIAÇÃO DO CATÁLOGO DE PLACAS
      if (Array.isArray(result.data.catalogo) && result.data.catalogo.length > 0) {
        const remoteMap = new Map();
        result.data.catalogo.forEach(rc => {
          if (!rc.ID || String(rc.ID).trim() === '') return;
          const id = String(rc.ID).trim();
          remoteMap.set(id, {
            id: id,
            nome: rc.Nome || '',
            categoria: rc.Categoria || 'MDF',
            espessura: rc.Espessura || ''
          });
        });

        const local = this.getCatalogo();
        const reconciled = [];
        const processedIds = new Set();

        for (const lp of local) {
          const id = String(lp.id).trim();
          if (remoteMap.has(id)) {
            reconciled.push(remoteMap.get(id));
            processedIds.add(id);
          } else if (!this.isDeletedLocally('material', id)) {
            reconciled.push(lp);
          }
        }

        for (const [id, remoteItem] of remoteMap.entries()) {
          if (!processedIds.has(id) && !this.isDeletedLocally('material', id)) {
            reconciled.push(remoteItem);
          }
        }

        this.saveCatalogo(reconciled);
      }

      return true;
    }

    throw new Error((result && result.error) || 'Erro desconhecido ao consultar planilha');
  },

  // Sincronização Completa Bidirecional
  async syncAll() {
    await this.pushPendingToSheets();
    return await this.pullFromSheets();
  },

  // --- EXPORTAÇÃO EXCEL (.XLSX) ---
  exportToExcel(filtroDataInicio = null, filtroDataFim = null) {
    if (typeof XLSX === 'undefined') {
      alert('Biblioteca Excel carregando... Tente novamente em 2 segundos.');
      return;
    }

    let compras = this.getCompras();
    let vendas = this.getVendas();
    const estoque = this.calculateStock();

    // Filtra se especificado
    if (filtroDataInicio && filtroDataFim) {
      const dIni = new Date(filtroDataInicio);
      const dFim = new Date(filtroDataFim);
      dFim.setHours(23, 59, 59, 999);
      compras = compras.filter(c => {
        const d = new Date(c.dataHora);
        return d >= dIni && d <= dFim;
      });
      vendas = vendas.filter(v => {
        const d = new Date(v.dataHora);
        return d >= dIni && d <= dFim;
      });
    }

    const totalCompras = compras.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const totalVendas = vendas.reduce((acc, v) => acc + (Number(v.valorTotal) || 0), 0);
    const saldoLiquido = totalVendas - totalCompras;

    // Planilha 1: Resumo do Fechamento
    const resumoData = [
      ['RELATÓRIO DE FECHAMENTO INTERNO & MATERIAIS'],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [''],
      ['INDICADOR', 'VALOR (R$)'],
      ['Total de Pedidos / Faturado', totalVendas.toFixed(2)],
      ['Total de Compras / Materiais Adquiridos', totalCompras.toFixed(2)],
      ['Saldo Operacional Líquido', saldoLiquido.toFixed(2)],
      [''],
      ['Qtd Total de Pedidos', vendas.length],
      ['Qtd Total de Compras de Insumos', compras.length],
      ['Tipos de Materiais Monitorados', estoque.length]
    ];

    // Planilha 2: Pedidos
    const vendasData = [
      ['Nº Pedido', 'Data/Hora', 'Conta / Identificação', 'Material / Produto', 'Quantidade', 'Valor Unit. (R$)', 'Total (R$)', 'Pagamento', 'Status', 'Observações']
    ];
    vendas.forEach(v => {
      vendasData.push([
        v.numeroPedido ? `Pedido #${v.numeroPedido}` : '-',
        new Date(v.dataHora).toLocaleString('pt-BR'),
        v.conta || 'Geral',
        v.material || '',
        v.quantidade || 0,
        Number(v.valorUnitario || 0).toFixed(2),
        Number(v.valorTotal || 0).toFixed(2),
        v.formaPagamento || '',
        v.status || '',
        v.obs || ''
      ]);
    });

    // Planilha 3: Compras
    const comprasData = [
      ['Data/Hora', 'Material / Insumo', 'Fornecedor', 'Quantidade', 'Valor Unit. (R$)', 'Total (R$)', 'Status Fechamento', 'NF / Doc', 'Observações']
    ];
    compras.forEach(c => {
      comprasData.push([
        new Date(c.dataHora).toLocaleString('pt-BR'),
        c.material || '',
        c.fornecedor || '',
        c.quantidade || 0,
        Number(c.valorUnitario || 0).toFixed(2),
        Number(c.valorTotal || 0).toFixed(2),
        c.statusFechamento || 'Pendente',
        c.nf || '',
        c.obs || ''
      ]);
    });

    // Planilha 4: Estoque
    const estoqueData = [
      ['Material', 'Categoria', 'Compras (Entradas)', 'Aumentos Manuais (+)', 'Pedidos (Saídas)', 'Abatimentos Manuais (-)', 'Saldo em Estoque', 'Custo Médio (R$)', 'Valor Total em Estoque (R$)']
    ];
    estoque.forEach(e => {
      estoqueData.push([
        e.nome,
        e.categoria,
        e.totalEntrada,
        e.totalEntradaManual,
        e.totalSaida,
        e.totalAbatido,
        e.saldo,
        e.custoMedio.toFixed(2),
        e.valorEstoqueAtual.toFixed(2)
      ]);
    });

    // Cria o Workbook
    const wb = XLSX.utils.book_new();
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    const wsVendas = XLSX.utils.aoa_to_sheet(vendasData);
    const wsCompras = XLSX.utils.aoa_to_sheet(comprasData);
    const wsEstoque = XLSX.utils.aoa_to_sheet(estoqueData);

    XLSX.utils.book_append_sheet(wb, wsResumo, 'Fechamento Geral');
    XLSX.utils.book_append_sheet(wb, wsVendas, 'Pedidos');
    XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras de Materiais');
    XLSX.utils.book_append_sheet(wb, wsEstoque, 'Controle de Estoque');

    // Nome do arquivo com data
    const nomeArquivo = `Fechamento_Empresa_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  },

  // --- BACKUP JSON ---
  exportBackupJSON() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      compras: this.getCompras(),
      vendas: this.getVendas(),
      fechamentos: this.getFechamentos(),
      abatimentos: this.getAjustesEstoque(),
      settings: this.getSettings()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_colaborador_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.compras) localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(data.compras));
      if (data.vendas) localStorage.setItem(this.KEYS.VENDAS, JSON.stringify(data.vendas));
      if (data.fechamentos) localStorage.setItem(this.KEYS.FECHAMENTOS, JSON.stringify(data.fechamentos));
      if (data.abatimentos) localStorage.setItem(this.KEYS.ABATIMENTOS, JSON.stringify(data.abatimentos));
      if (data.settings) localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    } catch (e) {
      alert('Arquivo de backup inválido!');
      return false;
    }
  }
};

// Inicializa o storage
StorageEngine.init();
