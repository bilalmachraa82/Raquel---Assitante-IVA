import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Bot, Receipt } from 'lucide-react';
import { Invoice, Classification, TaxField, TaxFieldLabels, InvoiceStatus } from '../types';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

export default function InvoiceModal({ invoice, onClose, onSave }: InvoiceModalProps) {
  const [classification, setClassification] = useState<Classification>(invoice.classification);
  const [taxField, setTaxField] = useState<number | string>(invoice.taxField || '');
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);

  // When classification changes, reset Tax Field if it's Personal
  useEffect(() => {
    if (classification === Classification.PERSONAL) {
      setTaxField('');
    }
  }, [classification]);

  const handleSave = () => {
    const updatedInvoice: Invoice = {
      ...invoice,
      classification,
      taxField: taxField ? Number(taxField) as TaxField : null,
      status: InvoiceStatus.APPROVED // Auto approve on manual save
    };
    onSave(updatedInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Receipt size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800">Detalhe da Fatura</h2>
                <p className="text-xs text-slate-500">{invoice.atcud}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Document Data */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Dados do Documento</h3>
                 
                 <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-100">
                    <div className="flex justify-between">
                       <span className="text-sm text-slate-500">Emitente</span>
                       <span className="text-sm font-medium text-slate-900">{invoice.nameIssuer}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-sm text-slate-500">NIF</span>
                       <span className="text-sm font-medium text-slate-900">{invoice.nifIssuer}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-sm text-slate-500">Data</span>
                       <span className="text-sm font-medium text-slate-900">{invoice.date}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                       <span className="text-sm text-slate-500">Total</span>
                       <span className="text-lg font-bold text-slate-900">
                          {invoice.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                       </span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-400">Total IVA</span>
                       <span className="text-slate-600">
                          {invoice.totalVat.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                       </span>
                    </div>
                 </div>

                 {/* AI Insight */}
                 <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                       <Bot size={18} className="text-indigo-600 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold text-indigo-800 mb-1">Análise Raquel AI</p>
                          <p className="text-xs text-indigo-700 leading-relaxed">{invoice.aiJustification}</p>
                          <div className="mt-2 text-xs font-medium text-indigo-600">
                             Confiança: {(invoice.confidence * 100).toFixed(0)}%
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Classification Controls */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Classificação Contabilística</h3>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Despesa</label>
                       <select 
                          className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={classification}
                          onChange={(e) => setClassification(e.target.value as Classification)}
                       >
                          <option value={Classification.ACTIVITY}>Atividade (Dedutível)</option>
                          <option value={Classification.PERSONAL}>Pessoal (Não Dedutível)</option>
                          <option value={Classification.MIXED}>Misto / A Rever</option>
                          <option value={Classification.PENDING}>Pendente</option>
                       </select>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">
                          Campo IVA (Declaração Periódica)
                       </label>
                       <select 
                          className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                          value={taxField}
                          onChange={(e) => setTaxField(e.target.value)}
                          disabled={classification === Classification.PERSONAL}
                       >
                          <option value="">Selecione o campo...</option>
                          {Object.entries(TaxFieldLabels).map(([key, label]) => (
                             <option key={key} value={key}>{label}</option>
                          ))}
                       </select>
                       {classification === Classification.PERSONAL && (
                          <p className="mt-1 text-xs text-slate-400">
                             Não aplicável para despesas pessoais.
                          </p>
                       )}
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Itens / Descrição</label>
                       <textarea 
                          className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          rows={4}
                          defaultValue={invoice.itemsDescription}
                          readOnly
                       />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
           <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
           >
              Cancelar
           </button>
           <button 
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center transition-colors"
           >
              <Save size={16} className="mr-2" />
              Guardar e Aprovar
           </button>
        </div>
      </div>
    </div>
  );
}