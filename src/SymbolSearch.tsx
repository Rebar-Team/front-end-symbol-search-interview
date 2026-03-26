import { type Detection } from './helpers'

interface ToolMeta {
    id: string
    category: string
    color: string
    shape: string
    name: string
}

export interface SearchResults {
    action: string
    detections: Detection[]
    metadata: { tool: ToolMeta }
}

interface SymbolSearchProps {
    onResults: (data: SearchResults) => void
    onReset: () => void
}

export function SymbolSearch({ onResults, onReset }: SymbolSearchProps) {
    const handleSearch = async () => {
        const response = await fetch('/symbolSearchResults/results.json')
        const data: SearchResults = await response.json()
        onResults(data)
    }

    return (
        <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            width: 200,
        }}>
            <h2 style={{
                color: '#f8fafc',
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
            }}>
                Symbol Search
            </h2>

            <img
                src="/symbolSearchResults/images/user-detection.png"
                alt="User Detection"
                style={{
                    width: 120,
                    height: 120,
                    objectFit: 'contain',
                    background: '#1e293b',
                    borderRadius: 6,
                    border: '2px solid #3b82f6',
                }}
            />

            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                    onClick={handleSearch}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Search
                </button>
                <button
                    onClick={onReset}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
