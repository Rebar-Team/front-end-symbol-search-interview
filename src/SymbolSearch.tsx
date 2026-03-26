import { useState } from "react"
import { type createToolSVG, getSnippetUrl, type Detection } from './helpers'

export function SymbolSearch() {
    const [results, setResults] = useState<any>(null)

    const handleSearch = async () => {
        const response = await fetch('/symbolSearchResults/results.json')
        const data = await response.json()
        setResults(data)
    }

    return (
        <div style={{
            width: 280,
            height: '100%',
            backgroundColor: '#0f172a',
            borderLeft: '1px solid #334155',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxSizing: 'border-box',
            overflow: 'hidden',
        }}>
            <h2 style={{ 
                color: '#f8fafc', 
                margin: 0, 
                fontSize: 20,
                fontWeight: 600,
            }}>
                Symbol Search
            </h2>
            
            <img 
                src="/symbolSearchResults/images/user-detection.png"
                alt="User Detection"
                style={{ 
                    width: 60, 
                    height: 60, 
                    objectFit: 'contain', 
                    background: '#1e293b', 
                    borderRadius: 4,
                    border: '2px solid #3b82f6',
                    display: 'block',
                    margin: '0 auto',
                }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={handleSearch}
                    style={{
                        flex: 1,
                        padding: '14px 18px',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                    }}
                >
                    Search
                </button>
                <button
                    onClick={() => setResults(null)}
                    style={{
                        flex: 1,
                        padding: '14px 18px',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                    }}
                >
                    Reset
                </button>
            </div>

            {results && (
                <pre style={{
                    flex: 1,
                    overflow: 'auto',
                    color: '#94a3b8',
                    fontSize: 11,
                    margin: 0,
                }}>
                    {JSON.stringify(results, null, 2)}
                </pre>
            )}
        </div>
    )
}
