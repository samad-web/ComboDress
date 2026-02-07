import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Design, Order, ComboType } from './types';
import { fetchDesigns, syncDesign, removeDesign, fetchOrders, submitOrder, updateOrderStatus, subscribeToOrders, subscribeToDesigns, mapOrderFromDB } from './data';
import Navigation from './components/Navigation';
import StaffDashboard from './pages/StaffDashboard';
import DesignManager from './pages/DesignManager';
import CustomerGallery from './pages/CustomerGallery';
import FamilyPreview from './components/FamilyPreview';


function App() {
    const [designs, setDesigns] = useState<Design[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const [activeTab, setActiveTab] = useState<string>('gallery');
    const [editingDesign, setEditingDesign] = useState<Design | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    // Sync state with URL
    useEffect(() => {
        if (location.pathname.startsWith('/staffview')) {
            if (activeTab === 'gallery' || activeTab === 'preview') {
                setActiveTab('dashboard');
            }
        } else if (location.pathname.startsWith('/customerview')) {
            if (activeTab !== 'gallery' && activeTab !== 'preview') {
                setActiveTab('gallery');
            }
        }
    }, [location.pathname]);

    const init = async () => {
        try {
            setLoading(true);
            const [designsData, ordersData] = await Promise.all([
                fetchDesigns(),
                fetchOrders()
            ]);
            setDesigns(designsData);
            setOrders(ordersData);
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to connect to database. Falling back to local mode.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();

        // Real-time subscription for Orders
        const unsubOrders = subscribeToOrders((payload: any) => {
            if (payload.eventType === 'INSERT') {
                const newOrder = mapOrderFromDB(payload.new);
                setOrders(prev => [newOrder, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                const updatedOrder = mapOrderFromDB(payload.new);
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            } else if (payload.eventType === 'DELETE') {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            }
        });

        // Real-time subscription for Designs (Inventory)
        const unsubDesigns = subscribeToDesigns((payload: any) => {
            // Helper to map DB row to Design object
            const mapDesign = (item: any): Design => ({
                id: item.id,
                name: item.name,
                color: item.color,
                fabric: item.fabric,
                imageUrl: item.imageurl,
                inventory: item.inventory,
                childType: item.childtype,
                label: item.label,
                createdAt: Number(item.createdat)
            });

            if (payload.eventType === 'INSERT') {
                setDesigns(prev => [mapDesign(payload.new), ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                setDesigns(prev => prev.map(d => d.id === payload.new.id ? mapDesign(payload.new) : d));
            } else if (payload.eventType === 'DELETE') {
                setDesigns(prev => prev.filter(d => d.id !== payload.old.id));
            }
        });

        return () => {
            unsubOrders();
            unsubDesigns();
        };
    }, []);


    const updateInventory = async (designId: string, category: string, size: string, newValue: number) => {
        let updatedDesign: Design | null = null;
        const newDesigns = designs.map(d => {
            if (d.id === designId) {
                const cat = category as keyof Design['inventory'];
                updatedDesign = {
                    ...d,
                    inventory: {
                        ...d.inventory,
                        [cat]: {
                            ...(d.inventory[cat] as any),
                            [size]: Math.max(0, newValue)
                        }
                    }
                };
                return updatedDesign;
            }
            return d;
        });

        if (updatedDesign) {
            setDesigns(newDesigns);
            await syncDesign(updatedDesign);
        }
    };

    const deleteDesign = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this design?')) {
            setDesigns(prev => prev.filter(d => d.id !== id));
            await removeDesign(id);
        }
    };

    const saveDesign = async (designData: Partial<Design>) => {
        let finalDesign: Design;
        if (editingDesign) {
            finalDesign = { ...editingDesign, ...designData } as Design;
            setDesigns(prev => prev.map(d => d.id === editingDesign.id ? finalDesign : d));
        } else {
            finalDesign = {
                ...designData,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: Date.now(),
            } as Design;
            setDesigns(prev => [finalDesign, ...prev]);
        }

        await syncDesign(finalDesign);
        setEditingDesign(null);
        setActiveTab('dashboard');
    };

    const handlePlaceOrder = async (designId: string, comboType: ComboType, selectedSizes: Record<string, string>, customerDetails: { name: string; phone: string; address: string }) => {
        // ...
        await submitOrder({ designId, comboType, selectedSizes, ...customerDetails });
        // No need to fetchOrders manually anymore, subscription will catch it
        // But keeping it for immediate local feedback if net is slow isn't bad, though effectively redundant with optimistic updates or real-time.
        // Actually, submitOrder doesn't return the full object with ID optionally.
        // Let's rely on subscription. But fetchOrders ensures sync.
        // fetchOrders also handles fallback mode.
        if (!import.meta.env.VITE_SUPABASE_URL) {
            const ordersData = await fetchOrders();
            setOrders(ordersData);
        }
    };

    const handleAcceptOrder = async (order: Order) => {
        if (order.status !== 'pending') {
            alert('This order has already been processed.');
            return;
        }

        for (const [member, size] of Object.entries(order.selectedSizes)) {
            if (size === 'N/A') continue; // Skip if user selected None

            // ... logic ...
            const category = member === 'Father' ? 'men' :
                member === 'Mother' ? 'women' :
                    member === 'Son' ? 'boys' : 'girls';

            const design = designs.find(d => d.id === order.designId);
            if (design) {
                const currentStock = (design.inventory[category as keyof typeof design.inventory] as any)[size] || 0;
                await updateInventory(order.designId, category, size, Math.max(0, currentStock - 1));
            }
        }
        await updateOrderStatus(order.id, 'accepted');

        if (!import.meta.env.VITE_SUPABASE_URL) {
            const ordersData = await fetchOrders();
            setOrders(ordersData);
            alert('Order accepted and stock deducted!');
        } else {
            // Optimistic update for Supabase mode
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'accepted' } : o));
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== 'pending') {
            alert('This order has already been processed.');
            return;
        }
        await updateOrderStatus(orderId, 'rejected');

        if (!import.meta.env.VITE_SUPABASE_URL) {
            const ordersData = await fetchOrders();
            setOrders(ordersData);
        } else {
            // Optimistic update for Supabase mode
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spin" style={{
                        width: '40px', height: '40px', border: '4px solid var(--border-subtle)',
                        borderTopColor: 'var(--primary)', borderRadius: '50%'
                    }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading Combo Dress...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            <Navigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main style={{ flexGrow: 1 }}>
                <Routes>
                    <Route path="/staffview" element={
                        <>
                            {(activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'staff-gallery') && (
                                <StaffDashboard
                                    designs={designs}
                                    orders={orders}
                                    updateInventory={updateInventory}
                                    deleteDesign={deleteDesign}
                                    viewMode={activeTab === 'orders' ? 'orders' : activeTab === 'staff-gallery' ? 'gallery' : 'inventory'}
                                    setViewMode={(mode) => {
                                        if (mode === 'gallery') setActiveTab('staff-gallery');
                                        else if (mode === 'orders') setActiveTab('orders');
                                        else setActiveTab('dashboard');
                                    }}
                                    onBack={() => {
                                        if (activeTab === 'orders' || activeTab === 'staff-gallery') {
                                            setActiveTab('dashboard');
                                        } else {
                                            navigate('/customerview');
                                        }
                                    }}
                                    onEdit={(d) => {
                                        setEditingDesign(d);
                                        setActiveTab('manage');
                                    }}
                                    onAddNew={() => {
                                        setEditingDesign(null);
                                        setActiveTab('manage');
                                    }}
                                    onAcceptOrder={handleAcceptOrder}
                                    onRejectOrder={handleRejectOrder}
                                />
                            )}
                            {activeTab === 'manage' && (
                                <DesignManager
                                    editingDesign={editingDesign}
                                    onSave={saveDesign}
                                    onCancel={() => {
                                        setEditingDesign(null);
                                        setActiveTab('dashboard');
                                    }}
                                />
                            )}
                        </>
                    } />
                    <Route path="/customerview" element={
                        <>
                            {activeTab === 'gallery' && (
                                <CustomerGallery
                                    designs={designs}
                                    selectedDesign={selectedDesign}
                                    onSelect={(d) => {
                                        setSelectedDesign(d);
                                        setActiveTab('preview');
                                    }}
                                />
                            )}
                            {activeTab === 'preview' && (
                                <FamilyPreview
                                    design={selectedDesign}
                                    onPlaceOrder={handlePlaceOrder}
                                    onBack={() => setActiveTab('gallery')}
                                />
                            )}
                        </>
                    } />
                    <Route path="*" element={<Navigate to="/customerview" replace />} />
                </Routes>
            </main>

            <footer style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
                fontSize: '0.9rem'
            }}>
                © 2026 Combodress.com • Developed by <a href="https://sirahdigital.in/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sirah Digital</a>
            </footer>
        </div>
    );
}

export default App;
