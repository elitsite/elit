'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trash2, Edit, Package, Settings, Upload, X, Save, Store, Loader2, ClipboardList, Globe } from 'lucide-react';
import { Product, Settings as SettingsType, Order, getScheduleOpen, getScheduleTime, setScheduleField, normalizePriceFilters, PriceFilter } from '@/lib/supabase';
import { AdminLang, adminTranslations, adminCategoryLabels } from '@/lib/adminTranslations';
import { CATEGORY_TREE } from '@/lib/categories';

// ── Category dropdown helpers (built from CATEGORY_TREE) ──
type LeafOption = { slug: string; labelKey: string; prefixKey?: string };
const CATEGORY_GROUPS: { groupKey: string; options: LeafOption[] }[] = CATEGORY_TREE.map(top => {
    const options: LeafOption[] = [];
    for (const child of top.children ?? []) {
        if (child.children?.length) {
            for (const leaf of child.children) options.push({ slug: leaf.slug, labelKey: leaf.labelKey, prefixKey: child.labelKey });
        } else {
            options.push({ slug: child.slug, labelKey: child.labelKey });
        }
    }
    return { groupKey: top.labelKey, options };
});
const LEAF_LABELKEY_BY_SLUG: Record<string, string> = (() => {
    const m: Record<string, string> = {};
    for (const g of CATEGORY_GROUPS) for (const o of g.options) m[o.slug] = o.labelKey;
    return m;
})();

