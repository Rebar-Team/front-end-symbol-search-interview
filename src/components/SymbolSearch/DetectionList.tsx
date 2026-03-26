import type { Detection } from '../../helpers'
import { DetectionCard } from './DetectionCard'

interface DetectionListProps {
    detections: Detection[]
    activeId: number | null
    onSelect: (detection: Detection) => void
    onAccept: (detection: Detection) => void
    onReject: (markupId: number) => void
}

export function DetectionList({ detections, activeId, onSelect, onAccept, onReject }: DetectionListProps) {
    if (detections.length === 0) return null

    return (
        <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
            }}>
                {detections.map((detection) => (
                    <DetectionCard
                        key={detection.markup_id}
                        detection={detection}
                        isActive={activeId === detection.markup_id}
                        onSelect={() => onSelect(detection)}
                        onAccept={onAccept}
                        onReject={() => onReject(detection.markup_id)}
                    />
                ))}
            </div>
        </div>
    )
}
