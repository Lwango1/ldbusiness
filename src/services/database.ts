import { supabase } from '../lib/supabase';
import { Product, CartItem, Transaction, Message, LiveStream, Seller, Ad, AdZone } from '../types';
import { UserRole } from './auth';

// =========== STORAGE (UPLOAD IMAGES) ===========

export async function uploadProductImage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error } = await supabase.storage.from('product-images').upload(filePath, file);

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
  return urlData?.publicUrl || null;
}

export const CATEGORIES = ['Robes de Soirée', 'Costumes Homme', 'Mariage', 'Traditionnel', 'Événements', 'Accessoires', 'Autre'];

export function getAllCategories(): string[] {
  return ['Tous', ...CATEGORIES];
}

// =========== VENDEURS / PROFILS ===========

export async function getSeller(sellerId: string): Promise<Seller | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', sellerId).single();
  if (!data) return null;
  return {
    id: data.id,
    storeName: data.store_name || 'Boutique LDBusiness',
    ownerName: data.full_name || '',
    phone: data.phone || '',
    email: '',
    description: data.store_description || '',
    createdAt: data.created_at,
  };
}

export async function registerSeller(userId: string, data: { storeName: string; description?: string }): Promise<void> {
  await supabase.from('profiles').update({
    role: 'seller' as UserRole,
    store_name: data.storeName,
    store_description: data.description || null,
  }).eq('id', userId);
}

// =========== PRODUITS ===========

export async function getProducts(): Promise<Product[]> {
  const { data } = await supabase.from('products').select('*').eq('is_active', true);
  return (data || []).map(mapProduct);
}

// Alias to match old API
export const getAllProducts = getProducts;

export async function getProductById(id: number): Promise<Product | null> {
  const { data } = await supabase.from('products').select('*, profiles!products_seller_id_fkey(store_name)').eq('id', id).single();
  return data ? mapProduct(data) : null;
}

export async function addProduct(product: Omit<Product, 'id'>, sellerId: string): Promise<Product | null> {
  const { data } = await supabase.from('products').insert({
    seller_id: sellerId,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    image_url: product.image,
    category: product.category,
    sizes: product.sizes || [],
    colors: product.colors || [],
  }).select().single();
  return data ? mapProduct(data) : null;
}

export async function updateProduct(id: number, product: Partial<Product>, sellerId: string): Promise<boolean> {
  const { error } = await supabase.from('products').update({
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image,
    category: product.category,
    sizes: product.sizes,
    colors: product.colors,
  }).eq('id', id).eq('seller_id', sellerId);
  return !error;
}

export async function deleteProduct(id: number, sellerId: string): Promise<boolean> {
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id).eq('seller_id', sellerId);
  return !error;
}

export async function getSellerProducts(sellerId: string): Promise<Product[]> {
  const { data } = await supabase.from('products').select('*').eq('seller_id', sellerId).eq('is_active', true);
  return (data || []).map(mapProduct);
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    currency: p.currency,
    image: p.image_url,
    category: p.category,
    sizes: p.sizes || [],
    colors: p.colors || [],
    sellerId: p.seller_id,
  };
}

// =========== PANIER ===========

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', userId);
  return (data || []).map((item: any) => ({
    ...mapProduct(item.products),
    quantity: item.quantity,
    selectedSize: item.selected_size,
    selectedColor: item.selected_color,
  }));
}

export async function addToCart(userId: string, productId: number, quantity: number = 1) {
  const existing = await supabase.from('cart_items').select('id, quantity').eq('user_id', userId).eq('product_id', productId).maybeSingle();
  if (existing.data) {
    await supabase.from('cart_items').update({ quantity: existing.data.quantity + quantity }).eq('id', existing.data.id);
  } else {
    await supabase.from('cart_items').insert({ user_id: userId, product_id: productId, quantity });
  }
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', id);
  } else {
    await supabase.from('cart_items').update({ quantity }).eq('id', id);
  }
}

export async function clearCart(userId: string) {
  await supabase.from('cart_items').delete().eq('user_id', userId);
}

// =========== TRANSACTIONS ===========

export async function submitPaymentProof(transactionId: string, txnId: string, screenshotUrl?: string): Promise<boolean> {
  const { error } = await supabase.from('transactions').update({
    transaction_id: txnId,
    screenshot_url: screenshotUrl || null,
    status: 'pending_verification',
  }).eq('id', transactionId);
  return !error;
}

export async function completeTransaction(transactionId: string): Promise<boolean> {
  const { error } = await supabase.from('transactions').update({ status: 'completed' }).eq('id', transactionId);
  return !error;
}

export async function cancelTransaction(transactionId: string): Promise<boolean> {
  const { error } = await supabase.from('transactions').update({ status: 'cancelled' }).eq('id', transactionId);
  return !error;
}

export async function getPendingVerificationTransactions(): Promise<Transaction[]> {
  const { data } = await supabase.from('transactions').select('*').eq('status', 'pending_verification').order('created_at', { ascending: false });
  return (data || []).map(mapTransaction);
}

