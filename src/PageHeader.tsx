interface PageHeaderProps {
    name: string
    page: number
    numPages: number
    onPageChange: (page: number) => void
}

export function PageHeader({ name, page, numPages, onPageChange }: PageHeaderProps) {
    return (
        <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderRadius: 12,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: 13,
            pointerEvents: 'auto',
        }}>
            <span style={{ fontWeight: 600 }}>{name}</span>
            <span style={{ color: '#334155' }}>|</span>
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
            >
                ‹
            </button>
            <span style={{ color: '#cbd5e1' }}>Page {page} / {numPages}</span>
            <button
                onClick={() => onPageChange(Math.min(numPages, page + 1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
            >
                ›
            </button>
        </div>
    )
}
