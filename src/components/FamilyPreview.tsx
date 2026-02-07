import React, { useState } from 'react';
import type { Design, ComboType } from '../types';
import { ShoppingCart, ArrowLeft, Check, Users } from 'lucide-react';

interface FamilyPreviewProps {
    design: Design | null;
    onPlaceOrder: (designId: string, comboType: ComboType, sizes: Record<string, string>, customerDetails: { name: string; email: string; phone: string; address: string; countryCode: string }) => Promise<void>;
    onBack: () => void;
}

const FamilyPreview: React.FC<FamilyPreviewProps> = ({ design, onPlaceOrder, onBack }) => {
    const [selectedCombo, setSelectedCombo] = useState<ComboType>('F-M-S-D');
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
        Father: 'L',
        Mother: 'M',
        Son: 'N/A',
        Daughter: 'N/A'
    });
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+91',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    if (!design) return null;

    const combos: { id: ComboType; label: string; members: string[] }[] = [
        { id: 'F-M-S-D', label: 'Complete Family Set', members: ['Father', 'Mother', 'Son', 'Daughter'] },
        { id: 'F-S', label: 'Father & Son', members: ['Father', 'Son'] },
        { id: 'M-D', label: 'Mother & Daughter', members: ['Mother', 'Daughter'] },
        { id: 'F-M', label: 'Couple Set (M/F)', members: ['Father', 'Mother'] },
    ];

    const currentCombo = combos.find(c => c.id === selectedCombo) || combos[0];

    const handleSubmit = async () => {
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            setShowErrors(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await onPlaceOrder(design.id, selectedCombo, selectedSizes, customerDetails);
            setOrderSuccess(true);
        } catch (error) {
            alert('Failed to place order.');
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowOrderForm(false);
        setOrderSuccess(false);
        setShowErrors(false);
        setCustomerDetails({ name: '', email: '', phone: '', countryCode: '+91', address: '' });
        setIsSubmitting(false);
        if (orderSuccess) {
            onBack();
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px max(16px, 2vw)' }}>
            <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '24px', gap: '8px' }}>
                <ArrowLeft size={18} />
                Back to Gallery
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '48px' }}>
                {/* Visual Section */}
                <div>
                    <div style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        aspectRatio: '4/5',
                        background: 'var(--bg-secondary)'
                    }}>
                        <img src={design.imageUrl} alt={design.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '32px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            color: 'white'
                        }}>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>{design.name}</h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>{design.color} • {design.fabric}</p>
                        </div>
                    </div>
                </div>

                {/* Selection Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <section>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={20} />
                            1. Select Combination
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {combos.map(combo => (
                                <button
                                    key={combo.id}
                                    onClick={() => setSelectedCombo(combo.id)}
                                    className={`btn ${selectedCombo === combo.id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '16px', borderRadius: '16px', justifyContent: 'flex-start', textAlign: 'left', minHeight: '80px' }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{combo.label}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '4px' }}>{combo.members.join(', ')}</div>
                                    </div>
                                    {selectedCombo === combo.id && <Check size={18} style={{ marginLeft: 'auto' }} />}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>2. Specify Sizes</h3>
                        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {currentCombo.members.map(member => (
                                <div key={member} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>{member} Size</span>
                                    <select
                                        className="input"
                                        style={{ width: '120px', padding: '8px' }}
                                        value={selectedSizes[member]}
                                        onChange={(e) => setSelectedSizes({ ...selectedSizes, [member]: e.target.value })}
                                    >
                                        <option value="N/A">None</option>
                                        {(member === 'Father' || member === 'Mother') ? (
                                            ['M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} value={s}>{s}</option>)
                                        ) : (
                                            ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'].map(s => <option key={s} value={s}>{s}</option>)
                                        )}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>

                    <button
                        onClick={() => setShowOrderForm(true)}
                        className="btn btn-primary"
                        style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', marginTop: 'auto' }}
                    >
                        <ShoppingCart size={22} />
                        Proceed to Checkout
                    </button>
                </div>
            </div>

            {/* Order Form Modal */}
            {showOrderForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'max(16px, 2vw)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div
                        style={{
                            background: 'var(--bg-main)',
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '500px',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--border-subtle)',
                            padding: '24px',
                            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        {orderSuccess ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', color: '#059669',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto'
                                }}>
                                    <Check size={48} strokeWidth={3} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#059669' }}>Order Placed!</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                    Thank you, {customerDetails.name}.<br />
                                    We have received your order request.
                                </p>
                                <button
                                    onClick={handleCloseModal}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1.1rem' }}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', marginTop: 0 }}>Shipping Details</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Name <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="text"
                                            className={`input ${showErrors && !customerDetails.name ? 'input-error' : ''}`}
                                            placeholder="Enter your full name"
                                            value={customerDetails.name}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                            style={{ width: '100%', padding: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(Optional)</span></label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="Enter your email"
                                            value={customerDetails.email}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                            style={{ width: '100%', padding: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Phone Number <span style={{ color: 'red' }}>*</span></label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select
                                                className="input"
                                                value={customerDetails.countryCode}
                                                onChange={(e) => setCustomerDetails({ ...customerDetails, countryCode: e.target.value })}
                                                style={{ width: '100px', padding: '12px' }}
                                            >
                                                <option value="+91">+91 (IN)</option>
                                                <option value="+1">+1 (US)</option>
                                                <option value="+44">+44 (UK)</option>
                                                <option value="+971">+971 (UAE)</option>
                                                <option value="+61">+61 (AU)</option>
                                            </select>
                                            <input
                                                type="tel"
                                                className={`input ${showErrors && !customerDetails.phone ? 'input-error' : ''}`}
                                                placeholder="Phone number"
                                                value={customerDetails.phone}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*$/.test(val)) {
                                                        setCustomerDetails({ ...customerDetails, phone: val });
                                                    }
                                                }}
                                                style={{ flexGrow: 1, padding: '12px' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Address <span style={{ color: 'red' }}>*</span></label>
                                        <textarea
                                            className={`input ${showErrors && !customerDetails.address ? 'input-error' : ''}`}
                                            placeholder="Enter your delivery address"
                                            value={customerDetails.address}
                                            onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                                            style={{ width: '100%', padding: '12px', minHeight: '80px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleCloseModal}
                                        className="btn btn-ghost"
                                        style={{ flexGrow: 1, padding: '12px', borderRadius: '12px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="btn btn-primary"
                                        style={{ flexGrow: 2, padding: '12px', borderRadius: '12px', fontWeight: 600 }}
                                    >
                                        {isSubmitting ? 'Processing...' : 'Confirm Order'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyPreview;
