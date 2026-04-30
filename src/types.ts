export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  paymentMethod: 'airtel_money' | 'mpesa' | 'crypto';
  subtotal: number;
  tax: number;
  total: number;
}
