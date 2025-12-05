import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ArrowRight, AlertCircle, Euro, FileCheck, FileWarning, CheckCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, Classification } from '../types';

interface DashboardViewProps {
  invoices: Invoice[];
  onViewInvoices: () => void;
}

const COLORS = ['#4F46E5', '#EF4444', '#F59E0B', '#10B981'];

export default function DashboardView({ invoices, onViewInvoices }: DashboardViewProps) {
  
  const stats = useMemo(() => {
    const totalDocs = invoices.length;
    const totalValue = invoices.reduce((acc, curr) => acc + curr.total, 0);
    const totalDeductible = invoices
      .filter(i => i.classification === Classification.ACTIVITY)
      .reduce((acc, curr) => acc + curr.totalVat, 0);
    
    const pendingReview = invoices.filter(
      i => i.status === InvoiceStatus.PENDING || i.status === InvoiceStatus.REVIEW_REQUIRED
    ).length;

    return { totalDocs, totalValue, totalDeductible, pendingReview };
  }, [invoices]);

  const categoryData = useMemo(() => {
    const data = [
      { name: 'Actividade', value: 0 },
      { name: 'Pessoal', value: 0 },
      { name: 'Misto/Outros', value: 0 },
    ];
    
    invoices.forEach(inv => {
      if (inv.classification === Classification.ACTIVITY) data[0].value++;
      else if (inv.classification === Classification.PERSONAL) data[1].value++;
      else data[2].value++;
    });
    
    return data;
  }, [invoices]);

  const taxFieldData = useMemo(() => {
    const data: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.classification === Classification.ACTIVITY && inv.taxField) {
        const key = `C${inv.taxField}`;
        data[key] = (data[key] || 0) + inv.totalVat;
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Faturas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalDocs}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileCheck size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Trimestre Q1 2025</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Valor Total</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Euro size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Volume Bruto</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">IVA Dedutível Est.</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.totalDeductible.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Baseado na classificação actual</div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={onViewInvoices}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-600">Revisão Necessária</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingReview}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-amber-600">
            Ver Faturas <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">IVA Dedutível por Campo</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxFieldData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Classificação IA</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Alert Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Próxima entrega de IVA</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>O prazo para entrega da declaração periódica do Q1 termina em 15 de Maio. Certifique-se de rever todas as faturas pendentes antes dessa data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}