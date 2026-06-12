import React from 'react';
import QRCode from 'react-qr-code';

/**
 * PatientIDCard Component
 * Renders an ATM-sized (85.6mm x 54mm) ID card.
 * Supports 'front' and 'back' sides.
 */
const PatientIDCard = ({ patient, settings, side = 'front' }) => {
    const cardWidth = '85.6mm';
    const cardHeight = '53.98mm';

    const goldAccent = '#ffd700';
    const deepNavy = '#001e3c';
    const mainBlue = '#2563eb';
    const premiumGradient = 'linear-gradient(180deg, #2563eb 0%, #7c3aed 100%)';

    const cardBaseStyle = {
        width: cardWidth,
        height: cardHeight,
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        margin: '10px auto',
        display: 'flex',
        flexDirection: 'column',
        // Reliable accents
        borderTop: `4px solid ${goldAccent}`,
        // Ensure colors show in print
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
    };

    // Helper to resolve logo URL
    const getLogoUrl = () => {
        if (!settings?.hospitalLogo) return null;
        if (settings.hospitalLogo.startsWith('data:image')) return settings.hospitalLogo;
        if (settings.hospitalLogo.startsWith('http')) return settings.hospitalLogo;
        const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
        if (settings.hospitalLogo.startsWith('/uploads/') || settings.hospitalLogo.startsWith('uploads/')) {
            const separator = (baseUrl.endsWith('/') || settings.hospitalLogo.startsWith('/')) ? '' : '/';
            return `${baseUrl}${separator}${settings.hospitalLogo}`;
        }
        return `${baseUrl}/uploads/${settings.hospitalLogo}`;
    };

    const logoUrl = getLogoUrl();

    // --- FRONT SIDE RENDER ---
    if (side === 'front') {
        return (
            <div style={cardBaseStyle} id={`patient-card-front-${patient?._id}`}>
                {/* Premium Gradient Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: premiumGradient,
                    zIndex: 0
                }} />

                {/* Subtle Geometric Pattern Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '15px 15px',
                    zIndex: 1
                }} />

                {/* Content Container */}
                <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ fontSize: '10px', fontWeight: '900', color: deepNavy }}>ALJOUD</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: (settings?.reportHeader?.length > 20) ? '13px' : '15px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                color: '#ffffff',
                                lineHeight: 1.1,
                                whiteSpace: 'nowrap'
                            }}>
                                {settings?.reportHeader || 'ALJOUD HOSPITAL'}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: '800', color: goldAccent, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>
                                Clinical Excellence
                            </div>
                        </div>
                    </div>

                    {/* Patient Identity */}
                    <div style={{ textAlign: 'left', marginTop: '8px', padding: '0 20px' }}>
                        <div style={{ fontSize: '7px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                            Patient Name
                        </div>
                        <h2 style={{
                            fontSize: (patient?.name?.length > 25) ? '14px' : (patient?.name?.length > 18) ? '16px' : '18px',
                            fontWeight: '900',
                            margin: 0,
                            color: '#ffffff',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {patient?.name?.toUpperCase() || 'PATIENT NAME'}
                        </h2>
                    </div>

                    <div style={{ padding: '0 15px', width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(60px, 1.2fr) 0.8fr 0.7fr minmax(70px, 1.3fr)',
                            gap: '4px',
                            background: 'rgba(0,0,0,0.15)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '100%',
                            maxWidth: ' calc(100% - 10px)',
                            margin: '0 auto',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '5.5px', fontWeight: '800', color: goldAccent, textTransform: 'uppercase', marginBottom: '1px' }}>MRN</div>
                                <div style={{ fontSize: '7.5px', fontWeight: '900', whiteSpace: 'nowrap' }}>{patient?.mrn || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '5.5px', fontWeight: '800', color: goldAccent, textTransform: 'uppercase', marginBottom: '1px' }}>Gender</div>
                                <div style={{ fontSize: '7.5px', fontWeight: '900', textTransform: 'capitalize' }}>{patient?.gender || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '5.5px', fontWeight: '800', color: goldAccent, textTransform: 'uppercase', marginBottom: '1px' }}>Age</div>
                                <div style={{ fontSize: '7.5px', fontWeight: '900' }}>{patient?.age || 'N/A'} Yrs</div>
                            </div>
                            <div style={{ overflow: 'hidden', textAlign: 'right' }}>
                                <div style={{ fontSize: '5.5px', fontWeight: '800', color: goldAccent, textTransform: 'uppercase', marginBottom: '1px' }}>Category</div>
                                <div style={{ fontSize: '7.5px', fontWeight: '900', whiteSpace: 'nowrap' }}>{patient?.provider || 'Standard'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Accent */}
                    <div style={{ padding: '0 20px 14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '9px', fontWeight: '900', color: goldAccent, letterSpacing: '2px' }}>
                            PATIENT ID CARD
                        </div>
                        <div style={{ fontSize: '6px', opacity: 0.4 }}>
                            Ref: {new Date().getFullYear()}
                        </div>
                    </div>
                </div>

                {/* Watermark Logo */}
                {logoUrl && (
                    <div style={{
                        position: 'absolute',
                        top: '40%',
                        right: '-5%',
                        transform: 'rotate(-15deg)',
                        opacity: 0.08,
                        width: '180px',
                        height: '180px',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}>
                        <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    </div>
                )}
            </div>
        );
    }

    // --- BACK SIDE RENDER ---
    return (
        <div style={{ ...cardBaseStyle, backgroundColor: '#ffffff', borderTop: `5px solid ${mainBlue}`, borderBottom: `5px solid ${mainBlue}`, color: '#2b2b2b' }} id={`patient-card-back-${patient?._id}`}>
            <div style={{ position: 'relative', zIndex: 1, padding: '16px 20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#666', marginBottom: '2px' }}>Identification Property of</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: mainBlue }}>{settings?.reportHeader || 'ALJOUD HOSPITAL'}</div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '9px', color: '#444', fontWeight: '600' }}>
                    {settings?.address || 'Kano, Nigeria'}<br />
                    T: {settings?.phone || '07000000000'} | E: info@aljoud.com
                </div>

                <div style={{ width: '100%', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: mainBlue, marginBottom: '6px', textTransform: 'uppercase' }}>Scan for Verification</div>
                    <div style={{ padding: '6px', border: `1px solid ${mainBlue}`, borderRadius: '8px' }}>
                        <QRCode value="https://maps.app.goo.gl/J71jZXvhUdQANWtbA" size={64} level="M" />
                    </div>
                </div>

                <div style={{ fontSize: '8px', color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '0 10px' }}>
                    This card is non-transferable. If found, please return to any Aljoud Hospital branch.
                </div>
            </div>
        </div>
    );
};

export default PatientIDCard;
