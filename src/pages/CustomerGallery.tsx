import React, { useState, useMemo } from 'react';
import type { Design, ComboType, AdultSizeStock, KidsSizeStock } from '../types';
import { Sparkles, ArrowRight, CheckCircle, Filter, Users, Baby, Download, X } from 'lucide-react';
import { downloadSingleImage } from '../data';

interface CustomerGalleryProps {
    designs: Design[];
    onSelect: (design: Design) => void;
    selectedDesign: Design | null;
}

type FilterType = 'ALL' | ComboType | 'boys' | 'girls' | 'unisex';

const CustomerGallery: React.FC<CustomerGalleryProps> = ({ designs, onSelect, selectedDesign }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [showResults, setShowResults] = useState(false);
    const [filterSizes, setFilterSizes] = useState<Record<string, string>>({
        'men': 'L',
        'women': 'M',
        'boys': '4-5',
        'girls': '4-5'
    });


    const adultSizes: (keyof AdultSizeStock)[] = ['M', 'L', 'XL', 'XXL', '3XL'];
    const kidsSizes: (keyof KidsSizeStock)[] = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '9-10', '11-12', '13-14'];

    const combos: { id: ComboType; label: string }[] = [
        { id: 'F-M-S-D', label: 'Full Family Set' },
        { id: 'F-S', label: 'Father & Son' },
        { id: 'M-D', label: 'Mother & Daughter' },
        { id: 'F-M', label: 'Couple Set' },
    ];

    const childCategories: { id: 'boys' | 'girls' | 'unisex'; label: string }[] = [
        { id: 'boys', label: 'Boys Selection' },
        { id: 'girls', label: 'Girls Selection' },
        { id: 'unisex', label: 'Unisex / Both' },
    ];

    const comboMembers = {
        'F-M-S-D': ['men', 'women', 'boys', 'girls'],
        'F-S': ['men', 'boys'],
        'M-D': ['women', 'girls'],
        'F-M': ['men', 'women'],
    };

    const filteredDesigns = useMemo(() => {
        return designs.filter(design => {
            // 1. Combo / Category Filter
            let passesCategory = true;
            if (activeFilter !== 'ALL') {
                if (['boys', 'girls', 'unisex'].includes(activeFilter)) {
                    const cf = activeFilter as 'boys' | 'girls' | 'unisex';
                    if (cf === 'unisex') {
                        if (design.childType !== 'unisex') {
                            const hasBoys = Object.values(design.inventory.boys).some(s => s > 0);
                            const hasGirls = Object.values(design.inventory.girls).some(s => s > 0);
                            if (!(hasBoys && hasGirls)) passesCategory = false;
                        }
                    } else {
                        if (design.childType && design.childType !== cf && design.childType !== 'unisex') passesCategory = false;
                        else {
                            const inventory = design.inventory[cf as keyof Design['inventory']];
                            const hasStock = Object.values(inventory).some(stock => stock > 0);
                            if (!hasStock) passesCategory = false;
                        }
                    }
                } else {
                    const members = comboMembers[activeFilter as ComboType];
                    passesCategory = members.every(member => {
                        const inventory = design.inventory[member as keyof Design['inventory']];
                        return Object.values(inventory).some(stock => stock > 0);
                    });
                }
            }

            if (!passesCategory) return false;

            // 3. Strict Size Filter
            let membersToCheck: string[] = [];

            if (activeFilter === 'ALL') {
                // Only check sizes for members that exist in this design
                membersToCheck = ['men', 'women', 'boys', 'girls'].filter(m => {
                    const inv = design.inventory[m as keyof Design['inventory']];
                    return Object.values(inv).some(val => val > 0);
                });
            } else {
                // For specific filters, strict check required members
                membersToCheck = ['boys', 'girls', 'unisex'].includes(activeFilter)
                    ? (activeFilter === 'unisex' ? ['boys', 'girls'] : [activeFilter])
                    : comboMembers[activeFilter as ComboType];
            }

            // If no members have stock (empty design), hide it
            if (membersToCheck.length === 0) return false;

            return membersToCheck.every(member => {
                const m = member as keyof Design['inventory'];
                return (design.inventory[m] as any)[filterSizes[m]] > 0;
            });
        });
    }, [designs, activeFilter, filterSizes]);

    return (
        <div style={{ padding: '0 max(16px, 2vw) 24px max(16px, 2vw)', width: '100%', overflowX: 'hidden' }}>

            <div style={{ textAlign: 'center', marginBottom: '16px', marginTop: '0px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Our Exclusive Collection</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Find the perfect matching set for your family</p>
            </div>

            {/* Filter Section */}
            {/* Filter Section */}
            <div
                style={{
                    maxWidth: '1000px',
                    margin: '0 auto 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'var(--bg-secondary)',
                    padding: '24px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-subtle)',
                    width: '100%',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >


                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* All / Combos */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Users size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Combinations
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
                            >
                                All Designs
                            </button>
                            {combos.map((combo) => (
                                <button
                                    key={combo.id}
                                    onClick={() => setActiveFilter(combo.id)}
                                    className={`btn ${activeFilter === combo.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
                                >
                                    {combo.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Children Categories */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Baby size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Children
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {childCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveFilter(cat.id)}
                                    className={`btn ${activeFilter === cat.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Filter size={16} color="var(--primary)" />
                            Filter by Exact Sizes
                        </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                        {['men', 'women', 'boys', 'girls'].map(member => {
                            // Only show size picker for members involved in current filter
                            const isMemberActive = activeFilter === 'ALL' ||
                                (['boys', 'girls', 'unisex'].includes(activeFilter)
                                    ? (activeFilter === 'unisex' ? (member === 'boys' || member === 'girls') : member === activeFilter)
                                    : comboMembers[activeFilter as ComboType].includes(member));

                            if (!isMemberActive) return null;

                            const sizes = (member === 'men' || member === 'women') ? adultSizes : kidsSizes;

                            return (
                                <div key={member}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'capitalize' }}>
                                        {member} Size
                                    </label>
                                    <select
                                        className="input"
                                        style={{ padding: '4px 8px', height: 'auto', fontSize: '0.9rem', background: 'var(--bg-main)' }}
                                        value={filterSizes[member]}
                                        onChange={(e) => setFilterSizes({ ...filterSizes, [member]: e.target.value })}
                                    >
                                        {sizes.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => { setShowResults(true); }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', borderRadius: '16px', marginTop: '4px', fontSize: '1rem', fontWeight: 600 }}
                >
                    Find Matching Outfits ({filteredDesigns.length})
                </button>
            </div>

            {showResults && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3000,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'max(16px, 2vw)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-subtle)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Found {filteredDesigns.length} Designs</h3>
                            <button
                                onClick={() => setShowResults(false)}
                                className="btn btn-ghost"
                                style={{
                                    padding: '8px',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Close Results"
                            >
                                <X size={24} color="var(--primary)" />
                            </button>
                        </div>

                        <div style={{
                            overflowY: 'auto',
                            padding: '24px',
                            flexGrow: 1
                        }}>
                            {filteredDesigns.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5, border: '1px dashed var(--border-subtle)', borderRadius: '24px' }}>
                                    <Filter size={64} style={{ marginBottom: '24px', color: 'var(--primary)' }} />
                                    <h2>No matching designs</h2>
                                    <p>Try selecting another category.</p>
                                    <button
                                        onClick={() => { setActiveFilter('ALL'); }}
                                        className="btn btn-ghost"
                                        style={{ marginTop: '16px' }}
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="dashboard-grid">
                                    {filteredDesigns.map(design => (
                                        <div
                                            key={design.id}
                                            className={`glass-card ${selectedDesign?.id === design.id ? 'active' : ''}`}
                                            style={{
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                background: 'var(--bg-main)',
                                                border: selectedDesign?.id === design.id ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                                                borderRadius: '24px',
                                                transform: selectedDesign?.id === design.id ? 'translateY(-8px)' : 'none',
                                                position: 'relative',
                                                boxShadow: selectedDesign?.id === design.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                                            }}
                                            onClick={() => onSelect(design)}
                                        >
                                            {selectedDesign?.id === design.id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '16px',
                                                    right: '16px',
                                                    background: 'var(--primary)',
                                                    borderRadius: '50%',
                                                    padding: '6px',
                                                    zIndex: 20
                                                }}>
                                                    <CheckCircle size={18} color="white" />
                                                </div>
                                            )}

                                            <div className="mobile-full-bleed" style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
                                                <img
                                                    src={design.imageUrl}
                                                    alt={design.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                                    className="gallery-img"
                                                />
                                                {design.childType && design.childType !== 'none' && (
                                                    <div style={{
                                                        position: 'absolute', top: '16px', left: '16px',
                                                        background: 'var(--bg-main)', padding: '6px 14px',
                                                        borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
                                                        color: 'var(--text-main)', border: '1px solid var(--border-subtle)',
                                                        textTransform: 'uppercase', boxShadow: 'var(--shadow-sm)',
                                                        zIndex: 10
                                                    }}>
                                                        {design.childType}
                                                    </div>
                                                )}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    padding: '24px',
                                                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
                                                    color: 'white'
                                                }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{design.name}</h3>
                                                    <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 500 }}>
                                                        {design.color} • {design.fabric}
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Sparkles size={16} color="var(--primary)" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                        {design.label || 'PREMIUM DESIGN'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadSingleImage(design.imageUrl, design.name); }}
                                                        className="btn btn-ghost"
                                                        style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
                                                        title="Download Image"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelect(design); }}
                                                        className={`btn ${selectedDesign?.id === design.id ? 'btn-primary' : 'btn-ghost'}`}
                                                        style={{
                                                            padding: '10px 20px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85rem',
                                                            border: selectedDesign?.id === design.id ? 'none' : '1px solid var(--border-subtle)'
                                                        }}
                                                    >
                                                        {selectedDesign?.id === design.id ? 'Selected' : 'Select'}
                                                        <ArrowRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerGallery;
