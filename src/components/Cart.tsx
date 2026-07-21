import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export default function Cart({ items, isOpen, onClose, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay avec flou luxueux */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Panel Panier */}
      <div className="relative w-full max-w-[85%] md:max-w-md bg-luxury-black border-l border-gold/10 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-6 border-b border-gold/10 flex items-center justify-between bg-luxury-dark/50">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-gold" />
            <h2 className="font-playfair text-xl font-bold text-white uppercase tracking-widest">Mon Panier</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Liste des Articles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="w-24 h-24 mx-auto bg-luxury-gray/30 rounded-full flex items-center justify-center mb-6 border border-gold/5">
                <ShoppingBag size={40} className="text-gold/20" />
              </div>
              <p className="text-gray-400 font-playfair text-lg italic">Votre sélection est vide</p>
              <button
                onClick={onClose}
                className="mt-6 text-gold text-xs uppercase tracking-[0.2em] font-bold underline underline-offset-8"
              >
                Continuer le shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="group relative flex gap-4 bg-luxury-light/30 border border-gold/5 rounded-sm p-3 transition-all hover:border-gold/20">
                {/* Image Produit */}
                <div className="w-24 h-28 shrink-0 overflow-hidden rounded-sm bg-black">
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-white text-[11px] uppercase tracking-wider font-black pr-4">{item.name}</h3>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gold font-bold text-sm mt-1">{item.price.toLocaleString()} CDF</p>
                  </div>

                  {/* Contrôles de Quantité */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="flex items-center border border-gold/20 rounded-sm">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 text-gold hover:bg-gold/10 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-white text-xs font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-gold hover:bg-gold/10 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Résumé et Actions */}
        {items.length > 0 && (
          <div className="p-8 bg-luxury-dark border-t border-gold/20 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs tracking-widest text-gray-500">
                <span>SOUS-TOTAL</span>
                <span className="text-white">{subtotal.toLocaleString()} CDF</span>
              </div>
              <div className="flex justify-between text-xs tracking-widest text-gray-500">
                <span>TVA (16%)</span>
                <span className="text-white">{tax.toLocaleString()} CDF</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-gold/10 pt-4 mt-2">
                <span className="text-white font-playfair italic">Total</span>
                <span className="text-gold">{total.toLocaleString()} CDF</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-5 bg-gold text-black font-black uppercase tracking-widest text-[10px] rounded-sm shadow-xl shadow-gold/10 transition-all active:scale-[0.98] hover:bg-gold-light"
            >
              Passer à la Facturation
            </button>
            <p className="text-[9px] text-gray-600 text-center uppercase tracking-tighter">
              Paiement sécurisé via M-Pesa, Airtel Money & Crypto
            </p>
            <p className="text-[7px] text-red-500/30 text-center uppercase tracking-widest">
              ⚠ Toute transaction hors plateforme est frauduleuse
            </p>
          </div>
        )}
      </div>
    </div>
  );
}