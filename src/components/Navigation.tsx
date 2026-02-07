import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, ShoppingBag, LayoutDashboard } from 'lucide-react';


interface NavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    const location = useLocation();
    return (
        <nav style={{
            padding: '16px max(16px, 2vw)',
            background: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--primary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <Home size={18} />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    ComboDress <span style={{ fontWeight: 400, opacity: 0.5 }}>Store</span>
                </h1>
            </div>

            <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                ...(location.pathname.startsWith('/customerview') ? {
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                } : {})
            }}>
                <button
                    onClick={() => {
                        if (location.pathname.startsWith('/staffview')) {
                            setActiveTab('staff-gallery');
                        } else {
                            setActiveTab('gallery');
                        }
                    }}
                    className={`btn ${activeTab === 'gallery' || activeTab === 'staff-gallery' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ gap: '6px', fontSize: '0.85rem' }}
                >
                    <ShoppingBag size={16} />
                    Gallery
                </button>

                {!location.pathname.startsWith('/customerview') && (
                    <>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 8px' }} />
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ gap: '6px', fontSize: '0.85rem' }}
                        >
                            <LayoutDashboard size={16} />
                            <span className="tablet-up">Inventory</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ gap: '6px', fontSize: '0.85rem' }}
                        >
                            <ShoppingBag size={16} />
                            <span className="tablet-up">Orders</span>
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
