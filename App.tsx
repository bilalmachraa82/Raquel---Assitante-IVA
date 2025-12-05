import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  FileText, 
  Settings, 
  Menu, 
  X,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Loader2,
  Scan
} from 'lucide-react';
import { Invoice, InvoiceStatus, ViewState, Classification, TaxField } from './types';
import { INITIAL_INVOICES } from './constants';
import DashboardView from './components/DashboardView';
import InvoicesView from './components/InvoicesView';
import InvoiceModal from './components/InvoiceModal';
import LandingPage from './components/LandingPage';

// Declare Tesseract on window
declare global {
  interface Window {
    Tesseract: any;
  }
}

export default function App() {
  // Navigation State
  const [showLanding, setShowLanding] = useState(true);

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate global stats for sidebar badges
  // MOVED UP to ensure hooks are always called in the same order
  const pendingCount = useMemo(() => 
    invoices.filter(i => i.status === InvoiceStatus.PENDING || i.status === InvoiceStatus.REVIEW_REQUIRED).length, 
  [invoices]);

  // If showing landing page, render it exclusively
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  // Toggle Sidebar for mobile
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle invoice selection for editing
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Handle saving changes from the modal
  const handleSaveInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Trigger file selection
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Helper function to parse text using Regex
  const parseInvoiceText = (text: string) => {
    // 1. Find NIF (9 digits)
    const nifMatch = text.match(/\b\d{9}\b/);
    const nif = nifMatch ? nifMatch[0] : null;

    // 2. Find Date (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY)
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|(\d{2}[/-]\d{2}[/-]\d{4})/);
    let date = null;
    if (dateMatch) {
      date = dateMatch[0].replace(/\//g, '-');
      // Simple normalization to YYYY-MM-DD if needed could go here
    }

    // 3. Find Total (Look for "Total" followed by numbers)
    // Matches: Total 123.45 or Total: 123,45
    const totalMatch = text.match(/Total[:\s]*(\d+[.,]\d{2})/i);
    let total = 0;
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(',', '.'));
    }

    // 4. Find ATCUD
    const atcudMatch = text.match(/AT[A-Z0-9]+-[0-9]+/);
    const atcud = atcudMatch ? atcudMatch[0] : null;

    // 5. Heuristic Classification
    let classification = Classification.PENDING;
    let taxField = null;
    let justification = "Não foi possível determinar a categoria.";

    const lowerText = text.toLowerCase();

    if (lowerText.includes('restaurante') || lowerText.includes('refeição') || lowerText.includes('mesa')) {
      classification = Classification.PERSONAL;
      justification = "Palavras-chave 'Restaurante/Refeição' encontradas.";
    } else if (lowerText.includes('combustível') || lowerText.includes('gasóleo') || lowerText.includes('gasolina') || lowerText.includes('galp') || lowerText.includes('bp')) {
      classification = Classification.ACTIVITY;
      taxField = TaxField.F23;
      justification = "Palavras-chave de combustível encontradas.";
    } else if (lowerText.includes('staples') || lowerText.includes('papel') || lowerText.includes('escritório')) {
      classification = Classification.ACTIVITY;
      taxField = TaxField.F23;
      justification = "Material de escritório detectado.";
    } else if (lowerText.includes('worten') || lowerText.includes('fnac') || lowerText.includes('computador')) {
      classification = Classification.ACTIVITY;
      taxField = TaxField.F24;
      justification = "Equipamento informático (possível imobilizado).";
    }

    // Estimate VAT (approx 23% of total if not found)
    const vat = total > 0 ? total * 0.187 : 0; // Rough estimate back from gross

    // 6. Attempt to find a name (heuristic: first non-empty line)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const name = lines.length > 0 ? lines[0].substring(0, 50).trim() : null;

    return {
      nif,
      name,
      date,
      total,
      vat,
      atcud,
      classification,
      taxField,
      justification,
      description: text.substring(0, 100).replace(/\n/g, ' ') + '...'
    };
  };

  // Tesseract OCR Processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus('A carregar motor OCR (Tesseract)...');

    try {
      if (!window.Tesseract) {
        throw new Error("Tesseract.js não carregou correctamente.");
      }

      setProcessingStatus('A ler texto da imagem...');
      
      const result = await window.Tesseract.recognize(
        file,
        'por', // Portuguese language
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProcessingStatus(`A ler texto... ${(m.progress * 100).toFixed(0)}%`);
            }
          }
        }
      );

      const text = result.data.text;
      console.log("OCR Result:", text);
      
      setProcessingStatus('A analisar dados...');
      const extractedData = parseInvoiceText(text);

      const newInvoice: Invoice = {
        id: `100${invoices.length + 1}`,
        nifIssuer: extractedData.nif || '999999990',
        nameIssuer: extractedData.name || 'Desconhecido (OCR)',
        date: extractedData.date || new Date().toISOString().split('T')[0],
        total: extractedData.total || 0,
        totalVat: extractedData.vat || 0,
        atcud: extractedData.atcud || `AT-OCR-${Math.floor(Math.random() * 1000)}`,
        status: InvoiceStatus.REVIEW_REQUIRED,
        classification: extractedData.classification,
        taxField: extractedData.taxField,
        confidence: 0.65, // Lower confidence for basic OCR compared to AI
        aiJustification: `Dados extraídos via OCR. Requer revisão manual para confirmar valores e categoria. ${extractedData.justification}`,
        itemsDescription: extractedData.description || 'Conteúdo extraído via OCR',
        quarter: 'Q1_2025'
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setCurrentView('invoices');
      
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Erro ao processar imagem. Tente uma imagem mais clara.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Raquel IVA</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('invoices')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'invoices' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Receipt className="mr-3 h-5 w-5" />
                Faturas
                {pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white py-0.5 px-2 rounded-full text-xs">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button 
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
              >
                <FileText className="mr-3 h-5 w-5" />
                Relatórios
              </button>
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configuração</p>
            <nav className="space-y-1">
              <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <Settings className="mr-3 h-5 w-5" />
                Regras IA
              </button>
              <button 
                onClick={() => setShowLanding(true)}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sair
              </button>
            </nav>
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
              AS
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">AllSyn Accounting</p>
              <p className="text-xs text-slate-400">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload}
        />

        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="mr-4 text-slate-500 hover:text-slate-700 lg:hidden"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-slate-800">
                {currentView === 'dashboard' ? 'Visão Geral - Q1 2025' : 'Gestão de Faturas'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
               <button 
                onClick={handleImportClick}
                disabled={isProcessing}
                className={`hidden md:flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
               >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {processingStatus || 'A Processar...'}
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Digitalizar Fatura (OCR)
                    </>
                  )}
               </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50 relative">
          {currentView === 'dashboard' ? (
            <DashboardView invoices={invoices} onViewInvoices={() => setCurrentView('invoices')} />
          ) : (
            <InvoicesView 
              invoices={invoices} 
              onSelectInvoice={handleSelectInvoice}
            />
          )}
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {isModalOpen && selectedInvoice && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={handleCloseModal}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );
}