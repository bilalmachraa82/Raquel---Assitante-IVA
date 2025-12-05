import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Invoice, InvoiceStatus, Classification } from '../types';

interface InvoicesViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

export default function InvoicesView({ invoices, onSelectInvoice }: InvoicesViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.nameIssuer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.nifIssuer.includes(searchTerm) ||
      inv.atcud.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && (inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.REVIEW_REQUIRED);
    if (filterStatus === 'approved') return matchesSearch && inv.status === InvoiceStatus.APPROVED;
    
    return matchesSearch;
  });

  const handleExport = () => {
    // Basic CSV Export Implementation
    const headers = ['ID', 'Data', 'Emitente', 'NIF', 'Total', 'IVA', 'Classificação', 'Campo IVA', 'Status'];
    const csvContent = [
      headers.join(';'),
      ...filteredInvoices.map(inv => [
        inv.id,
        inv.date,
        `"${inv.nameIssuer}"`, // Quote name to handle commas
        inv.nifIssuer,
        inv.total.toFixed(2).replace('.', ','),
        inv.totalVat.toFixed(2).replace('.', ','),
        inv.classification,
        inv.taxField || '',
        inv.status
      ].join(';'))
    ].join('\n');

    // Add BOM for Excel to recognize UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `raquel_iva_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch(status) {
      case InvoiceStatus.APPROVED: return <CheckCircle size={16} className="text-emerald-500" />;
      case InvoiceStatus.REJECTED: return <XCircle size={16} className="text-red-500" />;
      case InvoiceStatus.REVIEW_REQUIRED: return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getClassificationBadge = (classification: Classification) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch(classification) {
      case Classification.ACTIVITY: return <span className={`${baseClasses} bg-emerald-100 text-emerald-800`}>Actividade</span>;
      case Classification.PERSONAL: return <span className={`${baseClasses} bg-red-100 text-red-800`}>Pessoal</span>;
      case Classification.MIXED: return <span className={`${baseClasses} bg-indigo-100 text-indigo-800`}>Misto</span>;
      default: return <span className={`${baseClasses} bg-slate-100 text-slate-600`}>Pendente</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar por NIF, Nome..." 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
           </div>
           
           <select 
             className="pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="all">Todos os Estados</option>
             <option value="pending">Revisão Pendente</option>
             <option value="approved">Aprovados</option>
           </select>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel (CSV)
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Emitente</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">IVA</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Classificação</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Confiança IA</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredInvoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelectInvoice(invoice)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{invoice.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{invoice.nameIssuer}</span>
                    <span className="text-xs text-slate-500">{invoice.nifIssuer}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                  {invoice.total.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
                  {invoice.totalVat.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getClassificationBadge(invoice.classification)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                   <div className="flex items-center justify-center">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                      <div 
                        className={`h-1.5 rounded-full ${invoice.confidence > 0.8 ? 'bg-emerald-500' : invoice.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${invoice.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{(invoice.confidence * 100).toFixed(0)}%</span>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                   <div className="flex items-center justify-center">
                     {getStatusIcon(invoice.status)}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <ChevronRight size={18} className="text-slate-400" />
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                  Nenhuma fatura encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}