/**
 * ==========================================================================
 * COLABORADOR - APLICAÇÃO PRINCIPAL (UI CONTROLLER)
 * Experiência Ultra-Ágil para Celular + Gestão e Fechamento Completo
 * ==========================================================================
 */

const App = {
  activeTab: 'tab-dashboard',
  currentModalType: 'venda', // 'venda' ou 'compra'
  vendasStatusFiltro: 'todos', // 'todos', 'Finalizado', 'Pago/Aguardando', 'Não pago'
  comprasStatusFiltro: 'todos', // 'todos', 'Finalizado', 'Pago/Aguardando', 'Não pago'
  estoqueCategoriaFiltro: 'todos', // 'todos', 'MDF', 'Acrílico'
  modalMaterialFiltro: 'todos', // 'todos', 'MDF', 'Acrílico'
  currentAjusteTipo: 'aumentar', // 'aumentar' ou 'abater'

  init() {
    this.bindEvents();
    this.setupChips();
    this.renderAll();
    this.updateSyncBadge();

    // Sincroniza automaticamente ao iniciar (em segundo plano)
    this.syncWithCloud(true);

    // Sincronização periódica automática a cada 10 segundos
    setInterval(() => {
      this.syncWithCloud(true);
    }, 10000);

    // Sincroniza ao focar na janela ou voltar para a aba do navegador
    window.addEventListener('focus', () => this.syncWithCloud(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncWithCloud(true);
      }
    });

    // Registra Service Worker se suportado (para PWA)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // PWA cache worker
      });
    }
  },

  // Vincula todos os eventos de clique, teclado e toque
  bindEvents() {
    // Navegação Desktop e Mobile
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const targetId = el.getAttribute('data-tab-target');
        this.switchTab(targetId);
      });
    });

    // Clique no Badge de Sincronização do Topo
    const headerSyncBadge = document.getElementById('header-sync-badge');
    if (headerSyncBadge) {
      headerSyncBadge.addEventListener('click', () => {
        this.syncWithCloud(false);
      });
    }

    // Botão FAB Flutuante (+ Novo Lançamento)
    const fabBtn = document.getElementById('btn-fab-open');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        this.openQuickModal('venda');
      });
    }

    // Fechar Modal de Lançamento
    const modalBackdrop = document.getElementById('modal-quick-entry');
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeQuickModal());
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeQuickModal();
      });
    }

    // Modal de Ajuste Manual de Placas (Aumentar e Abater à Mão)
    const btnAbrirAbater = document.getElementById('btn-abrir-abater-placa');
    if (btnAbrirAbater) {
      btnAbrirAbater.addEventListener('click', () => this.abrirModalAjuste('', 'abater'));
    }
    const btnAbrirAumentar = document.getElementById('btn-abrir-aumentar-estoque');
    if (btnAbrirAumentar) {
      btnAbrirAumentar.addEventListener('click', () => this.abrirModalAjuste('', 'aumentar'));
    }
    const btnCloseAbater = document.getElementById('btn-close-abater-modal');
    const modalAbater = document.getElementById('modal-abater-placa');
    if (btnCloseAbater) {
      btnCloseAbater.addEventListener('click', () => this.fecharModalAbater());
    }
    if (modalAbater) {
      modalAbater.addEventListener('click', (e) => {
        if (e.target === modalAbater) this.fecharModalAbater();
      });
    }

    // Toggle Aumentar vs Abater no modal de ajuste
    const toggleAjusteAum = document.getElementById('toggle-ajuste-aumentar');
    const toggleAjusteAbt = document.getElementById('toggle-ajuste-abater');
    if (toggleAjusteAum && toggleAjusteAbt) {
      toggleAjusteAum.addEventListener('click', () => this.setModalAjusteTipo('aumentar'));
      toggleAjusteAbt.addEventListener('click', () => this.setModalAjusteTipo('abater'));
    }

    // Atalhos rápidos de quantidade (+0.5, +1, +2, +5, +10)
    document.querySelectorAll('.chip-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-add-qtd')) || 0;
        const inputQtd = document.getElementById('abater-input-qtd');
        if (inputQtd) {
          inputQtd.value = val;
          this.atualizarPreviewSaldoAjuste();
        }
      });
    });

    // Preview dinâmico de saldo ao alterar placa ou quantidade no ajuste
    const inputAjusteQtd = document.getElementById('abater-input-qtd');
    const selectAjustePlaca = document.getElementById('abater-select-placa');
    if (inputAjusteQtd) {
      inputAjusteQtd.addEventListener('input', () => this.atualizarPreviewSaldoAjuste());
    }
    if (selectAjustePlaca) {
      selectAjustePlaca.addEventListener('change', () => this.atualizarPreviewSaldoAjuste());
    }

    const formAbater = document.getElementById('form-abater-placa');
    if (formAbater) {
      formAbater.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleConfirmarAjusteEstoque();
      });
    }

    // Modal de Cadastro de Nova Placa / Material
    const btnAbrirNovoMat = document.getElementById('btn-abrir-novo-material');
    const btnConfigNovoMat = document.getElementById('btn-config-novo-material');
    if (btnAbrirNovoMat) {
      btnAbrirNovoMat.addEventListener('click', () => this.abrirModalNovoMaterial());
    }
    if (btnConfigNovoMat) {
      btnConfigNovoMat.addEventListener('click', () => this.abrirModalNovoMaterial());
    }
    const btnCloseNovoMat = document.getElementById('btn-close-novo-material-modal');
    const modalNovoMat = document.getElementById('modal-novo-material');
    if (btnCloseNovoMat) {
      btnCloseNovoMat.addEventListener('click', () => this.fecharModalNovoMaterial());
    }
    if (modalNovoMat) {
      modalNovoMat.addEventListener('click', (e) => {
        if (e.target === modalNovoMat) this.fecharModalNovoMaterial();
      });
    }
    const formNovoMat = document.getElementById('form-novo-material');
    if (formNovoMat) {
      formNovoMat.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSalvarNovoMaterial();
      });
    }

    // Toggle Pedido vs Compra no Modal
    const toggleVenda = document.getElementById('toggle-type-venda');
    const toggleCompra = document.getElementById('toggle-type-compra');
    if (toggleVenda && toggleCompra) {
      toggleVenda.addEventListener('click', () => this.setModalType('venda'));
      toggleCompra.addEventListener('click', () => this.setModalType('compra'));
    }

    // Filtros de Categoria de Placas no Modal
    document.querySelectorAll('.modal-filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.modalMaterialFiltro = btn.getAttribute('data-matcat');
        this.setupChips();
      });
    });

    // Monitora digitação do material no modal para atualizar o badge de estoque
    const inputMat = document.getElementById('modal-input-material');
    if (inputMat) {
      inputMat.addEventListener('input', () => this.atualizarBadgeMaterial(inputMat.value));
      inputMat.addEventListener('change', () => this.atualizarBadgeMaterial(inputMat.value));
    }

    // Filtros de Categoria na Aba de Estoque
    document.querySelectorAll('.estoque-filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.estoque-filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.estoqueCategoriaFiltro = btn.getAttribute('data-cat');
        this.renderEstoque();
      });
    });

    // Filtros por Status na Aba de Pedidos (Vendas)
    document.querySelectorAll('.vendas-filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.vendas-filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.vendasStatusFiltro = btn.getAttribute('data-status') || 'todos';
        this.renderVendasList();
      });
    });

    // Filtros por Status na Aba de Compras
    document.querySelectorAll('.compras-filtro-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.compras-filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.comprasStatusFiltro = btn.getAttribute('data-status') || 'todos';
        this.renderComprasList();
      });
    });

    // Cálculo automático de Total no Modal
    const inputQtd = document.getElementById('modal-input-qtd');
    const inputUnit = document.getElementById('modal-input-unit');
    const inputTotal = document.getElementById('modal-input-total');

    const recalculateTotal = () => {
      const q = parseFloat(inputQtd.value) || 0;
      const u = parseFloat(inputUnit.value) || 0;
      if (q > 0 && u > 0) {
        inputTotal.value = (q * u).toFixed(2);
      }
    };

    if (inputQtd) inputQtd.addEventListener('input', recalculateTotal);
    if (inputUnit) inputUnit.addEventListener('input', recalculateTotal);

    // Envio do formulário do Modal de Lançamento
    const formQuick = document.getElementById('form-quick-entry');
    if (formQuick) {
      formQuick.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveQuickEntry();
      });
    }

    // Ações de Fechamento
    const btnNovoFechamento = document.getElementById('btn-gravar-fechamento');
    if (btnNovoFechamento) {
      btnNovoFechamento.addEventListener('click', () => this.handleGravarFechamento());
    }

    // Exportações
    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => {
        const dIni = document.getElementById('filtro-data-inicio')?.value;
        const dFim = document.getElementById('filtro-data-fim')?.value;
        StorageEngine.exportToExcel(dIni, dFim);
        this.showToast('Planilha Excel gerada com sucesso!', 'success');
      });
    }

    const btnPrintPdf = document.getElementById('btn-print-pdf');
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', () => {
        window.print();
      });
    }

    const btnBackupJson = document.getElementById('btn-backup-json');
    if (btnBackupJson) {
      btnBackupJson.addEventListener('click', () => {
        StorageEngine.exportBackupJSON();
        this.showToast('Backup JSON exportado!', 'success');
      });
    }

    const inputRestoreJson = document.getElementById('input-restore-json');
    if (inputRestoreJson) {
      inputRestoreJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (StorageEngine.importBackupJSON(event.target.result)) {
            this.showToast('Dados restaurados com sucesso!', 'success');
            this.renderAll();
            this.syncWithCloud(true);
          }
        };
        reader.readAsText(file);
      });
    }

    // Formulário de Configurações
    const formSettings = document.getElementById('form-settings');
    if (formSettings) {
      formSettings.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveSettings();
      });
    }

    // Botões do Gerenciador de Catálogo de Placas (JSON)
    const btnSaveCat = document.getElementById('btn-save-catalogo-json');
    if (btnSaveCat) {
      btnSaveCat.addEventListener('click', () => {
        const raw = document.getElementById('config-catalogo-json')?.value;
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) throw new Error('O JSON deve ser uma lista (array) de placas!');
          StorageEngine.saveCatalogo(parsed);
          this.setupChips();
          this.renderEstoque();
          this.syncWithCloud(true);
          this.showToast('Catálogo de placas atualizado com sucesso!', 'success');
        } catch (err) {
          this.showToast('Erro no JSON: ' + err.message, 'error');
        }
      });
    }

    const btnResetCat = document.getElementById('btn-reset-catalogo');
    if (btnResetCat) {
      btnResetCat.addEventListener('click', () => {
        if (confirm('Deseja restaurar a lista padrão de placas MDF e Acrílico?')) {
          StorageEngine.saveCatalogo(DEFAULT_CATALOGO_PLACAS);
          const ta = document.getElementById('config-catalogo-json');
          if (ta) ta.value = JSON.stringify(DEFAULT_CATALOGO_PLACAS, null, 2);
          this.setupChips();
          this.renderEstoque();
          this.showToast('Catálogo padrão restaurado!', 'success');
        }
      });
    }

    // Botão de Sincronizar Agora com Google Sheets
    const btnManualSync = document.getElementById('btn-manual-sync');
    if (btnManualSync) {
      btnManualSync.addEventListener('click', () => {
        this.syncWithCloud(false);
      });
    }

    // Filtros de Data na Central de Fechamento
    const filtroDataIni = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    if (filtroDataIni) filtroDataIni.addEventListener('change', () => this.renderFechamento());
    if (filtroDataFim) filtroDataFim.addEventListener('change', () => this.renderFechamento());

    // Definir datas iniciais padrão para o mês atual
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
    if (filtroDataIni && !filtroDataIni.value) filtroDataIni.value = primeiroDia;
    if (filtroDataFim && !filtroDataFim.value) filtroDataFim.value = ultimoDia;
  },

  // Troca de Abas
  switchTab(tabId) {
    this.activeTab = tabId;

    // Atualiza botões
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      const match = el.getAttribute('data-tab-target') === tabId;
      el.classList.toggle('active', match);
    });

    // Atualiza painéis
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Atualiza dados específicos se necessário
    if (tabId === 'tab-estoque') this.renderEstoque();
    if (tabId === 'tab-fechamento') this.renderFechamento();
    if (tabId === 'tab-vendas') this.renderVendasList();
    if (tabId === 'tab-compras') this.renderComprasList();
    if (tabId === 'tab-dashboard') this.renderDashboard();
    if (tabId === 'tab-config') this.renderSettingsForm();
  },

  // Retorna data/hora local formatada para o input datetime-local
  getLocalDatetimeInput(dateObj = new Date()) {
    const d = new Date(dateObj);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  },

  // Normaliza status para uma das 3 opções permitidas: Finalizado, Pago/Aguardando, Não pago
  normalizeStatus(status, defaultVal = 'Finalizado') {
    if (!status) return defaultVal;
    const s = String(status).trim().toLowerCase();
    if (s === 'finalizado' || s === 'concluído' || s === 'concluido' || s === 'conferido') {
      return 'Finalizado';
    }
    if (s === 'pago/aguardando' || s === 'aguardando' || s === 'aguardando chegar' || s === 'pendente') {
      return 'Pago/Aguardando';
    }
    if (s === 'não pago' || s === 'nao pago' || s === 'cancelado' || s === 'em aberto') {
      return 'Não pago';
    }
    return defaultVal;
  },

  // Retorna o badge visual com as cores correspondentes (Verde, Laranja/Âmbar, Vermelho)
  getStatusBadge(rawStatus) {
    const status = this.normalizeStatus(rawStatus);
    if (status === 'Finalizado') {
      return `<span class="entry-badge badge-status-finalizado"><i class="fa-solid fa-circle-check"></i> Finalizado</span>`;
    }
    if (status === 'Pago/Aguardando') {
      return `<span class="entry-badge badge-status-aguardando"><i class="fa-solid fa-clock"></i> Pago/Aguardando</span>`;
    }
    if (status === 'Não pago') {
      return `<span class="entry-badge badge-status-naopago"><i class="fa-solid fa-circle-xmark"></i> Não pago</span>`;
    }
    return `<span class="entry-badge badge-status-finalizado">${status}</span>`;
  },

  // Abre Modal de Lançamento Rápido (Novo)
  openQuickModal(type = 'venda') {
    // Limpa estado de edição
    const editIdInput = document.getElementById('modal-edit-id');
    const pedidoNumInput = document.getElementById('modal-pedido-num');
    if (editIdInput) editIdInput.value = '';
    if (pedidoNumInput) pedidoNumInput.value = '';

    // Preenche a data e hora atual de forma automática
    const dateInput = document.getElementById('modal-input-data');
    if (dateInput) {
      dateInput.value = this.getLocalDatetimeInput();
    }

    // Limpa formulário
    document.getElementById('form-quick-entry')?.reset();
    if (dateInput) dateInput.value = this.getLocalDatetimeInput();

    const inputStatus = document.getElementById('modal-input-status');
    if (inputStatus) inputStatus.value = 'Finalizado';

    this.setModalType(type);

    const modalBackdrop = document.getElementById('modal-quick-entry');
    if (modalBackdrop) {
      modalBackdrop.classList.add('show');
      // Foca automaticamente no campo principal
      setTimeout(() => {
        const firstInput = document.getElementById('modal-input-material');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  },

  // Abre Modal para Edição de Pedido ou Compra existente (COM ABAS BLOQUEADAS)
  openEditModal(type, item) {
    if (!item) return;

    this.setModalType(type);

    // BLOQUEIA A ALTERNÂNCIA DE ABAS NO MODO EDIÇÃO:
    // Quem edita Compra NÃO PODE acessar Pedidos e vice-versa!
    const togglePill = document.querySelector('.type-toggle-pill');
    if (togglePill) {
      togglePill.style.display = 'none';
    }

    const editIdInput = document.getElementById('modal-edit-id');
    const pedidoNumInput = document.getElementById('modal-pedido-num');
    const dateInput = document.getElementById('modal-input-data');
    const titleEl = document.getElementById('modal-sheet-title');
    const btnSubmit = document.getElementById('modal-btn-submit');

    if (editIdInput) editIdInput.value = item.id;
    if (dateInput && item.dataHora) {
      dateInput.value = this.getLocalDatetimeInput(new Date(item.dataHora));
    }

    // Preenche campos comuns
    const inputMat = document.getElementById('modal-input-material');
    const inputQtd = document.getElementById('modal-input-qtd');
    const inputUnit = document.getElementById('modal-input-unit');
    const inputTotal = document.getElementById('modal-input-total');
    const inputObs = document.getElementById('modal-input-obs');
    const inputStatus = document.getElementById('modal-input-status');

    if (inputMat) {
      inputMat.value = item.material || '';
      this.atualizarBadgeMaterial(item.material || '');
    }
    if (inputQtd) inputQtd.value = item.quantidade || '';
    if (inputUnit) inputUnit.value = item.valorUnitario || '';
    if (inputTotal) inputTotal.value = (Number(item.valorTotal) || 0).toFixed(2);
    if (inputObs) inputObs.value = item.obs || '';

    // Define status unificado (Finalizado, Pago/Aguardando, Não pago)
    const isVenda = type === 'venda';
    if (inputStatus) {
      const currentStatus = isVenda ? item.status : item.statusFechamento;
      inputStatus.value = this.normalizeStatus(currentStatus);
    }

    if (isVenda) {
      if (pedidoNumInput) pedidoNumInput.value = item.numeroPedido || '';
      const inputConta = document.getElementById('modal-input-conta');
      const inputPag = document.getElementById('modal-input-pagamento');
      if (inputConta) inputConta.value = item.conta || '';
      if (inputPag) inputPag.value = item.formaPagamento || 'Pix';

      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--blue-cyan);"></i> Editar Pedido #${item.numeroPedido || ''}`;
      }
      if (btnSubmit) {
        btnSubmit.textContent = `Salvar Alterações (Pedido #${item.numeroPedido || ''})`;
        btnSubmit.className = 'btn btn-primary btn-block';
      }
    } else {
      const inputFornec = document.getElementById('modal-input-fornecedor');
      const inputNf = document.getElementById('modal-input-nf');
      if (inputFornec) inputFornec.value = item.fornecedor || '';
      if (inputNf) inputNf.value = item.nf || '';

      if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--emerald-green);"></i> Editar Compra de Material`;
      }
      if (btnSubmit) {
        btnSubmit.textContent = 'Salvar Alterações da Compra';
        btnSubmit.className = 'btn btn-success btn-block';
      }
    }

    const modalBackdrop = document.getElementById('modal-quick-entry');
    if (modalBackdrop) modalBackdrop.classList.add('show');
  },

  // Atalhos de chamada para edição a partir da lista
  editVendaItem(id) {
    const item = StorageEngine.getVendas().find(v => v.id === id);
    if (item) this.openEditModal('venda', item);
  },

  editCompraItem(id) {
    const item = StorageEngine.getCompras().find(c => c.id === id);
    if (item) this.openEditModal('compra', item);
  },

  closeQuickModal() {
    const modalBackdrop = document.getElementById('modal-quick-entry');
    if (modalBackdrop) modalBackdrop.classList.remove('show');
    // Restaura exibição do seletor de abas para novos cadastros
    const togglePill = document.querySelector('.type-toggle-pill');
    if (togglePill) togglePill.style.display = 'flex';

    // Limpa campos e dados de edição
    const editIdInput = document.getElementById('modal-edit-id');
    const pedidoNumInput = document.getElementById('modal-pedido-num');
    if (editIdInput) editIdInput.value = '';
    if (pedidoNumInput) pedidoNumInput.value = '';
    document.getElementById('form-quick-entry')?.reset();
    const inputStatus = document.getElementById('modal-input-status');
    if (inputStatus) inputStatus.value = 'Finalizado';
    document.getElementById('modal-material-estoque-badge').innerHTML = '';
  },

  setModalType(type) {
    this.currentModalType = type;
    const isVenda = type === 'venda';

    const toggleVenda = document.getElementById('toggle-type-venda');
    const toggleCompra = document.getElementById('toggle-type-compra');
    toggleVenda?.classList.toggle('active', isVenda);
    toggleCompra?.classList.toggle('active', !isVenda);

    const titleEl = document.getElementById('modal-sheet-title');
    const btnSubmit = document.getElementById('modal-btn-submit');
    const editId = document.getElementById('modal-edit-id')?.value;

    if (!editId) {
      // Garante que o seletor de abas esteja visível no modo novo cadastro
      const togglePill = document.querySelector('.type-toggle-pill');
      if (togglePill) togglePill.style.display = 'flex';

      if (isVenda) {
        const nextNum = StorageEngine.getNextNumeroPedido();
        if (titleEl) {
          titleEl.innerHTML = `<i class="fa-solid fa-bolt" style="color:var(--blue-cyan);"></i> Novo Pedido #${nextNum}`;
        }
        if (btnSubmit) {
          btnSubmit.textContent = `Confirmar Pedido #${nextNum}`;
          btnSubmit.className = 'btn btn-primary btn-block';
        }
      } else {
        if (titleEl) {
          titleEl.innerHTML = `<i class="fa-solid fa-truck-ramp-box" style="color:var(--emerald-green);"></i> Nova Compra / Insumo`;
        }
        if (btnSubmit) {
          btnSubmit.textContent = 'Confirmar Compra';
          btnSubmit.className = 'btn btn-success btn-block';
        }
      }
    }

    // Ajusta campos dinâmicos
    const rowConta = document.getElementById('modal-group-conta');
    const rowFornecedor = document.getElementById('modal-group-fornecedor');
    const rowPagamento = document.getElementById('modal-group-pagamento');
    const rowNf = document.getElementById('modal-group-nf');
    const labelMaterial = document.getElementById('modal-label-material');
    const labelData = document.getElementById('modal-label-data');
    const labelStatus = document.getElementById('modal-label-status');

    if (rowConta) rowConta.style.display = isVenda ? 'block' : 'none';
    if (rowFornecedor) rowFornecedor.style.display = isVenda ? 'none' : 'block';
    if (rowPagamento) rowPagamento.style.display = isVenda ? 'block' : 'none';
    if (rowNf) rowNf.style.display = isVenda ? 'none' : 'block';
    if (labelStatus) labelStatus.textContent = isVenda ? 'Status do Pedido:' : 'Status da Compra:';

    if (labelMaterial) {
      labelMaterial.innerHTML = isVenda 
        ? '<i class="fa-solid fa-shapes" style="color:var(--blue-cyan);"></i> Material / Produto Vendido:' 
        : '<i class="fa-solid fa-shapes" style="color:var(--emerald-green);"></i> Material / Insumo Comprado:';
    }
    if (labelData) {
      labelData.innerHTML = `<i class="fa-regular fa-clock" style="color:var(--blue-cyan);"></i> Data e Hora do ${isVenda ? 'Pedido' : 'Lançamento'}:`;
    }

    this.setupChips();
  },

  // Configura chips rápidos e datalist com o catálogo de placas
  setupChips() {
    const settings = StorageEngine.getSettings();
    const catalogo = StorageEngine.getCatalogo();
    const containerConta = document.getElementById('chips-contas');
    const containerMateriais = document.getElementById('chips-materiais');
    const datalist = document.getElementById('lista-materiais-catalogo');

    // Preenche o datalist com as placas cadastradas
    if (datalist) {
      datalist.innerHTML = catalogo.map(p => `<option value="${p.nome}">`).join('');
    }

    // Chips de Contas / Clientes
    if (containerConta && settings.contas) {
      containerConta.innerHTML = '';
      settings.contas.forEach(c => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = c;
        chip.addEventListener('click', () => {
          const inputConta = document.getElementById('modal-input-conta');
          if (inputConta) inputConta.value = c;
          this.triggerHaptic();
        });
        containerConta.appendChild(chip);
      });
    }

    // Chips de Placas com filtro por Categoria (Todos, MDF, Acrílico)
    if (containerMateriais) {
      containerMateriais.innerHTML = '';
      let placas = catalogo;
      if (this.modalMaterialFiltro && this.modalMaterialFiltro !== 'todos') {
        placas = catalogo.filter(p => p.categoria.toLowerCase() === this.modalMaterialFiltro.toLowerCase());
      }

      placas.forEach(p => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = p.nome;
        chip.addEventListener('click', () => {
          const inputMat = document.getElementById('modal-input-material');
          if (inputMat) {
            inputMat.value = p.nome;
            this.atualizarBadgeMaterial(p.nome);
          }
          this.triggerHaptic();
        });
        containerMateriais.appendChild(chip);
      });
    }
  },

  // Atualiza indicador visual de estoque em tempo real
  atualizarBadgeMaterial(nome) {
    const badge = document.getElementById('modal-material-estoque-badge');
    if (!badge) return;
    if (!nome || !nome.trim()) {
      badge.innerHTML = '';
      return;
    }
    const isControlada = StorageEngine.isPlacaControlada(nome);
    if (isControlada) {
      badge.innerHTML = '<span style="color:var(--emerald-green);"><i class="fa-solid fa-boxes-stacked"></i> 📦 Placa rastreada no Estoque</span>';
    } else {
      badge.innerHTML = '<span style="color:var(--text-dim);"><i class="fa-solid fa-cart-shopping"></i> 🛒 Insumo Geral (Não vai para o estoque de placas)</span>';
    }
  },

  // Salvar Lançamento Rápido (Criação ou Edição)
  async handleSaveQuickEntry() {
    const isVenda = this.currentModalType === 'venda';
    const editId = document.getElementById('modal-edit-id')?.value;
    const material = document.getElementById('modal-input-material')?.value.trim();
    const qtd = parseFloat(document.getElementById('modal-input-qtd')?.value) || 0;
    const unit = parseFloat(document.getElementById('modal-input-unit')?.value) || 0;
    const total = parseFloat(document.getElementById('modal-input-total')?.value) || (qtd * unit);
    const obs = document.getElementById('modal-input-obs')?.value.trim();

    // Data automática vinda do campo
    const dataInputVal = document.getElementById('modal-input-data')?.value;
    const dataHora = dataInputVal ? new Date(dataInputVal).toISOString() : new Date().toISOString();

    if (!material) {
      this.showToast('Por favor, informe o material!', 'error');
      return;
    }
    if (qtd <= 0) {
      this.showToast('A quantidade deve ser maior que zero!', 'error');
      return;
    }

    const statusVal = this.normalizeStatus(document.getElementById('modal-input-status')?.value || 'Finalizado');

    if (isVenda) {
      const conta = document.getElementById('modal-input-conta')?.value.trim() || 'Pedido Balcão';
      const formaPag = document.getElementById('modal-input-pagamento')?.value || 'Pix';
      const pedidoNumExistente = parseInt(document.getElementById('modal-pedido-num')?.value) || null;

      if (editId) {
        // Atualiza pedido existente
        await StorageEngine.updateVenda(editId, {
          dataHora,
          conta,
          material,
          quantidade: qtd,
          valorUnitario: unit,
          valorTotal: total,
          formaPagamento: formaPag,
          status: statusVal,
          obs
        });
        this.showToast('Pedido atualizado com sucesso!', 'success');
      } else {
        // Cria novo pedido
        const novoPedido = await StorageEngine.addVenda({
          dataHora,
          conta,
          material,
          quantidade: qtd,
          valorUnitario: unit,
          valorTotal: total,
          formaPagamento: formaPag,
          status: statusVal,
          obs
        });
        this.showToast(`Pedido #${novoPedido.numeroPedido} registrado!`, 'success');
      }
    } else {
      const fornecedor = document.getElementById('modal-input-fornecedor')?.value.trim() || 'Geral';
      const nf = document.getElementById('modal-input-nf')?.value.trim() || '';

      if (editId) {
        // Atualiza compra existente
        await StorageEngine.updateCompra(editId, {
          dataHora,
          material,
          fornecedor,
          quantidade: qtd,
          valorUnitario: unit,
          valorTotal: total,
          statusFechamento: statusVal,
          nf,
          obs
        });
        this.showToast('Compra atualizada com sucesso!', 'success');
      } else {
        // Cria nova compra
        await StorageEngine.addCompra({
          dataHora,
          material,
          fornecedor,
          quantidade: qtd,
          valorUnitario: unit,
          valorTotal: total,
          statusFechamento: statusVal,
          nf,
          obs
        });
        this.showToast('Compra de material registrada!', 'success');
      }
    }

    // Feedback háptico no celular
    this.triggerHaptic();
    this.closeQuickModal();
    this.renderAll();
    this.syncWithCloud(true);
  },

  // Grava o Fechamento Consolidado Oficial
  async handleGravarFechamento() {
    const dIni = document.getElementById('filtro-data-inicio')?.value;
    const dFim = document.getElementById('filtro-data-fim')?.value;
    const periodo = `${dIni || 'Início'} até ${dFim || 'Hoje'}`;

    let compras = StorageEngine.getCompras();
    let vendas = StorageEngine.getVendas();

    if (dIni && dFim) {
      const d1 = new Date(dIni);
      const d2 = new Date(dFim);
      d2.setHours(23, 59, 59, 999);
      compras = compras.filter(c => new Date(c.dataHora) >= d1 && new Date(c.dataHora) <= d2);
      vendas = vendas.filter(v => new Date(v.dataHora) >= d1 && new Date(v.dataHora) <= d2);
    }

    const totalCompras = compras.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const totalVendas = vendas.reduce((acc, v) => acc + (Number(v.valorTotal) || 0), 0);
    const saldo = totalVendas - totalCompras;

    const auditadosInfo = `${compras.length} compras / ${vendas.length} vendas auditadas`;

    const fechamento = {
      periodo,
      totalCompras,
      totalVendas,
      saldoOperacional: saldo,
      itensAuditados: auditadosInfo,
      responsavel: 'Operador Celular',
      obs: 'Fechamento registrado via painel de controle'
    };

    await StorageEngine.addFechamento(fechamento);
    this.triggerHaptic();
    this.showToast('Fechamento consolidado e salvo com sucesso!', 'success');
    this.renderFechamento();
  },

  // Renderiza toda a interface
  renderAll() {
    this.renderDashboard();
    this.renderVendasList();
    this.renderComprasList();
    this.renderEstoque();
    this.renderFechamento();
  },

  // Dashboard de Indicadores Rápidos
  renderDashboard() {
    const compras = StorageEngine.getCompras();
    const vendas = StorageEngine.getVendas();
    const estoque = StorageEngine.calculateStock();

    // Filtro rápido de Hoje
    const hojeStr = new Date().toISOString().slice(0, 10);
    const comprasHoje = compras.filter(c => c.dataHora.slice(0, 10) === hojeStr);
    const vendasHoje = vendas.filter(v => v.dataHora.slice(0, 10) === hojeStr);

    const totalVendasHoje = vendasHoje.reduce((a, b) => a + (Number(b.valorTotal) || 0), 0);
    const totalComprasHoje = comprasHoje.reduce((a, b) => a + (Number(b.valorTotal) || 0), 0);

    const totalGeralVendas = vendas.reduce((a, b) => a + (Number(b.valorTotal) || 0), 0);
    const totalGeralCompras = compras.reduce((a, b) => a + (Number(b.valorTotal) || 0), 0);
    const saldoGeral = totalGeralVendas - totalGeralCompras;

    // Itens com estoque baixo (menor ou igual a 5 unidades)
    const itensCriticos = estoque.filter(item => item.saldo <= 5);

    // Atualiza Cards de Indicadores
    this.setText('dash-vendas-hoje', `R$ ${totalVendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    this.setText('dash-compras-hoje', `R$ ${totalComprasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    this.setText('dash-saldo-geral', `R$ ${saldoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    this.setText('dash-itens-criticos', `${itensCriticos.length} itens`);

    // Resumos numéricos
    this.setText('dash-vendas-qtd', `${vendasHoje.length} pedidos hoje`);
    this.setText('dash-compras-qtd', `${comprasHoje.length} compras hoje`);
    this.setText('dash-saldo-sub', `${vendas.length} pedidos vs ${compras.length} compras`);

    // Renderiza lista dos últimos lançamentos combinados
    const feed = document.getElementById('dashboard-recent-feed');
    if (!feed) return;

    const combined = [
      ...vendas.map(v => ({ ...v, type: 'venda' })),
      ...compras.map(c => ({ ...c, type: 'compra' }))
    ].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)).slice(0, 8);

    if (combined.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-receipt"></i>
          <p>Nenhum lançamento registrado ainda.<br>Toque no botão <b>+ NOVO REGISTRO</b> para começar!</p>
        </div>
      `;
      return;
    }

    feed.innerHTML = combined.map(item => this.createFeedItemHtml(item)).join('');
  },

  createFeedItemHtml(item) {
    const isVenda = item.type === 'venda';
    const dataFormatada = new Date(item.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(item.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const valor = Number(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const badgeText = isVenda ? (item.conta || 'Pedido') : (item.fornecedor || 'Compra');
    const rawStatus = isVenda ? item.status : item.statusFechamento;
    const statusBadge = this.getStatusBadge(rawStatus);

    return `
      <div class="entry-card">
        <div class="entry-icon-badge ${item.type}">
          <i class="fa-solid ${isVenda ? 'fa-clipboard-list' : 'fa-box-archive'}"></i>
        </div>
        <div class="entry-details">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            ${isVenda ? `<span class="entry-badge badge-pedido">PEDIDO #${item.numeroPedido || 1}</span>` : ''}
            <span class="entry-title">${item.material}</span>
            ${statusBadge}
          </div>
          <div class="entry-meta">
            <span class="entry-badge ${isVenda ? 'badge-blue' : 'badge-green'}">${badgeText}</span>
            <span>Qtd: <b>${item.quantidade}</b></span>
            <span><i class="fa-regular fa-clock"></i> ${dataFormatada}</span>
          </div>
        </div>
        <div class="entry-values">
          <div class="entry-price ${item.type}">${isVenda ? '+' : '-'} R$ ${valor}</div>
          <div class="entry-qty">${isVenda ? (item.formaPagamento || 'Recebido') : (item.nf || 'Compra')}</div>
        </div>
      </div>
    `;
  },

  // Renderiza Lista de Pedidos
  renderVendasList() {
    const container = document.getElementById('vendas-list-container');
    if (!container) return;

    let vendas = StorageEngine.getVendas();
    if (vendas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clipboard-list"></i>
          <p>Nenhum pedido registrado ainda.<br>Clique em "+ Novo Pedido" para cadastrar o primeiro!</p>
        </div>
      `;
      return;
    }

    // Aplica filtro por status se selecionado
    if (this.vendasStatusFiltro && this.vendasStatusFiltro !== 'todos') {
      vendas = vendas.filter(v => this.normalizeStatus(v.status) === this.vendasStatusFiltro);
    }

    if (vendas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-filter"></i>
          <p>Nenhum pedido com o status "<b>${this.vendasStatusFiltro}</b>".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = vendas.map(v => {
      const dataStr = new Date(v.dataHora).toLocaleString('pt-BR');
      const total = Number(v.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const unit = Number(v.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const statusBadge = this.getStatusBadge(v.status);

      return `
        <div class="entry-card">
          <div class="entry-icon-badge venda">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <div class="entry-details">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:3px;">
              <span class="entry-badge badge-pedido">PEDIDO #${v.numeroPedido || 1}</span>
              <span class="entry-title">${v.material}</span>
              ${statusBadge}
            </div>
            <div class="entry-meta">
              <span class="entry-badge badge-blue">${v.conta || 'Pedido Balcão'}</span>
              <span>Qtd: <b>${v.quantidade}</b> (R$ ${unit} un)</span>
              <span>${v.formaPagamento || 'Pix'}</span>
              <span><i class="fa-regular fa-clock"></i> ${dataStr}</span>
            </div>
            ${v.obs ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">Obs: ${v.obs}</div>` : ''}
          </div>
          <div class="entry-values">
            <div class="entry-price venda">+ R$ ${total}</div>
            <div class="entry-actions" style="margin-top:6px; justify-content:flex-end;">
              <button class="btn-icon-edit" onclick="App.editVendaItem('${v.id}')" title="Editar Pedido">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon-del" onclick="App.deleteVendaItem('${v.id}')" title="Excluir">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteVendaItem(id) {
    if (confirm('Deseja excluir este pedido?')) {
      await StorageEngine.deleteVenda(id);
      this.renderAll();
      this.showToast('Pedido removido com sucesso!', 'info');
      this.syncWithCloud(true);
    }
  },

  // Renderiza Lista de Compras
  renderComprasList() {
    const container = document.getElementById('compras-list-container');
    if (!container) return;

    let compras = StorageEngine.getCompras();
    if (compras.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-truck"></i>
          <p>Nenhuma compra de material cadastrada ainda.</p>
        </div>
      `;
      return;
    }

    // Aplica filtro por status se selecionado
    if (this.comprasStatusFiltro && this.comprasStatusFiltro !== 'todos') {
      compras = compras.filter(c => this.normalizeStatus(c.statusFechamento) === this.comprasStatusFiltro);
    }

    if (compras.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-filter"></i>
          <p>Nenhuma compra com o status "<b>${this.comprasStatusFiltro}</b>".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = compras.map(c => {
      const dataStr = new Date(c.dataHora).toLocaleString('pt-BR');
      const total = Number(c.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const unit = Number(c.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const statusBadge = this.getStatusBadge(c.statusFechamento);

      return `
        <div class="entry-card">
          <div class="entry-icon-badge compra">
            <i class="fa-solid fa-boxes-packing"></i>
          </div>
          <div class="entry-details">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:3px;">
              <span class="entry-title">${c.material}</span>
              ${statusBadge}
            </div>
            <div class="entry-meta">
              <span class="entry-badge badge-green">${c.fornecedor || 'Fornecedor'}</span>
              <span>Qtd: <b>${c.quantidade}</b> (R$ ${unit} un)</span>
              ${c.nf ? `<span>Doc: ${c.nf}</span>` : ''}
              <span><i class="fa-regular fa-clock"></i> ${dataStr}</span>
            </div>
            ${c.obs ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">Obs: ${c.obs}</div>` : ''}
          </div>
          <div class="entry-values">
            <div class="entry-price compra">- R$ ${total}</div>
            <div class="entry-actions" style="margin-top:6px; justify-content:flex-end;">
              <button class="btn-icon-edit" onclick="App.editCompraItem('${c.id}')" title="Editar Compra">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon-del" onclick="App.deleteCompraItem('${c.id}')" title="Excluir">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteCompraItem(id) {
    if (confirm('Deseja excluir esta compra de material?')) {
      await StorageEngine.deleteCompra(id);
      this.renderAll();
      this.showToast('Compra removida!', 'info');
      this.syncWithCloud(true);
    }
  },

  // Renderiza Controle de Estoque (EXCLUSIVO PARA PLACAS DE MDF & ACRÍLICO)
  renderEstoque() {
    const tbody = document.getElementById('estoque-table-body');
    const cardsMobile = document.getElementById('estoque-cards-mobile');
    let estoque = StorageEngine.calculateStock();

    // Aplica filtro por categoria (Todos, MDF, Acrílico)
    if (this.estoqueCategoriaFiltro && this.estoqueCategoriaFiltro !== 'todos') {
      estoque = estoque.filter(item => item.categoria.toLowerCase() === this.estoqueCategoriaFiltro.toLowerCase());
    }

    if (estoque.length === 0) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Nenhuma placa encontrada nesta categoria.</td></tr>`;
      if (cardsMobile) cardsMobile.innerHTML = `<div class="empty-state"><i class="fa-solid fa-boxes-stacked"></i><p>Nenhuma placa encontrada.</p></div>`;
      this.renderAjustesHistorico();
      return;
    }

    // Tabela Desktop
    if (tbody) {
      tbody.innerHTML = estoque.map(item => {
        const isCritico = item.saldo <= 2;
        const totalEntradasTotal = item.totalEntrada + item.totalEntradaManual;
        const totalSaidasTotal = item.totalSaida + item.totalAbatido;
        const entradaDetalhe = item.totalEntradaManual > 0
          ? `<span style="font-size:0.72rem; color:var(--text-dim); display:block;">(${item.totalEntrada} compras, +${item.totalEntradaManual} manual)</span>`
          : '';
        const saidaDetalhe = item.totalAbatido > 0
          ? `<span style="font-size:0.72rem; color:var(--text-dim); display:block;">(${item.totalSaida} vendas, -${item.totalAbatido} manual)</span>`
          : '';

        return `
          <tr>
            <td><b>${item.nome}</b></td>
            <td><span class="entry-badge badge-blue">${item.categoria}</span></td>
            <td style="color:var(--emerald-green); font-weight:600;">
              + ${totalEntradasTotal} un
              ${entradaDetalhe}
            </td>
            <td style="color:var(--amber-orange); font-weight:600;">
              - ${totalSaidasTotal} un
              ${saidaDetalhe}
            </td>
            <td>
              <span class="entry-badge ${isCritico ? 'badge-amber' : 'badge-green'}" style="font-size:0.85rem; font-weight:800;">
                ${item.saldo} un
              </span>
            </td>
            <td>R$ ${item.custoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>
              <div style="display:flex; gap:6px; align-items:center;">
                <button class="btn btn-outline btn-sm" onclick="App.abrirModalAjuste('${item.nome}', 'aumentar')" style="border-color:var(--emerald-green); color:var(--emerald-green); padding:4px 9px; font-size:0.78rem; font-weight:700;" title="Aumentar quantidade à mão (+)">
                  <i class="fa-solid fa-plus"></i> Aumentar
                </button>
                <button class="btn btn-outline btn-sm" onclick="App.abrirModalAjuste('${item.nome}', 'abater')" style="border-color:var(--amber-orange); color:var(--amber-orange); padding:4px 9px; font-size:0.78rem; font-weight:700;" title="Abater quantidade à mão (-)">
                  <i class="fa-solid fa-minus"></i> Abater
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Cards Mobile
    if (cardsMobile) {
      cardsMobile.innerHTML = estoque.map(item => {
        const isCritico = item.saldo <= 2;
        const totalEntradasTotal = item.totalEntrada + item.totalEntradaManual;
        const totalSaidasTotal = item.totalSaida + item.totalAbatido;
        return `
          <div class="entry-card" style="flex-direction:column; align-items:stretch; gap:10px;">
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="entry-icon-badge ${isCritico ? 'badge-amber' : 'compra'}">
                  <i class="fa-solid fa-shapes"></i>
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:2px;">
                    <span class="entry-badge badge-blue">${item.categoria}</span>
                    <span class="entry-title">${item.nome}</span>
                  </div>
                  <div class="entry-meta">
                    <span>Entradas: <b style="color:var(--emerald-green)">+${totalEntradasTotal}</b> ${item.totalEntradaManual > 0 ? `(+${item.totalEntradaManual} m.)` : ''}</span>
                    <span>Saídas: <b style="color:var(--amber-orange)">-${totalSaidasTotal}</b> ${item.totalAbatido > 0 ? `(-${item.totalAbatido} m.)` : ''}</span>
                    <span>Custo Méd.: R$ ${item.custoMedio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div class="entry-price" style="color:${isCritico ? 'var(--amber-orange)' : 'var(--emerald-green)'}; font-size:1.15rem; font-weight:900; white-space:nowrap;">
                ${item.saldo} un
              </div>
            </div>

            <!-- Botões de Aumentar e Abater na mão para Mobile -->
            <div style="display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
              <button class="btn btn-outline btn-sm" onclick="App.abrirModalAjuste('${item.nome}', 'aumentar')" style="flex:1; border-color:var(--emerald-green); color:var(--emerald-green); padding:6px 10px; font-size:0.78rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px;">
                <i class="fa-solid fa-plus"></i> Aumentar à Mão
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.abrirModalAjuste('${item.nome}', 'abater')" style="flex:1; border-color:var(--amber-orange); color:var(--amber-orange); padding:6px 10px; font-size:0.78rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px;">
                <i class="fa-solid fa-minus"></i> Abater à Mão
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Renderiza também o histórico de ajustes
    this.renderAjustesHistorico();
  },

  renderAjustesHistorico() {
    const container = document.getElementById('estoque-ajustes-historico-list');
    const countBadge = document.getElementById('estoque-ajustes-count');
    if (!container) return;

    const ajustes = StorageEngine.getAjustesEstoque();
    if (countBadge) countBadge.textContent = `${ajustes.length} registro${ajustes.length !== 1 ? 's' : ''}`;

    if (ajustes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:24px 10px;">
          <i class="fa-solid fa-sliders" style="font-size:1.8rem; margin-bottom:8px;"></i>
          <p style="font-size:0.8rem;">Nenhum ajuste manual registrado ainda. Utilize "+ Aumentar à Mão" ou "- Abater à Mão" para movimentar quantidades.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = ajustes.slice(0, 20).map(a => {
      const isAumento = a.tipo === 'aumentar';
      const dataStr = new Date(a.dataHora).toLocaleString('pt-BR');
      const cor = isAumento ? 'var(--emerald-green)' : 'var(--amber-orange)';
      const icon = isAumento ? 'fa-plus' : 'fa-minus';
      const sinal = isAumento ? '+' : '-';
      const badgeClass = isAumento ? 'badge-green' : 'badge-amber';
      const labelTipo = isAumento ? 'Aumento Manual' : 'Abatimento Manual';

      return `
        <div class="entry-card" style="padding:10px 14px;">
          <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
            <div class="entry-icon-badge" style="width:36px; height:36px; font-size:0.85rem; background:rgba(${isAumento ? '16,185,129' : '245,158,11'}, 0.15); color:${cor}; border:1px solid ${cor};">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span class="entry-badge ${badgeClass}" style="font-size:0.65rem;">${labelTipo}</span>
                <span class="entry-title" style="font-size:0.85rem;">${a.material}</span>
              </div>
              <div class="entry-meta" style="font-size:0.72rem;">
                <span><i class="fa-regular fa-clock"></i> ${dataStr}</span>
                ${a.motivo ? `<span style="color:var(--text-dim);">• ${a.motivo}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
            <span style="font-weight:800; font-size:1rem; color:${cor};">
              ${sinal} ${a.quantidade} un
            </span>
            <button class="btn-icon-del" onclick="App.deleteAjusteManual('${a.id}')" title="Excluir este ajuste manual" style="padding:4px 6px;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteAjusteManual(id) {
    if (confirm('Deseja excluir este ajuste manual? O saldo do estoque será recalculado.')) {
      await StorageEngine.deleteAjusteEstoque(id);
      this.renderEstoque();
      this.renderDashboard();
      this.showToast('Ajuste removido e estoque recalculado!', 'info');
      this.syncWithCloud(true);
    }
  },

  // Modal para Ajustar (Aumentar ou Abater) Placa do Estoque Manualmente
  abrirModalAjuste(placaNome = '', tipo = 'aumentar') {
    this.currentAjusteTipo = tipo;
    const modal = document.getElementById('modal-abater-placa');
    const select = document.getElementById('abater-select-placa');
    const inputData = document.getElementById('abater-input-data');
    const inputQtd = document.getElementById('abater-input-qtd');
    const inputMotivo = document.getElementById('abater-input-motivo');

    if (inputData) inputData.value = this.getLocalDatetimeInput();
    if (inputQtd) inputQtd.value = '';
    if (inputMotivo) inputMotivo.value = '';

    if (select) {
      const catalogo = StorageEngine.getCatalogo();
      select.innerHTML = catalogo.map(p => `
        <option value="${p.nome}" ${p.nome === placaNome ? 'selected' : ''}>${p.nome} (${p.categoria})</option>
      `).join('');
    }

    this.atualizarVisualModalAjuste();
    this.atualizarPreviewSaldoAjuste();

    if (modal) modal.classList.add('show');
  },

  abrirModalAbater(placaNome = '') {
    this.abrirModalAjuste(placaNome, 'abater');
  },

  setModalAjusteTipo(tipo) {
    this.currentAjusteTipo = tipo;
    this.atualizarVisualModalAjuste();
    this.atualizarPreviewSaldoAjuste();
  },

  atualizarVisualModalAjuste() {
    const isAumento = this.currentAjusteTipo === 'aumentar';
    const btnAum = document.getElementById('toggle-ajuste-aumentar');
    const btnAbt = document.getElementById('toggle-ajuste-abater');
    const title = document.getElementById('modal-ajuste-titulo');
    const labelQtd = document.getElementById('ajuste-label-qtd');
    const inputMotivo = document.getElementById('abater-input-motivo');
    const submitBtn = document.getElementById('btn-submit-ajuste-placa');

    if (btnAum && btnAbt) {
      btnAum.classList.toggle('active', isAumento);
      btnAum.classList.toggle('aumentar', isAumento);
      btnAbt.classList.toggle('active', !isAumento);
      btnAbt.classList.toggle('abater', !isAumento);
    }

    if (title) {
      title.innerHTML = isAumento
        ? `<i class="fa-solid fa-circle-plus" style="color:var(--emerald-green);"></i> Aumentar Placa no Estoque`
        : `<i class="fa-solid fa-circle-minus" style="color:var(--amber-orange);"></i> Abater Placa do Estoque`;
      title.style.color = isAumento ? 'var(--emerald-green)' : 'var(--amber-orange)';
    }

    if (labelQtd) {
      labelQtd.textContent = isAumento ? 'Quantidade a Adicionar / Aumentar:' : 'Quantidade a Abater / Subtrair:';
    }

    if (inputMotivo) {
      inputMotivo.placeholder = isAumento
        ? 'Ex: Sobra reaproveitada de corte, devolução, acerto de contagem...'
        : 'Ex: Corte para pedidos da semana, refugo, teste, quebra...';
    }

    if (submitBtn) {
      submitBtn.innerHTML = isAumento
        ? `<i class="fa-solid fa-plus"></i> Confirmar Entrada de Placas`
        : `<i class="fa-solid fa-minus"></i> Confirmar Abatimento de Placas`;
      submitBtn.style.background = isAumento
        ? 'linear-gradient(135deg, #059669, #10b981)'
        : 'linear-gradient(135deg, #d97706, #f59e0b)';
      submitBtn.style.borderColor = isAumento ? '#10b981' : '#f59e0b';
    }
  },

  atualizarPreviewSaldoAjuste() {
    const preview = document.getElementById('ajuste-placa-saldo-preview');
    const placa = document.getElementById('abater-select-placa')?.value;
    const qtdInput = parseFloat(document.getElementById('abater-input-qtd')?.value) || 0;
    if (!preview || !placa) return;

    const estoque = StorageEngine.calculateStock();
    const item = estoque.find(e => e.nome.trim().toLowerCase() === placa.trim().toLowerCase());
    const saldoAtual = item ? item.saldo : 0;
    const isAumento = this.currentAjusteTipo === 'aumentar';
    const novoSaldo = isAumento ? (saldoAtual + qtdInput) : (saldoAtual - qtdInput);

    preview.innerHTML = `
      <span style="color:var(--text-muted);">Saldo atual: <b>${saldoAtual} un</b></span>
      ${qtdInput > 0 ? ` <i class="fa-solid fa-arrow-right" style="font-size:0.7rem; color:var(--text-dim); margin:0 4px;"></i> Novo saldo: <b style="color:${isAumento ? 'var(--emerald-green)' : (novoSaldo <= 2 ? 'var(--amber-orange)' : 'var(--emerald-green)')};">${novoSaldo} un</b>` : ''}
    `;
  },

  fecharModalAbater() {
    const modal = document.getElementById('modal-abater-placa');
    if (modal) modal.classList.remove('show');
    document.getElementById('form-abater-placa')?.reset();
    const preview = document.getElementById('ajuste-placa-saldo-preview');
    if (preview) preview.innerHTML = '';
  },

  handleConfirmarAjusteEstoque() {
    const placa = document.getElementById('abater-select-placa')?.value;
    const qtd = parseFloat(document.getElementById('abater-input-qtd')?.value) || 0;
    const dataVal = document.getElementById('abater-input-data')?.value;
    const dataHora = dataVal ? new Date(dataVal).toISOString() : new Date().toISOString();
    const isAumento = this.currentAjusteTipo === 'aumentar';
    const motivoDefault = isAumento ? 'Aumento manual no estoque' : 'Consumo manual de corte';
    const motivo = document.getElementById('abater-input-motivo')?.value.trim() || motivoDefault;

    if (!placa) {
      this.showToast('Selecione uma placa!', 'error');
      return;
    }
    if (qtd <= 0) {
      this.showToast('Informe uma quantidade válida!', 'error');
      return;
    }

    StorageEngine.addAjusteEstoque({
      tipo: this.currentAjusteTipo,
      material: placa,
      quantidade: qtd,
      dataHora,
      motivo
    });

    this.triggerHaptic();
    this.fecharModalAbater();
    this.renderAll();
    this.syncWithCloud(true);

    if (isAumento) {
      this.showToast(`Adicionado +${qtd} un de ${placa} ao estoque!`, 'success');
    } else {
      this.showToast(`Abatido -${qtd} un de ${placa} do estoque!`, 'success');
    }
  },

  handleConfirmarAbatimento() {
    this.handleConfirmarAjusteEstoque();
  },

  // --- MODAL DE CADASTRO DE NOVA PLACA / MATERIAL ---
  abrirModalNovoMaterial() {
    const modal = document.getElementById('modal-novo-material');
    const form = document.getElementById('form-novo-material');
    if (form) form.reset();
    if (modal) {
      modal.classList.add('show');
      setTimeout(() => {
        document.getElementById('novo-mat-nome')?.focus();
      }, 150);
    }
  },

  fecharModalNovoMaterial() {
    const modal = document.getElementById('modal-novo-material');
    if (modal) modal.classList.remove('show');
    document.getElementById('form-novo-material')?.reset();
  },

  handleSalvarNovoMaterial() {
    const nome = document.getElementById('novo-mat-nome')?.value.trim();
    const categoria = document.getElementById('novo-mat-categoria')?.value || 'MDF';
    const espessura = document.getElementById('novo-mat-espessura')?.value.trim() || '';
    const qtdInicial = parseFloat(document.getElementById('novo-mat-qtd-inicial')?.value) || 0;

    if (!nome) {
      this.showToast('Informe o nome da placa!', 'error');
      return;
    }

    try {
      StorageEngine.addMaterialCatalogo({
        nome,
        categoria,
        espessura,
        qtdInicial
      });

      this.triggerHaptic();
      this.fecharModalNovoMaterial();
      this.setupChips();
      this.renderEstoque();
      this.renderDashboard();
      this.syncWithCloud(true);

      // Atualiza o textarea de JSON na aba de configurações se estiver aberto
      const ta = document.getElementById('config-catalogo-json');
      if (ta) ta.value = JSON.stringify(StorageEngine.getCatalogo(), null, 2);

      const msgQtd = qtdInicial > 0 ? ` com saldo inicial de ${qtdInicial} un` : '';
      this.showToast(`Placa "${nome}" adicionada ao estoque com sucesso${msgQtd}!`, 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // Central de Fechamento Interno e Conciliação
  renderFechamento() {
    const dIni = document.getElementById('filtro-data-inicio')?.value;
    const dFim = document.getElementById('filtro-data-fim')?.value;

    let compras = StorageEngine.getCompras();
    let vendas = StorageEngine.getVendas();

    if (dIni && dFim) {
      const d1 = new Date(dIni);
      const d2 = new Date(dFim);
      d2.setHours(23, 59, 59, 999);
      compras = compras.filter(c => new Date(c.dataHora) >= d1 && new Date(c.dataHora) <= d2);
      vendas = vendas.filter(v => new Date(v.dataHora) >= d1 && new Date(v.dataHora) <= d2);
    }

    const totalCompras = compras.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0);
    const totalVendas = vendas.reduce((acc, v) => acc + (Number(v.valorTotal) || 0), 0);
    const saldo = totalVendas - totalCompras;

    // Atualiza cards de fechamento
    this.setText('fechamento-total-vendas', `R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    this.setText('fechamento-total-compras', `R$ ${totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    this.setText('fechamento-saldo-liquido', `R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    const elSaldo = document.getElementById('fechamento-saldo-liquido');
    if (elSaldo) {
      elSaldo.style.color = saldo >= 0 ? 'var(--blue-cyan)' : 'var(--crimson-red)';
    }

    // Histórico de fechamentos consolidados
    const histContainer = document.getElementById('fechamentos-historico-list');
    if (histContainer) {
      const fechamentos = StorageEngine.getFechamentos();
      if (fechamentos.length === 0) {
        histContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-file-invoice"></i><p>Nenhum fechamento consolidado gravado ainda.<br>Após conferir os números acima, clique em "Consolidar Fechamento" para arquivar o período.</p></div>`;
      } else {
        histContainer.innerHTML = fechamentos.map(f => `
          <div class="entry-card">
            <div class="entry-icon-badge venda">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div class="entry-details">
              <div class="entry-title">Fechamento: ${f.periodo || 'Período Geral'}</div>
              <div class="entry-meta">
                <span>Data: ${new Date(f.dataFechamento).toLocaleDateString('pt-BR')}</span>
                <span>Vendas: R$ ${Number(f.totalVendas).toFixed(2)}</span>
                <span>Compras: R$ ${Number(f.totalCompras).toFixed(2)}</span>
              </div>
            </div>
            <div class="entry-values">
              <div class="entry-price venda">Saldo: R$ ${Number(f.saldoOperacional).toFixed(2)}</div>
              <div class="entry-qty">${f.itensAuditados || 'Auditado'}</div>
            </div>
          </div>
        `).join('');
      }
    }
  },

  // Formulário de Configurações
  renderSettingsForm() {
    const settings = StorageEngine.getSettings();
    const inputUrl = document.getElementById('config-sheets-url');
    const inputNome = document.getElementById('config-empresa-nome');
    const inputContas = document.getElementById('config-contas-list');
    const inputMateriais = document.getElementById('config-materiais-list');
    const textareaJson = document.getElementById('config-catalogo-json');

    if (inputUrl) inputUrl.value = settings.sheetsUrl || '';
    if (inputNome) inputNome.value = settings.empresaNome || '';
    if (inputContas && settings.contas) inputContas.value = settings.contas.join(', ');
    if (inputMateriais && settings.materiais) inputMateriais.value = settings.materiais.join(', ');
    if (textareaJson) textareaJson.value = JSON.stringify(StorageEngine.getCatalogo(), null, 2);
  },

  handleSaveSettings() {
    const url = document.getElementById('config-sheets-url')?.value.trim() || '';
    const nome = document.getElementById('config-empresa-nome')?.value.trim() || 'Minha Empresa';
    const contasRaw = document.getElementById('config-contas-list')?.value || '';
    const materiaisRaw = document.getElementById('config-materiais-list')?.value || '';

    const contas = contasRaw.split(',').map(s => s.trim()).filter(Boolean);
    const materiais = materiaisRaw.split(',').map(s => s.trim()).filter(Boolean);

    StorageEngine.saveSettings({
      sheetsUrl: url,
      empresaNome: nome,
      contas: contas.length > 0 ? contas : ['Conta Principal', 'Conta 02', 'Balcão'],
      materiais: materiais.length > 0 ? materiais : DEFAULT_CATALOGO_PLACAS.map(p => p.nome)
    });

    this.setupChips();
    this.updateSyncBadge();
    this.showToast('Configurações salvas com sucesso!', 'success');
  },

  // Sincronização Completa com Feedback Visual
  async syncWithCloud(silent = false) {
    if (this._isSyncing) return;
    this._isSyncing = true;

    const dot = document.getElementById('header-sync-dot');
    const text = document.getElementById('header-sync-text');
    const icon = document.getElementById('header-sync-icon');

    const settings = StorageEngine.getSettings();
    if (!settings.sheetsUrl || !settings.sheetsUrl.startsWith('http')) {
      if (dot) dot.className = 'sync-dot offline';
      if (text) text.textContent = 'Modo Local (Offline)';
      if (icon) icon.classList.remove('fa-spin');
      this._isSyncing = false;
      if (!silent) this.showToast('Configure a URL do Google Apps Script nas Configurações!', 'info');
      return;
    }

    if (dot) dot.className = 'sync-dot syncing';
    if (text) text.textContent = 'Sincronizando...';
    if (icon) icon.classList.add('fa-spin');

    try {
      await StorageEngine.syncAll();
      this.renderAll();
      if (dot) dot.className = 'sync-dot';
      if (text) text.textContent = 'Nuvem Conectada';
      if (icon) icon.classList.remove('fa-spin');
      if (!silent) this.showToast('Dados sincronizados com o Google Sheets!', 'success');
    } catch (err) {
      console.warn('Erro na sincronização:', err);
      if (dot) dot.className = 'sync-dot offline';
      if (text) text.textContent = 'Erro ao Sincronizar';
      if (icon) icon.classList.remove('fa-spin');
      if (!silent) {
        this.showToast(err.message, 'error');
      }
    } finally {
      this._isSyncing = false;
    }
  },

  // Atualiza Badge do Topo
  updateSyncBadge() {
    const settings = StorageEngine.getSettings();
    const dot = document.getElementById('header-sync-dot');
    const text = document.getElementById('header-sync-text');

    if (!dot || !text) return;

    if (settings.sheetsUrl && settings.sheetsUrl.startsWith('http')) {
      dot.className = 'sync-dot';
      text.textContent = 'Nuvem Conectada';
    } else {
      dot.className = 'sync-dot offline';
      text.textContent = 'Modo Local (Offline)';
    }
  },

  // Disparo de vibração háptica no celular
  triggerHaptic() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([25, 20, 25]);
      } catch (e) {
        // Ignora caso navegador bloqueie vibração
      }
    }
  },

  // Toast Flutuante com Brilho
  showToast(message, type = 'info') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.className = `toast-notification ${type} show`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  },

  // Helper de texto
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
};

// Inicia aplicação após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