function mapTransaction(t: any): Transaction {
  return {
    id: t.id,
    invoiceNumber: t.invoice_number,
    date: t.created_at,
    customerName: t.customer_name,
    customerPhone: t.customer_phone,
    customerEmail: t.customer_email,
    customerAddress: t.customer_address,
    paymentMethod: t.payment_method,
    items: [],
    subtotal: t.subtotal,
    tax: t.tax,
    total: t.total,
    commissionRate: t.commission_rate,
    commissions: [],
    platformCommission: t.platform_commission,
    status: t.status,
    transactionId: t.transaction_id,
    screenshotUrl: t.screenshot_url,
  } as any;
}

export async function createTransaction(data: {
  buyerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}): Promise<Transaction | null> {
  const invoiceNumber = `LM-${Date.now().toString(36).toUpperCase()}`;
  const commissionRate = 0.10;
  let platformCommission = 0;

  const commissionItems = data.items.map(item => {
    const commission = Math.round(item.price * item.quantity * commissionRate);
    platformCommission += commission;
    return {
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      seller_id: item.sellerId || null,
      seller_store_name: null,
      commission,
    };
  });

  const { data: txn, error } = await supabase.from('transactions').insert({
    buyer_id: data.buyerId,
    invoice_number: invoiceNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail,
    customer_address: data.customerAddress,
    payment_method: data.paymentMethod,
    subtotal: data.subtotal,
    tax: data.tax,
    total: data.total,
    commission_rate: commissionRate,
    platform_commission: platformCommission,
    status: 'pending',
  }).select().single();

  if (error || !txn) return null;

  await supabase.from('transaction_items').insert(
    commissionItems.map(i => ({ ...i, transaction_id: txn.id }))
  );

  await clearCart(data.buyerId);

  return {
    id: txn.id,
    invoiceNumber: txn.invoice_number,
    date: txn.created_at,
    customerName: txn.customer_name,
    customerPhone: txn.customer_phone,
    customerEmail: txn.customer_email,
    customerAddress: txn.customer_address,
    paymentMethod: txn.payment_method,
    items: data.items,
    subtotal: txn.subtotal,
    tax: txn.tax,
    total: txn.total,
    commissionRate: commissionRate,
    platformCommission: platformCommission,
    status: txn.status,
  } as any;
}

export async function getTransactions(userId?: string): Promise<Transaction[]> {
  let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('buyer_id', userId);
  const { data } = await query;
  return (data || []).map(mapTransaction);
}

export async function getTotalCommissions(): Promise<number> {
  const { data } = await supabase.from('transactions').select('platform_commission');
  return (data || []).reduce((sum, t) => sum + (t.platform_commission || 0), 0);
}

export async function getPendingCommissions(): Promise<number> {
  const { data } = await supabase.from('transactions').select('platform_commission').eq('status', 'pending');
  return (data || []).reduce((sum, t) => sum + (t.platform_commission || 0), 0);
}

// =========== MESSAGES ===========

export async function sendMessage(msg: {
  productId: number;
  sellerId?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  content: string;
}) {
  await supabase.from('messages').insert({
    product_id: msg.productId,
    seller_id: msg.sellerId || null,
    buyer_id: msg.buyerId,
    buyer_name: msg.buyerName,
    buyer_phone: msg.buyerPhone,
    buyer_email: msg.buyerEmail,
    content: msg.content,
  });
}

export async function getAllMessages(): Promise<Message[]> {
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
  return (data || []).map(m => ({
    id: m.id,
    productId: m.product_id,
    productName: '',
    sellerId: m.seller_id,
    sellerStoreName: '',
    buyerName: m.buyer_name,
    buyerPhone: m.buyer_phone,
    buyerEmail: m.buyer_email,
    content: m.content,
    date: m.created_at,
    read: m.read,
    replied: m.replied,
    reply: m.reply,
    replyDate: m.reply_date,
  }));
}

export async function markMessageRead(id: string): Promise<void> {
  await supabase.from('messages').update({ read: true }).eq('id', id);
}

export async function getSellerMessages(sellerId: string): Promise<Message[]> {
  const { data } = await supabase.from('messages').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  return (data || []).map(m => ({
    id: m.id,
    productId: m.product_id,
    productName: '',
    sellerId: m.seller_id,
    buyerName: m.buyer_name,
    buyerPhone: m.buyer_phone,
    buyerEmail: m.buyer_email,
    content: m.content,
    date: m.created_at,
    read: m.read,
    replied: m.replied,
    reply: m.reply,
    replyDate: m.reply_date,
  }));
}

export async function replyToMessage(id: string, reply: string) {
  await supabase.from('messages').update({ reply, replied: true, reply_date: new Date().toISOString() }).eq('id', id);
}

// =========== LIVES ===========

