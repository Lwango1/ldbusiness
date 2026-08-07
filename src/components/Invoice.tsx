import { useState, useEffect } from 'react';
import { X, Printer, Download, CheckCircle, Smartphone, Bitcoin, CreditCard, ArrowLeft, Shield } from 'lucide-react';
import { CartItem } from '../types';
import { createTransaction, updateProductStock } from '../services/database';
import { createSaleWithAgentReferral } from '../services/leads';
import { useAuth } from '../contexts/AuthContext';
import PaymentConfirmation from './PaymentConfirmation';
import { useTranslation } from '../i18n';

interface InvoiceProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'airtel_money' | 'mpesa' | 'crypto' | null;

export default function Invoice({ items, isOpen, onClose }: InvoiceProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [txnRecorded, setTxnRecorded] = useState(false);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const { user } = useAuth();

  // --- GESTION DU BOUTON RETOUR ANDROID ---
  useEffect(() => {
    if (isOpen) {
      window.history.pushState(null, '', window.location.pathname);
      const handlePopState = () => {
        if (step === 'confirm') setStep('payment');
        else if (step === 'payment') setStep('info');
        else onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isOpen, step, onClose]);

  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
    return sum + effectivePrice * item.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;
  const invoiceNumber = `LM-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentMethods = [
    {
      id: 'airtel_money' as PaymentMethod,
      name: t('invoice.airtelMoney'),
      icon: <Smartphone size={24} />,
      color: 'from-red-600 to-red-700',
      details: 'Numéro: +243 99 000 000',
      instruction: 'Composez *151# et envoyez le montant total vers notre numéro marchand.',
    },
    {
      id: 'mpesa' as PaymentMethod,
      name: t('invoice.mpesa'),
      icon: <CreditCard size={24} />,
      color: 'from-green-600 to-green-700',
      details: 'Numéro: +243 81 000 000',
      instruction: 'Composez *1122# et suivez les instructions pour le paiement de service.',
    },
    {
      id: 'crypto' as PaymentMethod,
      name: t('invoice.crypto'),
      icon: <Bitcoin size={24} />,
      color: 'from-orange-500 to-yellow-600',
      details: 'Réseau TRC20 / BTC Mainnet',
      instruction: 'Copiez l\'adresse qui s\'affichera après confirmation pour finaliser le transfert.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Invoice Modal */}
      <div className="relative w-full max-w-3xl bg-luxury-dark border-x border-t border-gold/20 rounded-t-3xl md:rounded-lg overflow-hidden flex flex-col h-[95vh] md:h-auto shadow-2xl">

        {/* Header de la Modal */}
        <div className="p-6 border-b border-gold/10 flex items-center justify-between bg-luxury-light/50">
          <div className="flex items-center gap-3">
             {step !== 'info' && (
               <button onClick={() => setStep(step === 'confirm' ? 'payment' : 'info')} className="text-gold p-1">
                 <ArrowLeft size={20} />
               </button>
             )}
             <h2 className="font-playfair text-xl font-bold text-white tracking-tight">{t('invoice.title')}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {step === 'info' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-gold/5 p-4 rounded-lg border border-gold/10 mb-6">
                <p className="text-gold text-xs text-center uppercase tracking-widest font-bold">{t('invoice.step1')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('invoice.fullName')}</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-5 py-4 bg-black border border-gold/20 rounded-sm text-white focus:border-gold outline-none transition-all"
                    placeholder={t('invoice.fullNamePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('invoice.phone')}</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-5 py-4 bg-black border border-gold/20 rounded-sm text-white focus:border-gold outline-none transition-all"
                      placeholder={t('invoice.phonePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('invoice.email')}</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-5 py-4 bg-black border border-gold/20 rounded-sm text-white focus:border-gold outline-none transition-all"
                      placeholder={t('invoice.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gold/60 uppercase tracking-widest mb-2 block font-semibold">{t('invoice.deliveryAddress')}</label>
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    rows={2}
                    className="w-full px-5 py-4 bg-black border border-gold/20 rounded-sm text-white focus:border-gold outline-none transition-all"
                    placeholder={t('invoice.addressPlaceholder')}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                disabled={!customerInfo.name || !customerInfo.phone}
                className="w-full py-5 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-sm shadow-xl shadow-gold/20 disabled:opacity-20 transition-all active:scale-95"
              >
                {t('invoice.continueToPayment')}
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="p-6 md:p-8">
              <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-8">{t('invoice.step2')}</p>

              <div className="space-y-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-all ${
                      paymentMethod === method.id
                        ? 'border-gold bg-gold/10 scale-[1.02]'
                        : 'border-white/5 bg-white/5 hover:border-gold/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-white`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm">{method.name}</h3>
                      <p className="text-gray-500 text-[10px] uppercase tracking-tighter mt-1">{method.details}</p>
                    </div>
                    {paymentMethod === method.id && <CheckCircle className="text-gold" size={24} />}
                  </button>
                ))}
              </div>

              {paymentMethod && (
                <div className="mt-8 p-5 bg-black border-l-2 border-gold rounded-r-lg">
                  <h4 className="text-gold text-xs font-bold uppercase mb-2">{t('invoice.directInstructions')}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {paymentMethods.find(m => m.id === paymentMethod)?.instruction}
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep('confirm')}
                disabled={!paymentMethod}
                className="w-full mt-8 py-5 bg-gold text-black font-black uppercase tracking-widest text-xs rounded-sm shadow-xl shadow-gold/20 disabled:opacity-20 transition-all active:scale-95"
              >
                {t('invoice.generate')}
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="p-6 md:p-8" id="invoice-content">
              {/* Facture Look Luxe */}
              <div className="bg-white text-black p-6 md:p-10 rounded-sm shadow-2xl space-y-8">
                <div className="flex justify-between items-start border-b-2 border-black pb-6">
                  <div>
                    <h1 className="font-playfair text-3xl font-black italic">{t('invoice.brand')}</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold">{t('invoice.tagline')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase">{t('invoice.number')}</p>
                    <p className="text-lg font-mono font-black">{invoiceNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-[11px]">
                  <div>
                    <p className="font-bold uppercase text-gray-500 mb-2 underline">{t('invoice.recipient')}</p>
                    <p className="font-black text-sm uppercase">{customerInfo.name}</p>
                    <p>{customerInfo.phone}</p>
                    <p className="italic">{customerInfo.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold uppercase text-gray-500 mb-2 underline">{t('invoice.details')}</p>
                    <p>{t('invoice.date')} {today}</p>
                    <p>{t('invoice.payment')} <strong>{paymentMethod?.toUpperCase()}</strong></p>
                  </div>
                </div>

                {/* Table Articles */}
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-y border-black">
                      <th className="py-2 text-left uppercase">{t('invoice.article')}</th>
                      <th className="py-2 text-center uppercase">{t('invoice.qty')}</th>
                      <th className="py-2 text-right uppercase">{t('invoice.price')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-4">
                          <p className="font-bold uppercase text-xs">{item.name}</p>
                          <p className="text-[9px] text-gray-500">{item.category}</p>
                          {item.discount && item.discount > 0 && (
                            <span className="text-[8px] text-red-500">-{item.discount}%</span>
                          )}
                        </td>
                        <td className="py-4 text-center font-bold">{item.quantity}</td>
                        <td className="py-4 text-right font-black">
                          {item.discount && item.discount > 0 ? (
                            <span>{(item.price * (1 - item.discount / 100)).toLocaleString()} CDF</span>
                          ) : (
                            <span>{item.price.toLocaleString()} CDF</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <div className="flex justify-end pt-4">
                  <div className="w-48 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span>{t('invoice.subtotal')}</span>
                      <span>{subtotal.toLocaleString()} CDF</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>{t('invoice.tax')}</span>
                      <span>{tax.toLocaleString()} CDF</span>
                    </div>
                    <div className="flex justify-between text-base font-black border-t-2 border-black pt-2">
                      <span>{t('invoice.total')}</span>
                      <span>{total.toLocaleString()} CDF</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 border border-dashed border-gray-300 text-[10px] space-y-1">
                  <p className="font-bold">{t('invoice.reference')} {invoiceNumber}</p>
                  <p>{t('invoice.screenshotInstruction')}</p>
                  <p className="text-red-600 font-bold mt-2">{t('invoice.fraudWarning')}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-4 border border-gold text-gold font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold hover:text-black transition-all"
                >
                  <Printer size={16} className="inline mr-2" /> {t('invoice.print')}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-4 bg-gold text-black font-bold text-[10px] uppercase tracking-widest rounded-sm shadow-lg shadow-gold/20"
                >
                  <Download size={16} className="inline mr-2" /> {t('invoice.pdf')}
                </button>
              </div>

              {!txnRecorded ? (
                <button
                  onClick={async () => {
                    if (user) {
                      const txnOpts = {
                        buyerId: user.id,
                        customerName: customerInfo.name,
                        customerPhone: customerInfo.phone,
                        customerEmail: customerInfo.email,
                        customerAddress: customerInfo.address,
                        paymentMethod: paymentMethod || 'airtel_money',
                        items: items,
                        subtotal,
                        tax,
                        total,
                      };
                      const ref = await createSaleWithAgentReferral(txnOpts);
                      if (ref.ok) { setTxnId(ref.txnId || null); }
                      else {
                        const txn = await createTransaction(txnOpts);
                        if (txn) setTxnId(txn.id);
                      }
                      for (const item of items) {
                        if (item.stock !== undefined && item.stock > 0) {
                          await updateProductStock(item.id, item.stock - item.quantity);
                        }
                      }
                    }
                    setTxnRecorded(true);
                  }}
                  className="w-full mt-4 py-4 bg-green-600 text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                >
                  <Shield size={16} /> {t('invoice.confirmSale')}
                </button>
              ) : (
                <div className="space-y-3 mt-4">
                  <div className="w-full py-4 bg-green-600/20 border border-green-500/30 text-green-400 font-bold text-xs uppercase tracking-widest rounded-sm flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> {t('invoice.saleRecorded')}
                  </div>
                  {txnId && !showPaymentConfirm && (
                    <button
                      onClick={() => setShowPaymentConfirm(true)}
                      className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all flex items-center justify-center gap-2"
                    >
                      <Shield size={16} /> {t('invoice.paymentDone')}
                    </button>
                  )}
                </div>
              )}

              {showPaymentConfirm && txnId && (
                <PaymentConfirmation
                  transactionId={txnId}
                  invoiceNumber={invoiceNumber}
                  total={total}
                  onClose={() => { setShowPaymentConfirm(false); onClose(); }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}