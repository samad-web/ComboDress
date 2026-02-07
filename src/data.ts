import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Design, AdultSizeStock, KidsSizeStock, Order } from './types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DESIGNS_KEY = 'tailor_store_designs_v2';
const ORDERS_KEY = 'tailor_store_orders_v1';

const emptyAdult = (): AdultSizeStock => ({ M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 });
const emptyKids = (): KidsSizeStock => ({
    '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0, '5-6': 0,
    '6-7': 0, '7-8': 0, '9-10': 0, '11-12': 0, '13-14': 0
});

export const initialDesigns: Design[] = [
    {
        id: '1',
        name: 'Garden Leaf Print',
        color: 'White / Green',
        fabric: 'Organza',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400',
        inventory: {
            men: { ...emptyAdult(), XXL: 9, '3XL': 3 },
            women: { ...emptyAdult() },
            boys: { ...emptyKids(), '0-1': 20, '1-2': 3, '4-5': 2, '5-6': 6, '6-7': 3, '7-8': 1, '9-10': 3, '13-14': 3 },
            girls: { ...emptyKids(), '0-1': 2, '2-3': 5, '3-4': 6, '5-6': 4, '6-7': 2, '9-10': 3, '11-12': 2 }
        },
        label: 'PREMIUM DESIGN',
        createdAt: Date.now()
    }
];

// --- DESIGNS ---

// --- DESIGNS ---

// Re-use mapOrderFromDB concept if needed, but for designs we already have simple mapping.
// We can export a helper if we want to be consistent, but mapping is simple.

export const fetchDesigns = async (): Promise<Design[]> => {
    // ... (existing code)
    if (!isSupabaseConfigured) {
        const local = localStorage.getItem(DESIGNS_KEY);
        return local ? JSON.parse(local) : initialDesigns;
    }

    const { data, error } = await supabase
        .from('designs')
        .select('*')
        .order('createdat', { ascending: false });

    if (error) {
        console.error('Error fetching designs:', error);
        return initialDesigns;
    }

    return data.map(item => ({
        id: item.id,
        name: item.name,
        color: item.color,
        fabric: item.fabric,
        imageUrl: item.imageurl,
        inventory: item.inventory,
        childType: item.childtype,
        label: item.label,
        createdAt: Number(item.createdat)
    }));
};

export const subscribeToDesigns = (onUpdate: (payload: any) => void) => {
    if (!isSupabaseConfigured) return () => { };

    const subscription = supabase
        .channel('designs_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'designs' }, (payload) => {
            onUpdate(payload);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

export const syncDesign = async (design: Design) => {
    if (!isSupabaseConfigured) {
        const designs = await fetchDesigns();
        const updated = designs.some(d => d.id === design.id)
            ? designs.map(d => d.id === design.id ? design : d)
            : [design, ...designs];
        localStorage.setItem(DESIGNS_KEY, JSON.stringify(updated));
        return;
    }

    const { error } = await supabase
        .from('designs')
        .upsert({
            id: design.id,
            name: design.name,
            color: design.color,
            fabric: design.fabric,
            imageurl: design.imageUrl,
            inventory: design.inventory,
            childtype: design.childType,
            label: design.label,
            createdat: design.createdAt
        });

    if (error) {
        console.error('Error syncing design:', error);
        alert('Sync Error: ' + error.message);
        return false;
    }
};

export const removeDesign = async (id: string) => {
    if (!isSupabaseConfigured) {
        const designs = await fetchDesigns();
        localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs.filter(d => d.id !== id)));
        return;
    }

    const { error } = await supabase
        .from('designs')
        .delete()
        .match({ id });

    if (error) console.error('Error removing design:', error);
};

// --- ORDERS ---

const mapOrderFromDB = (item: any): Order => ({
    id: item.id,
    designId: item.designid,
    designName: 'Loading...', // resolved in UI
    comboType: item.combotype,
    selectedSizes: item.selectedsizes,
    status: item.status,
    customerName: item.customer_name || item.customerName || 'N/A',
    customerPhone: (item.customer_phone || item.customerPhone || 'N/A').toString(),
    customerCountryCode: item.customer_country_code || item.customerCountryCode || '+91',
    customerAddress: item.customer_address || item.customerAddress || 'N/A',
    createdAt: Number(item.createdat),
    notes: item.notes
});