export async function getActiveLives(): Promise<LiveStream[]> {
  const { data } = await supabase.from('lives').select('*').eq('is_live', true).order('created_at', { ascending: false });
  return (data || []).map(l => ({
    id: l.id,
    hostName: l.host_name,
    title: l.title,
    description: l.description || '',
    viewerCount: l.viewer_count,
    isLive: l.is_live,
    createdAt: l.created_at,
    category: l.category || 'Mode',
  }));
}

export async function getAllLives(): Promise<LiveStream[]> {
  const { data } = await supabase.from('lives').select('*').order('created_at', { ascending: false });
  return (data || []).map(l => ({
    id: l.id,
    hostName: l.host_name,
    title: l.title,
    description: l.description || '',
    viewerCount: l.viewer_count,
    isLive: l.is_live,
    createdAt: l.created_at,
    category: l.category || 'Mode',
  }));
}

export async function getLiveById(id: string): Promise<LiveStream | null> {
  const { data } = await supabase.from('lives').select('*').eq('id', id).single();
  if (!data) return null;
  return {
    id: data.id,
    hostName: data.host_name,
    title: data.title,
    description: data.description || '',
    viewerCount: data.viewer_count,
    isLive: data.is_live,
    createdAt: data.created_at,
    category: data.category || 'Mode',
  };
}

export async function incrementViewers(id: string): Promise<void> {
  const { data } = await supabase.from('lives').select('viewer_count').eq('id', id).single();
  if (data) {
    await supabase.from('lives').update({ viewer_count: (data.viewer_count || 0) + 1 }).eq('id', id);
  }
}

export async function startLive(data: { hostId: string; hostName: string; title: string; description?: string; category: string }): Promise<LiveStream | null> {
  const { data: live } = await supabase.from('lives').insert({
    host_id: data.hostId,
    host_name: data.hostName,
    title: data.title,
    description: data.description,
    category: data.category,
    room_name: `room_${Date.now()}`,
  }).select().single();
  return live ? {
    id: live.id,
    hostName: live.host_name,
    title: live.title,
    description: live.description || '',
    viewerCount: live.viewer_count,
    isLive: live.is_live,
    createdAt: live.created_at,
    category: live.category,
  } : null;
}

export async function stopLive(id: string) {
  await supabase.from('lives').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', id);
}

export async function sendLiveChatMessage(liveId: string, userName: string, content: string, isHost: boolean = false) {
  await supabase.from('live_chat_messages').insert({
    live_id: liveId,
    user_name: userName,
    content,
    is_host: isHost,
  });
}

export async function getLiveChatMessages(liveId: string): Promise<{ user: string; text: string; time: string; isHost?: boolean }[]> {
  const { data } = await supabase.from('live_chat_messages').select('*').eq('live_id', liveId).order('created_at', { ascending: true });
  return (data || []).map(m => ({
    user: m.user_name,
    text: m.content,
    time: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    isHost: m.is_host,
  }));
}

// =========== PUBLICITÉ ===========

export async function createAdRequest(data: {
  brandName: string;
  brandLogo?: string;
  brandWebsite?: string;
  imageUrl: string;
  description?: string;
  zone: AdZone;
  frequency: string;
}): Promise<boolean> {
  const { error } = await supabase.from('ads').insert({
    brand_name: data.brandName,
    brand_logo: data.brandLogo || null,
    brand_website: data.brandWebsite || null,
    image_url: data.imageUrl,
    description: data.description || null,
    zone: data.zone,
    frequency: data.frequency,
  });
  return !error;
}

export async function getAds(zone?: AdZone): Promise<Ad[]> {
  let query = supabase.from('ads').select('*');
  if (zone) query = query.eq('zone', zone);
  query = query.eq('status', 'approved').order('created_at', { ascending: false });
  const { data } = await query;
  return (data || []).map(mapAd);
}

export async function getAllAdRequests(): Promise<Ad[]> {
  const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapAd);
}

export async function approveAd(id: string): Promise<boolean> {
  const { error } = await supabase.from('ads').update({
    status: 'approved',
    start_date: new Date().toISOString(),
  }).eq('id', id);
  return !error;
}

export async function rejectAd(id: string): Promise<boolean> {
  const { error } = await supabase.from('ads').update({ status: 'rejected' }).eq('id', id);
  return !error;
}

export async function deleteAd(id: string): Promise<boolean> {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  return !error;
}

export async function incrementAdImpression(id: string): Promise<void> {
  const { data } = await supabase.from('ads').select('impressions').eq('id', id).single();
  if (data) {
    await supabase.from('ads').update({ impressions: (data.impressions || 0) + 1 }).eq('id', id);
  }
}

function mapAd(a: any): Ad {
  return {
    id: a.id,
    brandName: a.brand_name,
    brandLogo: a.brand_logo,
    brandWebsite: a.brand_website,
    imageUrl: a.image_url,
    description: a.description,
    zone: a.zone,
    frequency: a.frequency,
    status: a.status,
    startDate: a.start_date,
    endDate: a.end_date,
    impressions: a.impressions || 0,
    clicks: a.clicks || 0,
    createdAt: a.created_at,
  };
}
