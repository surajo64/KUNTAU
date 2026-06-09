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

    const primaryGreen = '#1b4332';
    const secondaryGreen = '#2d6a4f';

    const cardBaseStyle = {
        width: cardWidth,
        height: cardHeight,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#333333',
        margin: '10px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        // Reliable accents using borders for both layout and print
        borderTop: `5px solid ${primaryGreen}`,
        borderBottom: `5px solid ${primaryGreen}`,
        borderLeft: '1px solid rgba(0,0,0,0.1)',
        borderRight: '1px solid rgba(0,0,0,0.1)',
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

    // Helper to calculate age
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const logoUrl = getLogoUrl();

    // --- FRONT SIDE RENDER ---
    if (side === 'front') {
        return (
            <div style={cardBaseStyle} id={`patient-card-front-${patient?._id}`}>
                {/* Subtle Background Texture */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#ffffff',
                    backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
                    backgroundSize: '10px 10px',
                    zIndex: 0
                }} />

                {/* Logo Watermark */}
                {logoUrl && (
                    <div style={{
                        position: 'absolute',
                        top: '55%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.04,
                        width: '220px',
                        height: '220px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}>
                        <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                )}

                {/* Content Container */}
                <div style={{ position: 'relative', zIndex: 2, padding: '20px 16px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Header: Logo and Hospital Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '55px',
                            height: '55px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: `1.5px solid ${primaryGreen}`
                        }}>
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Logo"
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <span style={{ color: primaryGreen, fontWeight: '900', fontSize: '10px' }}>ALJOUD</span>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: primaryGreen, textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '1px' }}>
                            {settings?.reportHeader || 'ALJOUD HOSPITAL'}
                        </div>
                    </div>

                    {/* Patient Name and Info Block */}
                    <div style={{ width: '100%', margin: '2px 0' }}>
                        <h2 style={{
                            fontSize: (patient?.name?.length > 20) ? '17px' : '19px',
                            fontWeight: '900',
                            lineHeight: '1.1',
                            margin: '2px 0 6px 0',
                            color: '#1a1a1a'
                        }}>
                            {patient?.name || 'PATIENT NAME'}
                        </h2>

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'x-8 y-4', rowGap: '6px', columnGap: '12px', fontSize: '9px', fontWeight: '700', color: '#444' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ color: secondaryGreen }}>MRN:</span>
                                <span>{patient?.mrn || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ color: secondaryGreen }}>GENDER:</span>
                                <span style={{ textTransform: 'capitalize' }}>{patient?.gender || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ color: secondaryGreen }}>AGE:</span>
                                <span>{patient?.age || calculateAge(patient?.dateOfBirth)} Yrs</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ color: secondaryGreen }}>PHONE:</span>
                                <span>{patient?.contact || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ fontSize: '8px', fontWeight: '800', color: primaryGreen, letterSpacing: '2px', textTransform: 'uppercase' }}>
                        PATIENT ID CARD
                    </div>

                    <div style={{ fontSize: '6px', opacity: 0.3, letterSpacing: '0.5px' }}>
                        Powered by: Apex IT Technovations.
                    </div>
                </div>
            </div>
        );
    }

    // --- BACK SIDE RENDER ---
    return (
        <div style={cardBaseStyle} id={`patient-card-back-${patient?._id}`}>
            {/* Subtle Texture Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#ffffff',
                backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
                backgroundSize: '10px 10px',
                zIndex: 0
            }} />

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                <div style={{ fontSize: '9px', fontWeight: '500', color: '#888', marginBottom: '2px' }}>
                    This identification card is the property of
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#1b4332', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {settings?.reportHeader || 'ALJOUD HOSPITAL'}
                </div>

                <div style={{ fontSize: '8px', color: '#555', fontWeight: '600', lineHeight: '1.4', marginBottom: '8px' }}>
                    {settings?.address || 'No. 51 Bawo Road, Kano'}<br />
                    GSM: <span style={{ color: '#1b4332' }}>{settings?.phone || '07035400899'}</span>
                </div>

                <div style={{ width: '60%', height: '1.5px', background: 'linear-gradient(to right, transparent, #1b4332, transparent)', marginBottom: '8px' }} />

                <div style={{ fontSize: '8px', color: '#333', fontWeight: '700', lineHeight: '1.4', maxWidth: '240px', marginBottom: '8px' }}>
                    If found, kindly call or scan the QR code for verification and our location assistance.
                </div>

                {/* QR Code Container */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '5px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    marginBottom: '8px',
                    border: '1px solid #eee'
                }}>
                    <QRCode
                        value="https://maps.app.goo.gl/J71jZXvhUdQANWtbA"
                        size={64}
                        level="M"
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                </div>

                <div style={{ fontSize: '7px', color: '#999', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                    for return assistance.
                </div>
            </div>
        </div>
    );
};

export default PatientIDCard;
