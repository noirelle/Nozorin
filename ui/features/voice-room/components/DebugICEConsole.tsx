import React, { useState } from 'react';
import { IceDebugData } from '../hooks/webrtc/useWebRTCState';

interface DebugICEConsoleProps {
    data: IceDebugData;
}

export const DebugICEConsole: React.FC<DebugICEConsoleProps> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    backdropFilter: 'blur(10px)',
                }}
            >
                🔧 ICE Debug
            </button>
        );
    }

    const renderCandidate = (candidate: RTCIceCandidate, index: number) => {
        const isRelay = candidate.candidate.includes('relay') || candidate.type === 'relay';
        return (
            <div
                key={index}
                style={{
                    padding: '8px',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    background: isRelay ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderLeft: isRelay ? '4px solid #4CAF50' : '4px solid transparent',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                }}
            >
                <div style={{ fontWeight: 'bold', color: isRelay ? '#4CAF50' : '#888' }}>
                    {candidate.type?.toUpperCase() || 'UNKNOWN'} | {candidate.protocol?.toUpperCase()}
                </div>
                <div>{candidate.address}:{candidate.port}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    {candidate.candidate}
                </div>
            </div>
        );
    };

    const StatusBadge = ({ label, value }: { label: string; value: string }) => {
        let color = '#888';
        if (value === 'connected' || value === 'completed') color = '#4CAF50';
        if (value === 'checking' || value === 'gathering') color = '#2196F3';
        if (value === 'failed' || value === 'disconnected') color = '#F44336';

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>{label}:</span>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${color}22`,
                    color: color,
                    border: `1px solid ${color}44`,
                    textTransform: 'uppercase'
                }}>
                    {value}
                </span>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxHeight: '80vh',
            zIndex: 9999,
            background: 'rgba(15, 15, 20, 0.95)',
            color: '#eee',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
        }}>
            <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>WebRTC ICE Debug Console</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: '18px'
                    }}
                >
                    ×
                </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                <section style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Diagnostics
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>Config Active:</span>
                        <span style={{ color: data.isConfigured ? '#4CAF50' : '#F44336', fontSize: '11px', fontWeight: 'bold' }}>
                            {data.isConfigured ? 'YES' : 'NO'}
                        </span>
                    </div>
                    {data.iceCandidateError && (
                        <div style={{ 
                            padding: '8px', 
                            background: 'rgba(244, 67, 54, 0.1)', 
                            border: '1px solid rgba(244, 67, 54, 0.3)', 
                            color: '#F44336', 
                            fontSize: '10px',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}>
                            Error: {data.iceCandidateError}
                        </div>
                    )}
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Connection Status
                    </h4>

                    <StatusBadge label="Connection State" value={data.connectionState} />
                    <StatusBadge label="ICE Connection" value={data.iceConnectionState} />
                    <StatusBadge label="ICE Gathering" value={data.iceGatheringState} />
                    <StatusBadge label="Signaling State" value={data.signalingState} />
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', marginBottom: '12px', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                        Local Candidates
                        <span style={{ color: '#4CAF50' }}>{data.localCandidates.filter(c => c.candidate.includes('relay')).length} relay</span>
                    </h4>
                    {data.localCandidates.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#444', fontStyle: 'italic' }}>Waiting for candidates...</div>
                    ) : (
                        data.localCandidates.map(renderCandidate)
                    )}
                </section>

                <section>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Remote Candidates
                    </h4>
                    {data.remoteCandidates.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#444', fontStyle: 'italic' }}>Waiting for candidates...</div>
                    ) : (
                        data.remoteCandidates.map(renderCandidate)
                    )}
                </section>
            </div>

            <div style={{
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                fontSize: '10px',
                color: '#666',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                TIP: If "RELAY" candidates appear green, your TURN server is being used.
            </div>
        </div>
    );
};
