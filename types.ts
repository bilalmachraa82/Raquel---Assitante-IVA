export type ViewState = 'dashboard' | 'invoices';

export enum InvoiceStatus {
  PENDING = 'pendente',
  REVIEW_REQUIRED = 'revisao_necessaria',
  APPROVED = 'aprovado',
  REJECTED = 'rejeitado',
}

export enum Classification {
  ACTIVITY = 'actividade',
  PERSONAL = 'pessoal',
  MIXED = 'misto',
  PENDING = 'pendente',
}

export enum TaxField {
  F20 = 20, // Existências 6%
  F21 = 21, // Existências 13%
  F22 = 22, // Existências 23%
  F23 = 23, // Outros bens e serviços
  F24 = 24, // Activo imobilizado
}

export interface Invoice {
  id: string;
  nifIssuer: string;
  nameIssuer: string;
  date: string;
  total: number;
  totalVat: number;
  atcud: string;
  status: InvoiceStatus;
  classification: Classification;
  taxField: TaxField | null;
  confidence: number; // 0 to 1
  aiJustification?: string;
  itemsDescription?: string;
  quarter: string;
}

export const TaxFieldLabels: Record<TaxField, string> = {
  [TaxField.F20]: "Campo 20 - Existências 6%",
  [TaxField.F21]: "Campo 21 - Existências 13%",
  [TaxField.F22]: "Campo 22 - Existências 23%",
  [TaxField.F23]: "Campo 23 - Outros Bens e Serviços",
  [TaxField.F24]: "Campo 24 - Activo Imobilizado",
};