import { Filter } from 'lucide-react'

interface EmptyFilterStateProps {
    onClearFilter: () => void
}

export function EmptyFilterState({ onClearFilter }: EmptyFilterStateProps) {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            color: '#64748b',
        }}>
            <Filter size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 14, textAlign: 'center' }}>
                No detections match your filter.
            </div>
            <button
                onClick={onClearFilter}
                style={{
                    marginTop: 12,
                    padding: '6px 12px',
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: '#f8fafc',
                    fontSize: 12,
                }}
            >
                Clear Filter
            </button>
        </div>
    )
}
