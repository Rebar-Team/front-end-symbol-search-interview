import type { Detection } from '../../helpers'
import type { BBox } from '../../movement/ZoomManager'

export function getConfidenceColor(conf: number): string {
    if (conf >= 0.8) return '#22c55e'
    if (conf >= 0.5) return '#eab308'
    return '#ef4444'
}

export function detectionToBBox(detection: Detection): BBox {
    const [x1, y1, x2, y2] = detection.bbox
    return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
    }
}
