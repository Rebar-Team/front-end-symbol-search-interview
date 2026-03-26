interface SearchHeaderProps {
    onSearch: () => void
    onReset: () => void
}

export function SearchHeader({ onSearch, onReset }: SearchHeaderProps) {
    return (
        <>
            <h2 style={{ 
                color: '#f8fafc', 
                margin: 0, 
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 12,
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
                    margin: '0 auto 12px',
                }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={onSearch}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: 6,
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
                        padding: '10px 14px',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Reset
                </button>
            </div>
        </>
    )
}
