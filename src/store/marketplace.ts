import { Product, Seller, Transaction, TransactionItem, CartItem, Message, LiveStream, COMMISSION_RATE } from '../types';
import { products as staticProducts, categories } from '../data/products';

const SELLERS_KEY = 'ldbusiness_sellers';
const DYNAMIC_PRODUCTS_KEY = 'ldbusiness_dynamic_products';
const TRANSACTIONS_KEY = 'ldbusiness_transactions';

function getSellers(): Seller[] {
  try {
    return JSON.parse(localStorage.getItem(SELLERS_KEY) || '[]');
  } catch { return []; }
}

function saveSellers(sellers: Seller[]) {
  localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers));
}

function getDynamicProducts(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(DYNAMIC_PRODUCTS_KEY) || '[]');
  } catch { return []; }
}

function saveDynamicProducts(products: Product[]) {
  localStorage.setItem(DYNAMIC_PRODUCTS_KEY, JSON.stringify(products));
}

export function getSeller(id: string): Seller | undefined {
  return getSellers().find(s => s.id === id);
}

export function getCurrentSeller(): Seller | undefined {
  const id = localStorage.getItem('ldbusiness_current_seller');
  if (!id) return undefined;
  return getSeller(id);
}

export function registerSeller(data: Omit<Seller, 'id' | 'createdAt'>): Seller {
  const sellers = getSellers();
  const seller: Seller = {
    ...data,
    id: 'seller_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };
  sellers.push(seller);
  saveSellers(sellers);
  localStorage.setItem('ldbusiness_current_seller', seller.id);
  return seller;
}

export function logoutSeller() {
  localStorage.removeItem('ldbusiness_current_seller');
}

export function getAllProducts(): Product[] {
  return [...staticProducts, ...getDynamicProducts()];
}

export function getSellerProducts(sellerId: string): Product[] {
  return getDynamicProducts().filter(p => p.sellerId === sellerId);
}

export function addProduct(data: Omit<Product, 'id'>, sellerId: string): Product {
  const products = getDynamicProducts();
  const maxId = [...staticProducts, ...products].reduce((max, p) => Math.max(max, p.id), 0);
  const product: Product = {
    ...data,
    id: maxId + 1,
    sellerId,
  };
  products.push(product);
  saveDynamicProducts(products);
  return product;
}

export function updateProduct(id: number, data: Partial<Product>, sellerId: string): boolean {
  const products = getDynamicProducts();
  const idx = products.findIndex(p => p.id === id && p.sellerId === sellerId);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], ...data };
  saveDynamicProducts(products);
  return true;
}

export function deleteProduct(id: number, sellerId: string): boolean {
  const products = getDynamicProducts();
  const filtered = products.filter(p => !(p.id === id && p.sellerId === sellerId));
  if (filtered.length === products.length) return false;
  saveDynamicProducts(filtered);
  return true;
}

export function getAllCategories() {
  return categories;
}

// --- TRANSACTIONS / COMMISSIONS ---

export function getTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
  } catch { return []; }
}

export function recordTransaction(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}): Transaction {
  const transactions = getTransactions();
  const invoiceNumber = `LM-${Date.now().toString(36).toUpperCase()}`;

  const transactionItems: TransactionItem[] = data.items.map(item => {
    const seller = item.sellerId ? getSeller(item.sellerId) : undefined;
    return {
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      sellerId: item.sellerId,
      sellerStoreName: seller?.storeName || 'LDBusiness',
    };
  });

  // Calculate commissions per seller and platform
  const commissionMap = new Map<string, { sellerId?: string; sellerStoreName: string; amount: number }>();
  let platformCommission = 0;

  for (const item of transactionItems) {
    const itemTotal = item.price * item.quantity;
    const commissionAmount = Math.round(itemTotal * COMMISSION_RATE);

    if (item.sellerId && item.sellerStoreName) {
      const existing = commissionMap.get(item.sellerId) || {
        sellerId: item.sellerId,
        sellerStoreName: item.sellerStoreName,
        amount: 0,
      };
      existing.amount += commissionAmount;
      commissionMap.set(item.sellerId, existing);
    } else {
      // Products without seller (admin products) - full commission goes to platform
      platformCommission += commissionAmount;
    }
  }

  // For seller products, commission is deducted from seller payout
  // Platform commission = sum of commissions from seller items + full commission from admin items
  for (const [, val] of commissionMap) {
    platformCommission += val.amount;
  }

  const transaction: Transaction = {
    id: 'txn_' + Date.now(),
    invoiceNumber,
    date: new Date().toISOString(),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    customerAddress: data.customerAddress,
    paymentMethod: data.paymentMethod,
    items: transactionItems,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    commissionRate: COMMISSION_RATE,
    commissions: Array.from(commissionMap.values()),
    platformCommission,
    status: 'pending',
  };

  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return transaction;
}

