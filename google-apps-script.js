/**
 * =======================================================================
 * GOOGLE APPS SCRIPT - BACKEND 100% INTEGRADO (PEDIDOS, COMPRAS, ESTOQUE)
 * =======================================================================
 * 
 * ⚠️ ATENÇÃO - PARA ATIVAR A EXCLUSÃO E SINCRONIZAÇÃO TOTAL:
 * 
 * 1. Abra a sua planilha no Google Sheets (planilhas.google.com).
 * 2. No menu superior, clique em: Extensões > Apps Script.
 * 3. Apague QUALQUER código existente e cole TODO este arquivo.
 * 4. Clique no ícone de DISQUETE 💾 (ou aperte Ctrl+S) para salvar!
 * 5. Clique em "Implantar" (canto superior direito):
 *    -> Clique em "Gerenciar implantações"
 *    -> Clique no ícone do LÁPIS (Editar)
 *    -> Em "Versão", selecione "Nova versão"
 *    -> Clique em "Implantar"
 *    (Isso atualiza o Web App imediatamente sem mudar de URL!)
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Aba de Vendas / Pedidos
  var sheetVendas = ss.getSheetByName("Vendas");
  if (!sheetVendas) {
    sheetVendas = ss.insertSheet("Vendas");
    sheetVendas.appendRow(["ID", "NumeroPedido", "DataHora", "Conta", "Material_Produto", "Quantidade", "ValorUnitario", "ValorTotal", "FormaPagamento", "Status", "Obs"]);
    formatHeader(sheetVendas);
  }
  
  // 2. Aba de Compras de Materiais
  var sheetCompras = ss.getSheetByName("Compras");
  if (!sheetCompras) {
    sheetCompras = ss.insertSheet("Compras");
    sheetCompras.appendRow(["ID", "DataHora", "Material_Insumo", "Fornecedor", "Quantidade", "ValorUnitario", "ValorTotal", "StatusFechamento", "NF_Comprovante", "Obs"]);
    formatHeader(sheetCompras);
  }

  // 3. Aba de Fechamentos Consolidados
  var sheetFechamentos = ss.getSheetByName("Fechamentos");
  if (!sheetFechamentos) {
    sheetFechamentos = ss.insertSheet("Fechamentos");
    sheetFechamentos.appendRow(["ID", "DataFechamento", "Periodo", "TotalCompras", "TotalVendas", "SaldoOperacional", "ItensAuditados", "Responsavel", "Obs"]);
    formatHeader(sheetFechamentos);
  }

  // 4. Aba de Ajustes Manuais de Estoque (Aumentos e Abatimentos à Mão)
  var sheetAjustes = ss.getSheetByName("AjustesEstoque");
  if (!sheetAjustes) {
    sheetAjustes = ss.insertSheet("AjustesEstoque");
    sheetAjustes.appendRow(["ID", "DataHora", "Tipo", "Material_Placa", "Quantidade", "Motivo"]);
    formatHeader(sheetAjustes);
  }

  // 5. Aba de Catálogo de Placas Controladas (MDF e Acrílico)
  var sheetCatalogo = ss.getSheetByName("Catalogo");
  if (!sheetCatalogo) {
    sheetCatalogo = ss.insertSheet("Catalogo");
    sheetCatalogo.appendRow(["ID", "Nome", "Categoria", "Espessura"]);
    formatHeader(sheetCatalogo);
  }
}

function formatHeader(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground("#0f172a");
  range.setFontColor("#38bdf8");
  range.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

// Atualiza a linha se o ID já existir, ou adiciona ao final
function upsertRow(sheet, id, newRowValues) {
  if (!sheet || !id) return false;
  var targetId = String(id).trim();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === targetId) {
      var range = sheet.getRange(i + 1, 1, 1, newRowValues.length);
      range.setValues([newRowValues]);
      return true;
    }
  }
  sheet.appendRow(newRowValues);
  return false;
}

// Remove a linha pelo ID (de trás para frente para não alterar índices)
function deleteRowById(sheet, id) {
  if (!sheet || !id) return false;
  var targetId = String(id).trim();
  var data = sheet.getDataRange().getValues();
  var deleted = false;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return deleted;
}

// =======================================================================
// RECEBER DADOS DO PC OU CELULAR (POST)
// =======================================================================
function doPost(e) {
  try {
    setupSheets();
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- ADICIONAR / ATUALIZAR PEDIDO (VENDA) ---
    if (data.action === "add_venda") {
      var sheet = ss.getSheetByName("Vendas");
      var row = [
        data.id || Utilities.getUuid(),
        data.numeroPedido ? ("Pedido #" + data.numeroPedido) : "",
        data.dataHora || new Date().toISOString(),
        data.conta || "Geral",
        data.material || "",
        Number(data.quantidade || 0),
        Number(data.valorUnitario || 0),
        Number(data.valorTotal || 0),
        data.formaPagamento || "Dinheiro/Pix",
        data.status || "Finalizado",
        data.obs || ""
      ];
      upsertRow(sheet, row[0], row);
      return createJsonResponse({ success: true, message: "Pedido registrado com sucesso!" });
    }
    
    // --- ADICIONAR / ATUALIZAR COMPRA ---
    if (data.action === "add_compra") {
      var sheet = ss.getSheetByName("Compras");
      var row = [
        data.id || Utilities.getUuid(),
        data.dataHora || new Date().toISOString(),
        data.material || "",
        data.fornecedor || "",
        Number(data.quantidade || 0),
        Number(data.valorUnitario || 0),
        Number(data.valorTotal || 0),
        data.statusFechamento || "Finalizado",
        data.nf || "",
        data.obs || ""
      ];
      upsertRow(sheet, row[0], row);
      return createJsonResponse({ success: true, message: "Compra registrada com sucesso!" });
    }

    // --- ADICIONAR / ATUALIZAR AJUSTE DE ESTOQUE (AUMENTAR OU ABATER) ---
    if (data.action === "add_ajuste") {
      var sheetAjustes = ss.getSheetByName("AjustesEstoque");
      var row = [
        data.id || Utilities.getUuid(),
        data.dataHora || new Date().toISOString(),
        data.tipo === "aumentar" ? "Aumento (+)" : "Abatimento (-)",
        data.material || "",
        Number(data.quantidade || 0),
        data.motivo || ""
      ];
      upsertRow(sheetAjustes, row[0], row);
      return createJsonResponse({ success: true, message: "Ajuste de estoque registrado com sucesso!" });
    }

    // --- ADICIONAR / ATUALIZAR MATERIAL NO CATÁLOGO ---
    if (data.action === "add_material") {
      var sheetCat = ss.getSheetByName("Catalogo");
      var row = [
        data.id || Utilities.getUuid(),
        data.nome || "",
        data.categoria || "MDF",
        data.espessura || ""
      ];
      upsertRow(sheetCat, row[0], row);
      return createJsonResponse({ success: true, message: "Material salvo no catálogo!" });
    }

    // --- REGISTRAR FECHAMENTO ---
    if (data.action === "fechamento") {
      var sheet = ss.getSheetByName("Fechamentos");
      var row = [
        data.id || Utilities.getUuid(),
        data.dataFechamento || new Date().toISOString(),
        data.periodo || "",
        Number(data.totalCompras || 0),
        Number(data.totalVendas || 0),
        Number(data.saldoOperacional || 0),
        data.itensAuditados || "",
        data.responsavel || "Sistema",
        data.obs || ""
      ];
      upsertRow(sheet, row[0], row);
      return createJsonResponse({ success: true, message: "Fechamento registrado na planilha!" });
    }

    // --- EXCLUSÃO DE PEDIDO ---
    if (data.action === "delete_venda") {
      var sheet = ss.getSheetByName("Vendas");
      var ok = deleteRowById(sheet, data.id);
      return createJsonResponse({ success: true, message: "Pedido removido da planilha!", deleted: ok });
    }

    // --- EXCLUSÃO DE COMPRA ---
    if (data.action === "delete_compra") {
      var sheet = ss.getSheetByName("Compras");
      var ok = deleteRowById(sheet, data.id);
      return createJsonResponse({ success: true, message: "Compra removida da planilha!", deleted: ok });
    }

    // --- EXCLUSÃO DE AJUSTE DE ESTOQUE ---
    if (data.action === "delete_ajuste") {
      var sheet = ss.getSheetByName("AjustesEstoque");
      var ok = deleteRowById(sheet, data.id);
      return createJsonResponse({ success: true, message: "Ajuste removido da planilha!", deleted: ok });
    }

    // --- EXCLUSÃO DE MATERIAL DO CATÁLOGO ---
    if (data.action === "delete_material") {
      var sheet = ss.getSheetByName("Catalogo");
      var ok = deleteRowById(sheet, data.id);
      return createJsonResponse({ success: true, message: "Material removido do catálogo!", deleted: ok });
    }

    // --- SINCRONIZAÇÃO EM LOTE COMPLETA (INCLUINDO EXCLUSÕES PENDENTES) ---
    if (data.action === "sync_all") {
      // 1. Processa exclusões pendentes primeiro
      if (data.deletions && data.deletions.length > 0) {
        data.deletions.forEach(function(del) {
          if (del.type === "venda") deleteRowById(ss.getSheetByName("Vendas"), del.id);
          else if (del.type === "compra") deleteRowById(ss.getSheetByName("Compras"), del.id);
          else if (del.type === "ajuste") deleteRowById(ss.getSheetByName("AjustesEstoque"), del.id);
          else if (del.type === "material") deleteRowById(ss.getSheetByName("Catalogo"), del.id);
        });
      }

      // 2. Compras
      if (data.compras && data.compras.length > 0) {
        var sheetCompras = ss.getSheetByName("Compras");
        data.compras.forEach(function(item) {
          upsertRow(sheetCompras, item.id, [
            item.id,
            item.dataHora,
            item.material || "",
            item.fornecedor || "",
            Number(item.quantidade || 0),
            Number(item.valorUnitario || 0),
            Number(item.valorTotal || 0),
            item.statusFechamento || "Finalizado",
            item.nf || "",
            item.obs || ""
          ]);
        });
      }

      // 3. Vendas / Pedidos
      if (data.vendas && data.vendas.length > 0) {
        var sheetVendas = ss.getSheetByName("Vendas");
        data.vendas.forEach(function(item) {
          upsertRow(sheetVendas, item.id, [
            item.id,
            item.numeroPedido ? ("Pedido #" + item.numeroPedido) : "",
            item.dataHora,
            item.conta || "Geral",
            item.material || "",
            Number(item.quantidade || 0),
            Number(item.valorUnitario || 0),
            Number(item.valorTotal || 0),
            item.formaPagamento || "Dinheiro/Pix",
            item.status || "Finalizado",
            item.obs || ""
          ]);
        });
      }

      // 4. Ajustes de Estoque
      if (data.ajustes && data.ajustes.length > 0) {
        var sheetAjustes = ss.getSheetByName("AjustesEstoque");
        data.ajustes.forEach(function(item) {
          upsertRow(sheetAjustes, item.id, [
            item.id,
            item.dataHora,
            item.tipo === "aumentar" ? "Aumento (+)" : "Abatimento (-)",
            item.material || "",
            Number(item.quantidade || 0),
            item.motivo || ""
          ]);
        });
      }

      // 5. Catálogo de Materiais
      if (data.catalogo && data.catalogo.length > 0) {
        var sheetCat = ss.getSheetByName("Catalogo");
        data.catalogo.forEach(function(item) {
          upsertRow(sheetCat, item.id, [
            item.id,
            item.nome || "",
            item.categoria || "MDF",
            item.espessura || ""
          ]);
        });
      }

      return createJsonResponse({ success: true, message: "Sincronização em lote finalizada com sucesso!" });
    }

    return createJsonResponse({ success: false, error: "Ação não reconhecida" });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// =======================================================================
// CONSULTAR DADOS REMOTOS DA NUVEM (GET)
// =======================================================================
function doGet(e) {
  try {
    setupSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var sheetVendas = ss.getSheetByName("Vendas");
    var sheetCompras = ss.getSheetByName("Compras");
    var sheetAjustes = ss.getSheetByName("AjustesEstoque");
    var sheetFechamentos = ss.getSheetByName("Fechamentos");
    var sheetCatalogo = ss.getSheetByName("Catalogo");
    
    var vendas = getRowsAsObjects(sheetVendas);
    var compras = getRowsAsObjects(sheetCompras);
    var ajustes = getRowsAsObjects(sheetAjustes);
    var fechamentos = getRowsAsObjects(sheetFechamentos);
    var catalogo = getRowsAsObjects(sheetCatalogo);
    
    return createJsonResponse({
      success: true,
      data: {
        vendas: vendas,
        compras: compras,
        ajustes: ajustes,
        fechamentos: fechamentos,
        catalogo: catalogo
      }
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getRowsAsObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      row[headers[j]] = val;
    }
    if (row.ID && String(row.ID).trim() !== "") {
      rows.push(row);
    }
  }
  return rows;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