const fmtPrice = (n: number | null | undefined) => `€${(n ?? 0).toLocaleString('nl-NL')}`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function AdminPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'orders'>('products');
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: string } | null>(null);

    // Admin language (default RU)
    const [adminLang, setAdminLang] = useState<AdminLang>('ru');
    const at = adminTranslations[adminLang];
    const catLabel = (key: string) => adminCategoryLabels[adminLang][key] || key;

    useEffect(() => {
        const saved = localStorage.getItem('admin-lang');
        if (saved === 'en' || saved === 'ru') setAdminLang(saved);
    }, []);

    const toggleAdminLang = () => {
        const next: AdminLang = adminLang === 'ru' ? 'en' : 'ru';
        setAdminLang(next);
        localStorage.setItem('admin-lang', next);
    };

    // Product form
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        name_uk: '',
        name_nl: '',
        description_uk: '',
        description_nl: '',
        price: '',
        discount: '0',
        in_stock: true,
        category: 'mono-bouquets',
        composition: '',
        composition_uk: '',
        composition_nl: '',
        kit_info: '',
        kit_info_uk: '',
        kit_info_nl: '',
        important_note: '',
        important_note_uk: '',
        important_note_nl: '',
    });
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    // Initial data load
    useEffect(() => {
        loadData();

        const savedProductEdit = sessionStorage.getItem('admin-editing-product');
        if (savedProductEdit) {
            try {
                const data = JSON.parse(savedProductEdit);
                setEditingProduct(data.product);
                setProductForm(data.form);
                setImagePreview(data.imagePreview || '');
                setShowProductForm(true);
            } catch {
                sessionStorage.removeItem('admin-editing-product');
            }
        }

        const savedTab = sessionStorage.getItem('admin-active-tab');
        if (savedTab && (savedTab === 'products' || savedTab === 'settings' || savedTab === 'orders')) {
            setActiveTab(savedTab as 'products' | 'settings' | 'orders');
        }
    }, []);

    useEffect(() => {
        if (editingProduct && showProductForm) {
            sessionStorage.setItem('admin-editing-product', JSON.stringify({
                product: editingProduct,
                form: productForm,
                imagePreview: imagePreview,
            }));
        } else {
            sessionStorage.removeItem('admin-editing-product');
        }
    }, [editingProduct, productForm, imagePreview, showProductForm]);

    useEffect(() => {
        sessionStorage.setItem('admin-active-tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'orders' && !ordersLoaded) {
            setOrdersLoaded(true);
            fetch('/api/admin/orders')
                .then(res => {
                    if (res.status === 401) { router.push('/admin/login'); return []; }
                    return res.ok ? res.json() : [];
                })
                .then(data => setOrders(data))
                .catch(() => showNotif(at.err_orders, 'error'));
        }
    }, [activeTab, ordersLoaded, router]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [productsRes, settingsRes] = await Promise.all([
                fetch('/api/admin/products').then(r => {
                    if (r.status === 401) { router.push('/admin/login'); return null; }
                    return r.ok ? r.json() : null;
                }),
                fetch('/api/admin/settings').then(r => {
                    if (r.status === 401) { router.push('/admin/login'); return null; }
                    return r.ok ? r.json() : null;
                }),
            ]);

            if (productsRes) setProducts(productsRes);

            const defaultSchedule = {
                sched_mon: '10:00–22:00', sched_mon_open: true,
                sched_tue: '10:00–22:00', sched_tue_open: true,
                sched_wed: '10:00–22:00', sched_wed_open: true,
                sched_thu: '10:00–22:00', sched_thu_open: true,
                sched_fri: '10:00–22:00', sched_fri_open: true,
                sched_sat: '10:00–22:00', sched_sat_open: true,
                sched_sun: '10:00–22:00', sched_sun_open: true,
            };

            if (settingsRes && settingsRes.id) {
                setSettings({ ...defaultSchedule, ...settingsRes });
            } else {
                setSettings({
                    id: '', shop_open: true, delivery_enabled: true,
                    shop_name: '', hero_title: '', hero_subtitle: '',
                    phone: '', telegram_link: '', address: '', address_link: '', schedule: '',
                    ...defaultSchedule,
                    about_enabled: false, about_text: '',
                    schedule_enabled: false,
                    delivery_price_enabled: false, delivery_price: '',
                    delivery_info: '', pickup_info: '', payment_info: '',
                    instagram_link: '', facebook_link: '', whatsapp_link: '', google_maps_embed: '',
                });
            }
            // API loaded successfully — DB is reachable
            setDbError(null);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setDbError(at.err_db);
        }
        setIsLoading(false);
    };

    const showNotif = (message: string, type: string = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleLogout = async () => {
        if (confirm(at.confirm_logout)) {
            await fetch('/api/admin/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Upload failed');
        }
        const data = await response.json();
        return data.url;
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showNotif(at.err_file_size, 'error'); return; }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImagePreview('');
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Manual auto-translate: fills only EMPTY uk/nl fields, preserves manual input
    const handleAutoTranslate = async () => {
        const texts: { key: string; value: string }[] = [];
        if (productForm.name) texts.push({ key: 'name', value: productForm.name });
        if (productForm.description) texts.push({ key: 'description', value: productForm.description });
        if (productForm.composition) texts.push({ key: 'composition', value: productForm.composition });
        if (productForm.kit_info) texts.push({ key: 'kit_info', value: productForm.kit_info });
        if (productForm.important_note) texts.push({ key: 'important_note', value: productForm.important_note });

        if (texts.length === 0) { showNotif(at.err_no_text_to_translate, 'error'); return; }

        setIsTranslating(true);
        try {
            const res = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const { translations } = await res.json();
            // Fill ONLY empty fields — manual input always wins
            setProductForm(prev => ({
                ...prev,
                name_uk: prev.name_uk || translations.name?.uk || '',
                name_nl: prev.name_nl || translations.name?.nl || '',
                description_uk: prev.description_uk || translations.description?.uk || '',
                description_nl: prev.description_nl || translations.description?.nl || '',
                composition_uk: prev.composition_uk || translations.composition?.uk || '',
                composition_nl: prev.composition_nl || translations.composition?.nl || '',
                kit_info_uk: prev.kit_info_uk || translations.kit_info?.uk || '',
                kit_info_nl: prev.kit_info_nl || translations.kit_info?.nl || '',
                important_note_uk: prev.important_note_uk || translations.important_note?.uk || '',
                important_note_nl: prev.important_note_nl || translations.important_note?.nl || '',
            }));
            showNotif(at.msg_translated, 'success');
        } catch (e) {
            showNotif(`Error: ${errMsg(e)}`, 'error');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!productForm.name || !productForm.price) { showNotif(at.err_name_price, 'error'); return; }
        if (!editingProduct && !imageFile && !imagePreview) { showNotif(at.err_photo, 'error'); return; }
        setIsSaving(true);
        try {
            let imageUrl = editingProduct?.image_url || '';
            if (imageFile) imageUrl = await uploadImage(imageFile);

            // ── Auto-translate text fields (base = EN, plus uk/nl) ──
            const textsToTranslate: { key: string; value: string }[] = [];
            if (productForm.name) textsToTranslate.push({ key: 'name', value: productForm.name });
            if (productForm.description) textsToTranslate.push({ key: 'description', value: productForm.description });
            if (productForm.composition) textsToTranslate.push({ key: 'composition', value: productForm.composition });
            if (productForm.kit_info) textsToTranslate.push({ key: 'kit_info', value: productForm.kit_info });
            if (productForm.important_note) textsToTranslate.push({ key: 'important_note', value: productForm.important_note });

            const translatePromise = textsToTranslate.length > 0
                ? fetch('/api/admin/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texts: textsToTranslate }),
                }).then(r => r.ok ? r.json() : { translations: {} }).catch(() => ({ translations: {} }))
                : Promise.resolve({ translations: {} });

            const { translations: autoTrans } = await translatePromise;

            const productData = {
                // Base = English (fallback to original)
                name: autoTrans.name?.en || productForm.name,
                description: autoTrans.description?.en || productForm.description,
                // Name translations — priority: manual input → auto-translate
                name_uk: productForm.name_uk || autoTrans.name?.uk || null,
                name_nl: productForm.name_nl || autoTrans.name?.nl || null,
                // Description translations
                description_uk: productForm.description_uk || autoTrans.description?.uk || productForm.description || null,
                description_nl: productForm.description_nl || autoTrans.description?.nl || null,
                price: parseInt(productForm.price) || 0,
                discount: parseInt(productForm.discount) || 0,
                image_url: imageUrl,
                in_stock: productForm.in_stock,
                category: productForm.category,
                // Base fields = English translation (fallback to original)
                composition: autoTrans.composition?.en || productForm.composition || null,
                kit_info: autoTrans.kit_info?.en || productForm.kit_info || null,
                important_note: autoTrans.important_note?.en || productForm.important_note || null,
                // Composition translations
                composition_uk: productForm.composition_uk || autoTrans.composition?.uk || productForm.composition || null,
                composition_nl: productForm.composition_nl || autoTrans.composition?.nl || null,
                // Kit info translations
                kit_info_uk: productForm.kit_info_uk || autoTrans.kit_info?.uk || productForm.kit_info || null,
                kit_info_nl: productForm.kit_info_nl || autoTrans.kit_info?.nl || null,
                // Important note translations
                important_note_uk: productForm.important_note_uk || autoTrans.important_note?.uk || productForm.important_note || null,
                important_note_nl: productForm.important_note_nl || autoTrans.important_note?.nl || null,
            };
            const method = editingProduct ? 'PUT' : 'POST';
            const body = editingProduct ? { id: editingProduct.id, ...productData } : productData;
            const response = await fetch('/api/admin/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err = await response.json();
                const details = err.details ? JSON.stringify(err.details) : '';
                const detail = err.detail ? ` | ${err.detail}` : '';
                throw new Error(`${err.error || 'Failed'}${details ? `: ${details}` : ''}${detail}`);
            }
            showNotif(editingProduct ? at.msg_updated : at.msg_added, 'success');
            resetForm();
            await loadData();
        } catch (error) {
            showNotif(`Error: ${errMsg(error)}`, 'error');
        }
        setIsSaving(false);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            description: product.description,
            name_uk: product.name_uk || '',
            name_nl: product.name_nl || '',
            description_uk: product.description_uk || '',
            description_nl: product.description_nl || '',
            price: product.price.toString(),
            discount: product.discount.toString(),
            in_stock: product.in_stock,
            category: product.category || 'mono-bouquets',
            composition: product.composition || '',
            composition_uk: product.composition_uk || '',
            composition_nl: product.composition_nl || '',
            kit_info: product.kit_info || '',
            kit_info_uk: product.kit_info_uk || '',
            kit_info_nl: product.kit_info_nl || '',
            important_note: product.important_note || '',
            important_note_uk: product.important_note_uk || '',
            important_note_nl: product.important_note_nl || '',
        });
        setImagePreview(product.image_url);
        setShowProductForm(true);
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm(at.confirm_delete)) {
            try {
                const response = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
                if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed'); }
                showNotif(at.msg_deleted, 'info');
                await loadData();
            } catch (error) {
                showNotif(`Error: ${errMsg(error)}`, 'error');
            }
        }
    };

    const resetForm = () => {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({
            name: '', description: '',
            name_uk: '', name_nl: '',
            description_uk: '', description_nl: '',
            price: '', discount: '0', in_stock: true, category: 'mono-bouquets',
            composition: '', composition_uk: '', composition_nl: '',
            kit_info: '', kit_info_uk: '', kit_info_nl: '',
            important_note: '', important_note_uk: '', important_note_nl: '',
        });
        setImagePreview('');
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!response.ok) {
                const err = await response.json();
                const details = err.details ? JSON.stringify(err.details) : '';
                const detail = err.detail ? ` | ${err.detail}` : '';
                throw new Error(`${err.error || 'Failed'}${details ? `: ${details}` : ''}${detail}`);
            }
            await loadData();
            showNotif(at.msg_settings_saved, 'success');
        } catch (error) {
            showNotif(`❌ Error: ${errMsg(error)}`, 'error');
        }
        setIsSaving(false);
    };

    const toggleShopOpen = async () => {
        if (!settings) return;
        const newValue = !settings.shop_open;
        setSettings({ ...settings, shop_open: newValue });
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: 'shop_open', value: newValue }),
            });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || 'Failed'); }
            showNotif(newValue ? at.msg_shop_opened : at.msg_shop_closed, 'success');
        } catch (err) {
            setSettings({ ...settings, shop_open: !newValue });
            showNotif(errMsg(err) || 'Error', 'error');
        }
    };

    const toggleDelivery = async () => {
        if (!settings) return;
        const newValue = !settings.delivery_enabled;
        setSettings({ ...settings, delivery_enabled: newValue });
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: 'delivery_enabled', value: newValue }),
            });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || 'Failed'); }
            showNotif(newValue ? at.msg_delivery_on : at.msg_delivery_off, 'success');
        } catch (err) {
            setSettings({ ...settings, delivery_enabled: !newValue });
            showNotif(errMsg(err) || 'Error', 'error');
        }
    };

    const orderStatusLabel = (status: string) => {
        switch (status) {
            case 'new': return `🆕 ${at.order_new}`;
            case 'confirmed': return `✅ ${at.order_confirmed}`;
            case 'completed': return `📦 ${at.order_completed}`;
            case 'cancelled': return `❌ ${at.order_cancelled}`;
            default: return status;
        }
    };

    const updateOrderStatus = async (orderId: string, status: Order['status'], successMsg: string) => {
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed');
            }
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
            showNotif(successMsg, 'success');
        } catch (err) {
            showNotif(`Error: ${errMsg(err) || 'Failed to update status'}`, 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 notranslate">
            {dbError && (
                <div className="bg-red-600 text-white p-4 text-center font-bold sticky top-0 z-50 shadow-lg flex flex-col items-center gap-2">
                    <p>⚠️ {dbError}</p>
                    <p className="text-xs font-normal opacity-80">{at.err_sql_hint}</p>
                    <div className="bg-red-800 p-2 rounded text-xs font-mono text-left w-full max-w-lg">
                        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}</p>
                        <p>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}</p>
                    </div>
                </div>
            )}

            {notification && (
                <div className={`fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg text-sm
                    ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
                    {notification.message}
                </div>
            )}

            <header className="bg-zinc-900 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-0">
                        <h1 className="text-lg sm:text-xl font-bold">{at.header_title}</h1>
                        <div className="flex items-center gap-2 sm:hidden">
                            <button
                                onClick={toggleAdminLang}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                                title="Switch language"
                            >
                                <Globe size={16} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Language toggle — desktop */}
                        <button
                            onClick={toggleAdminLang}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
                            title="Switch language"
                        >
                            <Globe size={16} />
                            {adminLang === 'en' ? 'EN' : 'RU'}
                        </button>
                        <button
                            onClick={toggleShopOpen}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center ${settings?.shop_open ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            <Store size={16} />
                            {settings?.shop_open ? at.btn_open : at.btn_closed}
                        </button>
                        <button
                            onClick={toggleDelivery}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none justify-center ${settings?.delivery_enabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-600 hover:bg-zinc-500'}`}
                        >
                            🚚 {settings?.delivery_enabled ? at.btn_delivery_on : at.btn_delivery_off}
                        </button>
                        {/* Logout — desktop */}
                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-sm"
                        >
                            <LogOut size={16} />
                            {at.btn_logout}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'products' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 hover:bg-zinc-100'}`}
                    >
                        <Package size={20} />
                        <span className="hidden sm:inline">{at.tab_products}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'settings' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 hover:bg-zinc-100'}`}
                    >
                        <Settings size={20} />
                        <span className="hidden sm:inline">{at.tab_settings}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-white text-zinc-700 hover:bg-emerald-50'}`}
                    >
                        <ClipboardList size={20} />
                        <span className="hidden sm:inline">{at.tab_orders}</span>
                    </button>
                </div>

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        {!showProductForm && (
                            <button
                                onClick={() => setShowProductForm(true)}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                <Plus size={20} />
                                {at.btn_add}
                            </button>
                        )}

                        {showProductForm && (
                            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">{editingProduct ? at.form_edit_title : at.form_new_title}</h2>
                                    <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{at.form_name}</label>
                                            <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder={at.form_name_ph} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{at.form_desc}</label>
                                            <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={2} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none" />
                                        </div>
                                        {/* Auto-translate button — fills only empty UK/NL fields */}
                                        <button
                                            type="button"
                                            onClick={handleAutoTranslate}
                                            disabled={isTranslating}
                                            className="w-full px-4 py-2.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-200 hover:border-amber-300 text-amber-800 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isTranslating ? at.btn_auto_translating : at.btn_auto_translate}
                                        </button>
                                        {/* Multilingual names */}
                                        <details className="border border-zinc-200 rounded-lg">
                                            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-800">
                                                🌐 {at.form_translations_title}
                                            </summary>
                                            <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">🇺🇦 UK</label>
                                                        <input type="text" value={productForm.name_uk} onChange={e => setProductForm({...productForm, name_uk: e.target.value})} placeholder="Назва" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">🇳🇱 NL</label>
                                                        <input type="text" value={productForm.name_nl} onChange={e => setProductForm({...productForm, name_nl: e.target.value})} placeholder="Naam" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">🇺🇦 {at.form_desc}</label>
                                                        <textarea value={productForm.description_uk} onChange={e => setProductForm({...productForm, description_uk: e.target.value})} rows={2} placeholder="Опис" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">🇳🇱 {at.form_desc}</label>
                                                        <textarea value={productForm.description_nl} onChange={e => setProductForm({...productForm, description_nl: e.target.value})} rows={2} placeholder="Beschrijving" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{at.form_price}</label>
                                                <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{at.form_discount}</label>
                                                <input type="number" value={productForm.discount} onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })} min="0" max="100" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{at.form_composition}</label>
                                            <textarea value={productForm.composition} onChange={(e) => setProductForm({ ...productForm, composition: e.target.value })} rows={2} placeholder={at.form_composition_ph} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{at.form_kit_info}</label>
                                            <textarea value={productForm.kit_info} onChange={(e) => setProductForm({ ...productForm, kit_info: e.target.value })} rows={3} placeholder={at.form_kit_info_ph} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none font-mono text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{at.form_important_note}</label>
                                            <textarea value={productForm.important_note} onChange={(e) => setProductForm({ ...productForm, important_note: e.target.value })} rows={2} placeholder={at.form_important_note_ph} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none resize-none" />
                                        </div>
                                        {/* Multilingual: composition / kit / important */}
                                        <details className="border border-zinc-200 rounded-lg">
                                            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-800">
                                                🌐 {at.form_extra_translations_title}
                                            </summary>
                                            <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
                                                <p className="text-xs text-zinc-400 italic">{at.form_translations_hint}</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_composition_uk}</label>
                                                        <textarea value={productForm.composition_uk} onChange={e => setProductForm({...productForm, composition_uk: e.target.value})} rows={2} placeholder={at.form_composition_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_composition_nl}</label>
                                                        <textarea value={productForm.composition_nl} onChange={e => setProductForm({...productForm, composition_nl: e.target.value})} rows={2} placeholder={at.form_composition_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_kit_info_uk}</label>
                                                        <textarea value={productForm.kit_info_uk} onChange={e => setProductForm({...productForm, kit_info_uk: e.target.value})} rows={3} placeholder={at.form_kit_info_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none font-mono text-xs" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_kit_info_nl}</label>
                                                        <textarea value={productForm.kit_info_nl} onChange={e => setProductForm({...productForm, kit_info_nl: e.target.value})} rows={3} placeholder={at.form_kit_info_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none font-mono text-xs" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_important_uk}</label>
                                                        <textarea value={productForm.important_note_uk} onChange={e => setProductForm({...productForm, important_note_uk: e.target.value})} rows={2} placeholder={at.form_important_note_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-zinc-400 mb-1">{at.form_lbl_important_nl}</label>
                                                        <textarea value={productForm.important_note_nl} onChange={e => setProductForm({...productForm, important_note_nl: e.target.value})} rows={2} placeholder={at.form_important_note_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={productForm.in_stock} onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked })} className="w-5 h-5 accent-amber-500" />
                                            <span className="font-medium">{at.form_in_stock}</span>
                                        </label>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{at.form_category}</label>
                                            <select
                                                value={productForm.category}
                                                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                                            >
                                                {CATEGORY_GROUPS.map(g => (
                                                    <optgroup key={g.groupKey} label={catLabel(g.groupKey)}>
                                                        {g.options.map(o => (
                                                            <option key={o.slug} value={o.slug}>
                                                                {o.prefixKey ? `${catLabel(o.prefixKey)} — ${catLabel(o.labelKey)}` : catLabel(o.labelKey)}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{at.form_photo}</label>
                                        <div onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors ${imagePreview ? 'border-amber-500 bg-amber-50' : 'border-zinc-300 hover:border-amber-400 bg-zinc-50'}`} style={{ minHeight: '200px' }}>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); clearImage(); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                                    <Upload size={48} className="mb-3 text-zinc-400" />
                                                    <p className="font-medium">{at.form_photo_click}</p>
                                                    <p className="text-sm text-zinc-400">{at.form_photo_limit}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={handleSaveProduct} disabled={isSaving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        {editingProduct ? at.btn_save_changes : at.btn_add_bouquet}
                                    </button>
                                    <button onClick={resetForm} className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 rounded-lg font-semibold transition-colors">{at.btn_cancel}</button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg">
                            <h2 className="text-xl font-bold mb-4">{at.products_title} ({products.length})</h2>
                            {products.length === 0 ? (
                                <div className="text-center py-12 text-zinc-400">
                                    <div className="text-5xl mb-3">🌸</div>
                                    <p>{at.products_empty}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {products.map((product) => {
                                        const finalPrice = product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price;
                                        const labelKey = LEAF_LABELKEY_BY_SLUG[product.category];
                                        const categoryName = labelKey ? catLabel(labelKey) : product.category;
                                        return (
                                            <div key={product.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <img src={product.image_url} alt={product.name} className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg bg-zinc-200 flex-none" />
                                                    <div className="flex-1 min-w-0 sm:hidden">
                                                        <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            <span suppressHydrationWarning className="font-bold text-amber-600 text-sm">{fmtPrice(finalPrice)}</span>
                                                            {product.discount > 0 && <span suppressHydrationWarning className="text-zinc-400 text-xs line-through">{fmtPrice(product.price)}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1.5 ml-auto sm:hidden">
                                                        <button onClick={() => handleEditProduct(product)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{product.name}</h3>
                                                    <p className="text-zinc-500 text-sm truncate">{product.description}</p>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <span suppressHydrationWarning className="font-bold text-amber-600">{fmtPrice(finalPrice)}</span>
                                                        {product.discount > 0 && <span suppressHydrationWarning className="text-zinc-400 text-sm line-through">{fmtPrice(product.price)}</span>}
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>{product.in_stock ? at.lbl_in_stock : at.lbl_out}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-600 border-zinc-200">{categoryName}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap sm:hidden">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>{product.in_stock ? at.lbl_in_stock : at.lbl_out}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-600 border-zinc-200">{categoryName}</span>
                                                </div>
                                                <div className="hidden sm:flex gap-2">
                                                    <button onClick={() => handleEditProduct(product)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"><Edit size={18} /></button>
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && settings && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">{at.settings_branding}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{at.settings_shop_name}</label>
                                    <input type="text" value={settings.shop_name || ''} onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })} placeholder="Elite Bloemen" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">{at.settings_contacts}</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">📞 {at.settings_phone}</label>
                                    <input type="tel" value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">✈️ Telegram</label>
                                    <input type="url" value={settings.telegram_link || ''} onChange={(e) => setSettings({ ...settings, telegram_link: e.target.value })} placeholder="https://t.me/username" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">📸 Instagram</label>
                                    <input type="url" value={settings.instagram_link || ''} onChange={(e) => setSettings({ ...settings, instagram_link: e.target.value })} placeholder="https://instagram.com/yourshop" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">👍 Facebook</label>
                                    <input type="url" value={settings.facebook_link || ''} onChange={(e) => setSettings({ ...settings, facebook_link: e.target.value })} placeholder="https://facebook.com/yourshop" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">💬 WhatsApp</label>
                                    <input type="url" value={settings.whatsapp_link || ''} onChange={(e) => setSettings({ ...settings, whatsapp_link: e.target.value })} placeholder="https://wa.me/31XXXXXXXXX" className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">📍 {at.settings_address}</label>
                                    <input type="text" value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">🔗 Google Maps {at.settings_maps_link}</label>
                                    <input type="url" value={settings.address_link || ''} onChange={(e) => setSettings({ ...settings, address_link: e.target.value })} placeholder="https://maps.app.goo.gl/..." className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">🗺️ Google Maps Embed</label>
                                    <textarea
                                        rows={3}
                                        value={settings.google_maps_embed || ''}
                                        onChange={(e) => setSettings({ ...settings, google_maps_embed: e.target.value })}
                                        placeholder={at.settings_maps_embed_hint}
                                        className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-xs resize-none"
                                    />
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {at.settings_maps_embed_hint}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">🕐 {at.settings_schedule_title}</label>
                                    <div className="space-y-2">
                                        {(['mon','tue','wed','thu','fri','sat','sun'] as const).map(day => {
                                            const dayLabel = at[`day_${day}` as keyof typeof at];
                                            const isOpen = getScheduleOpen(settings, day);
                                            return (
                                                <div key={day} className="flex items-center gap-2 sm:gap-3 bg-zinc-50 rounded-lg p-2">
                                                    <span className="w-20 sm:w-28 text-xs sm:text-sm font-medium">{dayLabel}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSettings(setScheduleField(settings, day, 'open', !isOpen))}
                                                        className={`relative w-10 h-5 rounded-full transition-colors flex-none ${isOpen ? 'bg-green-500' : 'bg-zinc-300'}`}
                                                    >
                                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOpen ? 'translate-x-5' : ''}`} />
                                                    </button>
                                                    {isOpen ? (
                                                        <input
                                                            type="text"
                                                            value={getScheduleTime(settings, day)}
                                                            onChange={(e) => setSettings(setScheduleField(settings, day, 'time', e.target.value))}
                                                            placeholder="09:00–21:00"
                                                            className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-zinc-400 italic">{at.settings_day_closed}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">{at.settings_content}</h2>
                            <div className="space-y-4">

                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium">💰 {at.settings_delivery_cost}</label>
                                        <button onClick={() => setSettings({ ...settings, delivery_price_enabled: !settings.delivery_price_enabled })} className={`relative w-12 h-6 rounded-full transition-colors ${settings.delivery_price_enabled ? 'bg-green-500' : 'bg-zinc-300'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.delivery_price_enabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                    {settings.delivery_price_enabled && <input type="text" value={settings.delivery_price || ''} onChange={(e) => setSettings({ ...settings, delivery_price: e.target.value })} placeholder="€5" className="w-full px-3 py-2 mt-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />}
                                </div>
                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <label className="text-sm font-medium block mb-2">🚚 {at.settings_delivery_info}</label>
                                    <input type="text" value={settings.delivery_info || ''} onChange={(e) => setSettings({ ...settings, delivery_info: e.target.value })} placeholder={at.settings_delivery_info_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">🌐 {at.settings_translations_title}</summary>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_uk}</label>
                                                <input type="text" value={settings.delivery_info_uk || ''} onChange={(e) => setSettings({ ...settings, delivery_info_uk: e.target.value })} placeholder={at.settings_delivery_info_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_nl}</label>
                                                <input type="text" value={settings.delivery_info_nl || ''} onChange={(e) => setSettings({ ...settings, delivery_info_nl: e.target.value })} placeholder={at.settings_delivery_info_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                        </div>
                                    </details>
                                </div>
                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <label className="text-sm font-medium block mb-2">🏪 {at.settings_pickup}</label>
                                    <input type="text" value={settings.pickup_info || ''} onChange={(e) => setSettings({ ...settings, pickup_info: e.target.value })} placeholder={at.settings_pickup_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">🌐 {at.settings_translations_title}</summary>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_uk}</label>
                                                <input type="text" value={settings.pickup_info_uk || ''} onChange={(e) => setSettings({ ...settings, pickup_info_uk: e.target.value })} placeholder={at.settings_pickup_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_nl}</label>
                                                <input type="text" value={settings.pickup_info_nl || ''} onChange={(e) => setSettings({ ...settings, pickup_info_nl: e.target.value })} placeholder={at.settings_pickup_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                        </div>
                                    </details>
                                </div>
                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <label className="text-sm font-medium block mb-2">💳 {at.settings_payment}</label>
                                    <input type="text" value={settings.payment_info || ''} onChange={(e) => setSettings({ ...settings, payment_info: e.target.value })} placeholder={at.settings_payment_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700">🌐 {at.settings_translations_title}</summary>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_uk}</label>
                                                <input type="text" value={settings.payment_info_uk || ''} onChange={(e) => setSettings({ ...settings, payment_info_uk: e.target.value })} placeholder={at.settings_payment_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-400 mb-1">{at.settings_lbl_nl}</label>
                                                <input type="text" value={settings.payment_info_nl || ''} onChange={(e) => setSettings({ ...settings, payment_info_nl: e.target.value })} placeholder={at.settings_payment_ph} className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm" />
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>

                        {/* Price Filters */}
                        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">💰 {adminLang === 'ru' ? 'Фильтры цен' : 'Price Filters'}</h2>
                            <p className="text-sm text-zinc-500 mb-4">{adminLang === 'ru' ? 'Настройте диапазоны цен для каталога. Пустое макс. значение = "от X".' : 'Configure price ranges for the catalog. Empty max = "from X".'}</p>

                            {/* Current filters list */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {normalizePriceFilters(settings.price_filters).map(f => {
                                    const key = `${f.min}-${f.max ?? 'inf'}`;
                                    const label = f.min === 0 && f.max !== null
                                        ? `${adminLang === 'ru' ? 'до' : 'up to'} €${f.max}`
                                        : f.max === null
                                            ? `${adminLang === 'ru' ? 'от' : 'from'} €${f.min}`
                                            : `€${f.min}–€${f.max}`;
                                    return (
                                        <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-sm font-medium">
                                            {label}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = normalizePriceFilters(settings.price_filters);
                                                    const updated = current.filter(x => !(x.min === f.min && x.max === f.max));
                                                    setSettings({ ...settings, price_filters: updated });
                                                }}
                                                className="text-amber-500 hover:text-red-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Add new filter */}
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">{adminLang === 'ru' ? 'Мин. цена' : 'Min price'}</label>
                                    <input
                                        id="price-filter-min"
                                        type="number"
                                        step="1"
                                        min="0"
                                        defaultValue="0"
                                        className="w-24 px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">{adminLang === 'ru' ? 'Макс. цена (пусто = без границы)' : 'Max price (empty = no limit)'}</label>
                                    <input
                                        id="price-filter-max"
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="∞"
                                        className="w-32 px-3 py-2 border border-zinc-200 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const minEl = document.getElementById('price-filter-min') as HTMLInputElement;
                                        const maxEl = document.getElementById('price-filter-max') as HTMLInputElement;
                                        if (!minEl) return;

                                        const min = Number(minEl.value.trim());
                                        const max = maxEl.value.trim() === '' ? null : Number(maxEl.value.trim());

                                        if (!Number.isFinite(min) || !Number.isInteger(min) || min < 0) {
                                            showNotif(adminLang === 'ru' ? 'Некорректная мин. цена' : 'Invalid min price', 'error');
                                            return;
                                        }
                                        if (max !== null && (!Number.isFinite(max) || !Number.isInteger(max) || max <= min)) {
                                            showNotif(adminLang === 'ru' ? 'Макс. цена должна быть больше мин.' : 'Max must be greater than min', 'error');
                                            return;
                                        }

                                        const current = normalizePriceFilters(settings.price_filters);
                                        const key = `${min}-${max ?? 'inf'}`;
                                        if (current.some(f => `${f.min}-${f.max ?? 'inf'}` === key)) {
                                            showNotif(adminLang === 'ru' ? 'Такой фильтр уже есть' : 'Filter already exists', 'error');
                                            return;
                                        }

                                        const updated: PriceFilter[] = [...current, { min, max }]
                                            .sort((a, b) => (a.max ?? Infinity) - (b.max ?? Infinity) || a.min - b.min);
                                        setSettings({ ...settings, price_filters: updated });
                                        minEl.value = '0';
                                        maxEl.value = '';
                                        showNotif(adminLang === 'ru' ? 'Фильтр добавлен (сохраните настройки)' : 'Filter added (save settings)', 'info');
                                    }}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus size={16} className="inline mr-1" />
                                    {adminLang === 'ru' ? 'Добавить' : 'Add'}
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">{adminLang === 'ru' ? '⚠️ Не забудьте нажать «Сохранить настройки» внизу!' : '⚠️ Don\'t forget to click "Save Settings" below!'}</p>
                            <p className="text-xs text-zinc-400 mt-1">{adminLang === 'ru' ? '💡 Если удалить все фильтры — на сайте будут показаны стандартные.' : '💡 If all filters are removed, default filters will be shown on the site.'}</p>
                        </div>

                        <div className="sticky bottom-0 bg-gray-100 py-3 -mx-4 px-4 sm:static sm:bg-transparent sm:p-0">
                            <button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {at.btn_save_settings}
                            </button>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-800">{at.orders_title}</h2>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/admin/orders');
                                        if (res.ok) { setOrders(await res.json()); showNotif(at.orders_refreshed, 'success'); }
                                    } catch { showNotif('Error', 'error'); }
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                🔄 {at.orders_refresh}
                            </button>
                        </div>

                        {orders.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center text-zinc-400">
                                <ClipboardList size={48} className="mx-auto mb-4 opacity-40" />
                                <p className="text-lg">{at.orders_empty}</p>
                                <p className="text-sm mt-1">{at.orders_empty_sub}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div key={order.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${order.status === 'new' ? 'border-amber-500' : order.status === 'confirmed' ? 'border-blue-500' : order.status === 'completed' ? 'border-green-500' : 'border-zinc-300'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'new' ? 'bg-amber-100 text-amber-800' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'}`}>
                                                        {orderStatusLabel(order.status)}
                                                    </span>
                                                    <span className="text-xs text-zinc-400">{new Date(order.created_at).toLocaleString(adminLang === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="font-semibold text-zinc-800 mt-1">
                                                    {Array.isArray(order.items) ? '🛒' : '📦'}{' '}
                                                    {Array.isArray(order.items)
                                                        ? order.items.map((i: { name: string; quantity: number }) => `${i.name} ×${i.quantity}`).join(', ')
                                                        : order.product_name
                                                    }
                                                </p>
                                                <p className="text-sm text-zinc-600 mt-0.5">👤 {order.customer_name} · 📞 <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">{order.customer_phone}</a></p>
                                                {order.address && <p className="text-sm text-zinc-500">📍 {order.address}</p>}
                                                {order.specific_time && <p className="text-sm text-zinc-500">🕐 {order.specific_time}</p>}
                                                {order.comment && <p className="text-sm text-zinc-500 italic">💬 {order.comment}</p>}
                                                {/* Price breakdown */}
                                                <div className="mt-1">
                                                    {order.order_type === 'cart' && order.delivery_fee != null && order.delivery_fee > 0 && order.items_subtotal != null ? (
                                                        <div className="text-sm space-y-0.5">
                                                            <span className="text-zinc-500">Items: {fmtPrice(order.items_subtotal)}</span>
                                                            <span className="text-zinc-500 ml-2">+ Delivery: {fmtPrice(order.delivery_fee)}</span>
                                                            <p className="text-base font-bold text-emerald-700">
                                                                = {fmtPrice(order.product_price)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-base font-bold text-emerald-700">
                                                            {fmtPrice(order.product_price)}
                                                        </p>
                                                    )}
                                                    <span className="text-xs font-normal text-zinc-400">{order.delivery_type === 'delivery' ? `🚚 ${at.order_delivery}` : `🏪 ${at.order_pickup}`}</span>
                                                </div>
                                                {/* Payment status badge */}
                                                {order.payment_status && (
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            order.payment_status === 'expired' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-zinc-100 text-zinc-600'
                                                        }`}>
                                                            {order.payment_status === 'paid' ? '💳 Paid' :
                                                             order.payment_status === 'pending' ? '⏳ Pending' :
                                                             order.payment_status === 'failed' ? '❌ Failed' :
                                                             order.payment_status === 'expired' ? '⏰ Expired' :
                                                             order.payment_status}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {order.status !== 'confirmed' && order.status !== 'completed' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'confirmed', at.msg_confirmed)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">✅ {at.btn_confirm}</button>
                                                )}
                                                {order.status !== 'completed' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'completed', at.msg_completed)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">📦 {at.btn_complete}</button>
                                                )}
                                                {order.status !== 'cancelled' && (
                                                    <button onClick={() => updateOrderStatus(order.id, 'cancelled', at.msg_cancelled)} className="px-3 py-1.5 bg-zinc-400 hover:bg-zinc-500 text-white rounded-lg text-xs font-medium transition-colors">❌ {at.btn_cancel_order}</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