export function completeTransaction(id: string): boolean {
  const transactions = getTransactions();
  const txn = transactions.find(t => t.id === id);
  if (!txn) return false;
  txn.status = 'completed';
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return true;
}

export function getTotalCommissions(): number {
  return getTransactions().reduce((sum, t) => sum + t.platformCommission, 0);
}

export function getPendingCommissions(): number {
  return getTransactions()
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.platformCommission, 0);
}

// --- MESSAGES ACHETEUR <-> VENDEUR (via plateforme) ---

const MESSAGES_KEY = 'ldbusiness_messages';

export function getMessages(): Message[] {
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]'); }
  catch { return []; }
}

export function sendMessage(data: {
  productId: number;
  productName: string;
  sellerId?: string;
  sellerStoreName?: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  content: string;
}): Message {
  const messages = getMessages();
  const msg: Message = {
    ...data,
    id: 'msg_' + Date.now(),
    date: new Date().toISOString(),
    read: false,
    replied: false,
  };
  messages.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  return msg;
}

export function markMessageRead(id: string) {
  const messages = getMessages();
  const msg = messages.find(m => m.id === id);
  if (msg) { msg.read = true; localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages)); }
}

export function replyToMessage(id: string, reply: string) {
  const messages = getMessages();
  const msg = messages.find(m => m.id === id);
  if (msg) {
    msg.replied = true;
    msg.reply = reply;
    msg.replyDate = new Date().toISOString();
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }
}

export function getSellerMessages(sellerId: string): Message[] {
  return getMessages().filter(m => m.sellerId === sellerId);
}

export function getUnreadMessages(sellerId: string): number {
  return getSellerMessages(sellerId).filter(m => !m.read).length;
}

export function getAllMessages(): Message[] {
  return getMessages();
}

// --- LIVE STREAMS ---

const LIVES_KEY = 'ldbusiness_lives';

function getLives(): LiveStream[] {
  try { return JSON.parse(localStorage.getItem(LIVES_KEY) || '[]'); }
  catch { return []; }
}

function saveLives(lives: LiveStream[]) {
  localStorage.setItem(LIVES_KEY, JSON.stringify(lives));
}

export function getActiveLives(): LiveStream[] {
  return getLives().filter(l => l.isLive);
}

export function getAllLives(): LiveStream[] {
  return getLives();
}

export function getLiveById(id: string): LiveStream | undefined {
  return getLives().find(l => l.id === id);
}

export function startLive(data: Omit<LiveStream, 'id' | 'createdAt' | 'viewerCount'>): LiveStream {
  const lives = getLives();
  const live: LiveStream = {
    ...data,
    id: 'live_' + Date.now(),
    viewerCount: 1,
    createdAt: new Date().toISOString(),
    isLive: true,
  };
  lives.push(live);
  saveLives(lives);
  return live;
}

export function stopLive(id: string) {
  const lives = getLives();
  const live = lives.find(l => l.id === id);
  if (live) {
    live.isLive = false;
    saveLives(lives);
  }
}

export function incrementViewers(id: string) {
  const lives = getLives();
  const live = lives.find(l => l.id === id);
  if (live) {
    live.viewerCount += 1;
    saveLives(lives);
  }
}

export function getLiveChatMessages(liveId: string): { user: string; text: string; time: string; isHost?: boolean }[] {
  try {
    const data = JSON.parse(localStorage.getItem('ldbusiness_chat_' + liveId) || '[]');
    return data;
  } catch { return []; }
}

export function sendLiveChatMessage(liveId: string, msg: { user: string; text: string; isHost?: boolean }) {
  const messages = getLiveChatMessages(liveId);
  const now = new Date();
  messages.push({
    ...msg,
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
  });
  localStorage.setItem('ldbusiness_chat_' + liveId, JSON.stringify(messages));
}
