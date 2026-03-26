interface ZoomControlsProps {
    scale: number
    onZoomIn: () => void
    onZoomOut: () => void
    onReset: () => void
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
    const buttonStyle: React.CSSProperties = {
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        border: 'none',
        color: '#f1f5f9',
        fontSize: 18,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    }

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
        }}>
            <button
                onClick={onZoomIn}
                style={{ ...buttonStyle, borderBottom: '1px solid #334155' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                title="Zoom In"
            >
                +
            </button>
            <button
                onClick={onReset}
                style={{ 
                    ...buttonStyle, 
                    fontSize: 11, 
                    fontWeight: 500,
                    borderBottom: '1px solid #334155',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                title="Reset Zoom"
            >
                {Math.round(scale * 100)}%
            </button>
            <button
                onClick={onZoomOut}
                style={buttonStyle}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                title="Zoom Out"
            >
                −
            </button>
        </div>
    )
}
