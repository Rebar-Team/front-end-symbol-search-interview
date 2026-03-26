import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import type { Detection } from '../../helpers'

interface PageFilterProps {
    availablePages: number[]
    selectedPages: Set<number>
    detections: Detection[]
    isOpen: boolean
    onToggleOpen: () => void
    onTogglePage: (page: number) => void
    onSelectAll: () => void
    onClearAll: () => void
}

export function PageFilter({
    availablePages,
    selectedPages,
    detections,
    isOpen,
    onToggleOpen,
    onTogglePage,
    onSelectAll,
    onClearAll,
}: PageFilterProps) {
    if (availablePages.length === 0) return null

    return (
        <div style={{ marginTop: 12 }}>
            <button
                onClick={onToggleOpen}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: selectedPages.size > 0 ? '#1e40af' : '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#f8fafc',
                    fontSize: 13,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={14} />
                    <span>
                        {selectedPages.size === 0 
                            ? `Filter by Page (${availablePages.length} pages)` 
                            : `Filtering: ${selectedPages.size} page${selectedPages.size > 1 ? 's' : ''}`
                        }
                    </span>
                </div>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {isOpen && (
                <div style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: '#1e293b',
                    borderRadius: 6,
                    border: '1px solid #334155',
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: 8,
                        gap: 8,
                    }}>
                        <button
                            onClick={onSelectAll}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                backgroundColor: '#166534',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 500,
                            }}
                        >
                            Select All
                        </button>
                        <button
                            onClick={onClearAll}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                backgroundColor: '#475569',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 500,
                            }}
                        >
                            Clear All
                        </button>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                    }}>
                        {availablePages.map(page => {
                            const isSelected = selectedPages.has(page)
                            const countOnPage = detections.filter(d => d.page === page).length
                            return (
                                <button
                                    key={page}
                                    onClick={() => onTogglePage(page)}
                                    style={{
                                        padding: '4px 10px',
                                        backgroundColor: isSelected ? '#3b82f6' : '#0f172a',
                                        border: isSelected ? '1px solid #60a5fa' : '1px solid #475569',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        color: isSelected ? '#fff' : '#94a3b8',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    Pg {page} ({countOnPage})
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
