import { useState } from 'react';
import { X, ArrowLeft, Smartphone, Copy, Check, CheckCircle, Hash, Upload, Image as ImageIcon, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { LdConnectPlan, MAXICASH_NUMBER, MAXICASH_NAME, WHATSAPP_NUMBER, formatMaxicashNumber, planPriceCdf, formatDuration } from '../data/ldconnect';
import { createLdConnectOrder } from '../services/ldconnect';
import { submitPaymentProof, uploadProductImage } from '../services/database';
import { Transaction } from '../types';

interface LdConnectOrderModalProps {
  plan: LdConnectPlan;
  onClose: () => void;
  onOpenAuth: () => void;
}

type Step = 'info' | 'payment' | 'confirm';

export default function LdConnectOrderModal({ plan, onClose, onOpenAuth }: LdConnectOrderModalProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>('info');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [txnId, setTxnId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const price = planPriceCdf(plan);
  const invoiceNumber = txn?.invoiceNumber || '';
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Bonjour, je viens de commander le forfait WiFi ${plan.name} (${plan.speedMbps} Mbps, ${formatDuration(plan.durationHours)}) sur LDConnect. Facture ${invoiceNumber}.`
  )}`;

  const copyNumber = () => {
    navigator.clipboard?.writeText(MAXICASH_NUMBER).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startOrder = async () => {
    if (!user || !customerInfo.name.trim() || !customerInfo.phone.trim()) return;
    setCreating(true);
    setError('');
    const created = await createLdConnectOrder({
      buyerId: user.id,
      customerName: customerInfo.name.trim(),
      customerPhone: customerInfo.phone.trim(),
      customerEmail: customerInfo.email.trim() || undefined,
      plan,
    });
    setCreating(false);
    if (created) {
      setTxn(created);
      setStep('payment');
    } else {
      setError(t('ldconnect.orderError'));
    }
  };

  const submitProof = async () => {
    if (!txnId.trim() || !txn) {
      setError(t('ldconnect.txnRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    let screenshotUrl: string | undefined;
    if (screenshot) screenshotUrl = (await uploadProductImage(screenshot)) || undefined;
    const ok = await submitPaymentProof(txn.id, txnId.trim(), screenshotUrl);
    setSubmitting(false);
    if (ok) setStep('confirm');
    else setError(t('ldconnect.proofError'));
  };

  const inputCls = "w-full py-3 px-4 bg-black border border-gold/20 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none transition-all text-sm";

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-luxury-dark border-x border-t border-gold/20 rounded-t-3xl md:rounded-xl overflow-hidden flex flex-col h-[94vh] md:h-auto max-h-[92vh] shadow-2xl">
        <div className="p-5 border-b border-gold/10 flex items-center justify-between bg-luxury-light/50">
          <div className="flex items-center gap-3">
            {step !== 'info' && (
              <button onClick={() => setStep(step === 'confirm' ? 'payment' : 'info')} className="text-gold p-1">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="font-playfair text-lg font-bold text-white tracking-tight">{t('ldconnect.orderTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {step === 'info' && (
            <>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gold text-xs font-bold uppercase tracking-widest">{plan.name}</p>
                  <p className="text-gray-400 text-[10px] mt-1">
                    {plan.speedMbps} Mbps · {formatDuration(plan.durationHours)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg">{price.toLocaleString()} CDF</p>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={24} className="text-gold" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t('ldconnect.loginTitle')}</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">{t('ldconnect.loginDesc')}</p>
                  <button
                    onClick={onOpenAuth}
                    className="px-8 py-3 bg-gold text-black font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-gold-light transition-all"
                  >
                    {t('ldconnect.login')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('ldconnect.name')} *</label>
                      <input type="text" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder={t('ldconnect.namePlaceholder')} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('ldconnect.phone')} *</label>
                      <input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="+243..." className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('ldconnect.email')}</label>
                      <input type="email" value={customerInfo.email} onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })} placeholder="email@exemple.com" className={inputCls} />
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  <button
                    onClick={startOrder}
                    disabled={creating || !customerInfo.name.trim() || !customerInfo.phone.trim()}
                    className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-[11px] rounded-sm shadow-xl shadow-gold/20 disabled:opacity-20 transition-all active:scale-95"
                  >
                    {creating ? t('ldconnect.creating') : t('ldconnect.continuePayment')}
                  </button>
                  <p className="text-[9px] text-gray-600 text-center">{t('ldconnect.orderNotice')}</p>
                </>
              )}
            </>
          )}

          {step === 'payment' && txn && (
            <>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gold text-xs font-bold uppercase tracking-widest">{plan.name}</p>
                  <p className="text-gray-400 text-[10px] mt-1">{t('ldconnect.invoice')} {invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg">{price.toLocaleString()} CDF</p>
                </div>
              </div>

              <div className="p-5 bg-black border-l-2 border-gold rounded-r-lg space-y-3">
                <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
                  <Smartphone size={14} /> {t('ldconnect.maxicashTitle')}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{t('ldconnect.payInstruction')}</p>
                <div className="flex items-center justify-between bg-luxury-dark border border-gold/20 rounded-sm px-4 py-3">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">{MAXICASH_NAME}</p>
                    <p className="text-white font-mono font-bold text-lg tracking-widest">{formatMaxicashNumber(MAXICASH_NUMBER)}</p>
                  </div>
                  <button onClick={copyNumber} className="flex items-center gap-1 px-3 py-2 border border-gold/30 text-gold text-[10px] uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all">
                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? t('ldconnect.copied') : t('ldconnect.copy')}
                  </button>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-gray-500">{t('ldconnect.amountToPay')}</span>
                  <span className="text-gold font-black">{price.toLocaleString()} CDF</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('ldconnect.txnIdLabel')} *</label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" />
                    <input
                      type="text"
                      value={txnId}
                      onChange={e => { setTxnId(e.target.value); setError(''); }}
                      placeholder={t('ldconnect.txnIdPlaceholder')}
                      className="w-full pl-11 pr-4 py-3 bg-black border border-gold/10 rounded-sm text-white placeholder:text-gray-600 focus:border-gold outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-widest block mb-1">{t('ldconnect.screenshot')}</label>
                  <label className="flex flex-col items-center justify-center h-24 bg-black border-2 border-dashed border-gold/20 rounded-sm cursor-pointer hover:border-gold/50 transition-all">
                    {screenshot ? (
                      <div className="flex items-center gap-2 text-gold text-xs">
                        <ImageIcon size={15} /> {screenshot.name}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-gray-500">
                        <Upload size={18} />
                        <span className="text-[10px]">{t('ldconnect.touchToAdd')}</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshot(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  onClick={submitProof}
                  disabled={submitting || !txnId.trim()}
                  className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest text-[11px] rounded-sm shadow-xl shadow-gold/20 disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> {t('ldconnect.sending')}</>
                  ) : (
                    <><ShieldCheck size={15} /> {t('ldconnect.confirmPayment')}</>
                  )}
                </button>
                <p className="text-gray-600 text-[10px] text-center">{t('ldconnect.verificationNotice')}</p>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={30} className="text-green-400" />
              </div>
              <h3 className="font-playfair text-xl text-white font-bold mb-2">{t('ldconnect.successTitle')}</h3>
              <p className="text-gray-400 text-sm mb-6">{t('ldconnect.successDesc')}</p>

              <div className="bg-black border border-gold/20 rounded-lg p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('ldconnect.receiptInvoice')}</span>
                  <span className="text-white font-mono font-bold">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('ldconnect.receiptPlan')}</span>
                  <span className="text-white font-bold">{plan.name} · {plan.speedMbps} Mbps</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('ldconnect.amountToPay')}</span>
                  <span className="text-gold font-black">{price.toLocaleString()} CDF</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('ldconnect.receiptStatus')}</span>
                  <span className="text-yellow-400">{t('ldconnect.statusVerification')}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gold text-[10px] uppercase tracking-widest mb-4">
                <KeyRound size={13} /> {t('ldconnect.voucherAfterApproval')}
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center py-4 bg-green-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-sm hover:bg-green-500 transition-all"
              >
                {t('ldconnect.receiveOnWhatsApp')}
              </a>
              <button
                onClick={onClose}
                className="w-full mt-3 py-3 border border-gold/30 text-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gold/10 transition-all"
              >
                {t('ldconnect.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}