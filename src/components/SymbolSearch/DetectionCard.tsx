import { Check, X } from 'lucide-react'
import { getSnippetUrl, type Detection } from '../../helpers'
import { getConfidenceColor } from './utils'

interface DetectionCardProps {
    detection: Detection
    isActive: boolean
    onSelect: () => void
    onAccept: (detection: Detection) => void
    onReject: () => void
}

export function DetectionCard({ detection, isActive, onSelect, onAccept, onReject }: DetectionCardProps) {
    const confidenceColor = getConfidenceColor(detection.conf)
    
    return (
        <div
            onClick={onSelect}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                backgroundColor: isActive ? '#1e3a5f' : '#1e293b',
                borderRadius: 6,
                cursor: 'pointer',
                border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.15s ease',
            }}
        >
            <img
                src={getSnippetUrl(detection)}
                alt={`Detection ${detection.markup_id}`}
                style={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                    backgroundColor: '#0f172a',
                    borderRadius: 4,
                    border: `2px solid ${confidenceColor}`,
                    flexShrink: 0,
                }}
            />
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
                marginLeft: 'auto',
            }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAccept(detection); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            backgroundColor: '#166534',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            color: '#fff',
                        }}
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onReject(); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            backgroundColor: '#991b1b',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            color: '#fff',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
                <span style={{ fontSize: 11, color: '#ffffff' }}>pg: {detection.page}</span>
            </div>
        </div>
    )
}
