import { useState } from 'react';
import { X, CheckCircle, Upload, Image as ImageIcon, Hash } from 'lucide-react';
import { submitPaymentProof, uploadProductImage } from '../services/database';
import { useTranslation } from '../i18n';

interface PaymentConfirmationProps {
  transactionId: string;
  invoiceNumber: string;
  total: number;
  onClose: () => void;
}

export default function PaymentConfirmation({ transactionId, invoiceNumber, total, onClose }: PaymentConfirmationProps) {
  const { t } = useTranslation();
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!txnId.trim()) {
      setError(t('payment.enterIdRequired'));
      return;
    }
    setUploading(true);
    setError('');

    let screenshotUrl: string | undefined;
    if (screenshot) {
      screenshotUrl = await uploadProductImage(screenshot) || undefined;
    }

    const ok = await submitPaymentProof(transactionId, txnId.trim(), screenshotUrl);
    setUploading(false);

    if (ok) {
      setSubmitted(true);
    } else {
      setError(t('payment.error'));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-luxury-dark border border-gold/20 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-gold" />
              </div>
              <h2 className="font-playfair text-xl text-white font-bold">{t('payment.title')}</h2>
              <p className="text-gray-500 text-xs mt-1">{t('payment.invoice')} {invoiceNumber}</p>
              <p className="text-gold font-bold text-lg mt-2">{total.toLocaleString()} CDF</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">
                  {t('payment.transactionId')}
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                  <input
                    type="text"
                    value={txnId}
                    onChange={e => setTxnId(e.target.value)}
                    placeholder={t('payment.transactionIdPlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">
                  {t('payment.screenshot')}
                </label>
                <label className="flex flex-col items-center justify-center h-28 bg-black border-2 border-dashed border-gold/20 rounded-sm cursor-pointer hover:border-gold/50 transition-all">
                  {screenshot ? (
                    <div className="flex items-center gap-2 text-gold text-xs">
                      <ImageIcon size={16} />
                      {screenshot.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload size={20} />
                      <span className="text-[10px]">{t('payment.touchToAdd')}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={uploading || !txnId.trim()}
                className="w-full py-4 bg-gold text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                  {uploading ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> {t('payment.sending')}</>
                ) : (
                  <><CheckCircle size={16} /> {t('payment.confirm')}</>
                )}
              </button>

              <p className="text-gray-600 text-[10px] text-center">
                {t('payment.info')}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h3 className="font-playfair text-xl text-white font-bold mb-2">{t('payment.successTitle')}</h3>
            <p className="text-gray-400 text-sm mb-6">
              {t('payment.successMessage')}
            </p>
            <button onClick={onClose} className="px-6 py-3 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">
              {t('payment.backToShopping')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
