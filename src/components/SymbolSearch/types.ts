import type { Detection } from '../../helpers'
import type { BBox } from '../../movement/ZoomManager'

export interface ToolMetadata {
    id: string
    category: string
    color: string
    shape: string
    name: string
}

export interface SearchResults {
    action: string
    detections: Detection[]
    metadata: {
        tool: ToolMetadata
    }
}

export interface DroppedIcon {
    detection: Detection
    tool: ToolMetadata
}

export interface SymbolSearchProps {
    onZoomToDetection?: (bbox: BBox, page: number) => void
    onActiveDetectionChange?: (detection: Detection | null) => void
    onDropIcon?: (droppedIcon: DroppedIcon) => void
}