export const fetchOrders = async (): Promise<Order[]> => {
    if (!isSupabaseConfigured) {
        const local = localStorage.getItem(ORDERS_KEY);
        return local ? JSON.parse(local) : [];
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdat', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data.map(mapOrderFromDB);
};

export const subscribeToOrders = (onUpdate: (payload: any) => void) => {
    if (!isSupabaseConfigured) return () => { };

    const subscription = supabase
        .channel('orders_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            onUpdate(payload);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

export { mapOrderFromDB };

export const submitOrder = async (orderData: Partial<Order>) => {
    if (!isSupabaseConfigured) {
        const orders = await fetchOrders();
        const designs = await fetchDesigns();
        const design = designs.find(d => d.id === orderData.designId);

        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            designId: orderData.designId!,
            designName: design?.name || 'Unknown Design',
            comboType: orderData.comboType!,
            selectedSizes: orderData.selectedSizes!,
            customerName: orderData.customerName!,
            customerPhone: orderData.customerPhone!,
            customerCountryCode: orderData.customerCountryCode || '+91',
            customerAddress: orderData.customerAddress!,
            notes: orderData.notes,
            status: 'pending',
            createdAt: Date.now()
        };

        localStorage.setItem(ORDERS_KEY, JSON.stringify([newOrder, ...orders]));
        return;
    }

    const { error } = await supabase
        .from('orders')
        .insert({
            id: Math.random().toString(36).substr(2, 9),
            designid: orderData.designId,
            combotype: orderData.comboType,
            selectedsizes: orderData.selectedSizes,
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone, // Supabase will coerce string to bigint
            customer_country_code: orderData.customerCountryCode,
            customer_address: orderData.customerAddress,
            notes: orderData.notes,
            status: 'pending',
            createdat: Date.now()
        });

    if (error) {
        console.error('Error submitting order:', error);
        alert('Failed to submit order: ' + error.message);
    }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
    if (!isSupabaseConfigured) {
        const orders = await fetchOrders();
        const updated = orders.map(o => o.id === orderId ? { ...o, status: status as any } : o);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
        return;
    }

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .match({ id: orderId });

    if (error) console.error('Error updating order status:', error);
};

export const uploadImage = async (file: File): Promise<string> => {
    if (!isSupabaseConfigured) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from('clothes')
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    const { data } = supabase.storage
        .from('clothes')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const exportToCSV = (designs: Design[]) => {
    const headers = ['Name', 'Fabric', 'Color', 'Child Category', 'Category', 'Size', 'Stock'];
    const rows: string[][] = [];

    designs.forEach(design => {
        (['men', 'women', 'boys', 'girls'] as const).forEach(cat => {
            const inventory = design.inventory[cat];
            Object.entries(inventory).forEach(([size, stock]) => {
                rows.push([
                    design.name,
                    design.fabric,
                    design.color,
                    design.childType || 'none',
                    cat,
                    size,
                    stock.toString()
                ]);
            });
        });
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `tailor_inventory_${new Date().toISOString().split('T')[0]}.csv`);
};

const convertToJpegBlob = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const urlObject = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }
            // Fill white background for transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((newBlob) => {
                URL.revokeObjectURL(urlObject);
                if (newBlob) resolve(newBlob);
                else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', 0.9);
        };

        img.onerror = () => {
            URL.revokeObjectURL(urlObject);
            reject(new Error('Image load failed'));
        };

        img.src = urlObject;
    });
};

export const exportImagesToZip = async (designs: Design[], onProgress?: (p: number) => void) => {
    const zip = new JSZip();
    const folder = zip.folder("design_images");

    for (let i = 0; i < designs.length; i++) {
        const design = designs[i];
        if (!design.imageUrl) continue;

        try {
            const response = await fetch(design.imageUrl, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();

            // Convert to JPEG
            const jpegBlob = await convertToJpegBlob(blob);

            const safeName = design.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            folder?.file(`${safeName}_${design.id.slice(-4)}.jpg`, jpegBlob);
        } catch (error) {
            console.error(`Failed to download image for ${design.name}:`, error);
        }

        if (onProgress) onProgress(Math.round(((i + 1) / designs.length) * 100));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `tailor_designs_images_${new Date().toISOString().split('T')[0]}.zip`);
};

export const downloadSingleImage = async (url: string, name: string) => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();

        // Convert to JPEG
        const jpegBlob = await convertToJpegBlob(blob);

        saveAs(jpegBlob, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`);
    } catch (error) {
        console.error('Download failure:', error);
        alert('Failed to download image. Ensure CORS is configured in your storage settings.');
    }
};

