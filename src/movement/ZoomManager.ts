export interface BBox {
    x: number
    y: number
    width: number
    height: number
}

export interface ZoomState {
    scale: number
    translateX: number
    translateY: number
}

export interface ZoomManagerOptions {
    minScale?: number
    maxScale?: number
    padding?: number
}

export class ZoomManager {
    private state: ZoomState = { scale: 1, translateX: 0, translateY: 0 }
    private minScale: number
    private maxScale: number
    private padding: number
    private listeners: Set<(state: ZoomState) => void> = new Set()

    constructor(options: ZoomManagerOptions = {}) {
        this.minScale = options.minScale ?? 0.1
        this.maxScale = options.maxScale ?? 10
        this.padding = options.padding ?? 20
    }

    getState(): ZoomState {
        return { ...this.state }
    }

    subscribe(listener: (state: ZoomState) => void): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    private notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    setZoom(scale: number, translateX: number, translateY: number) {
        this.state = {
            scale: Math.max(this.minScale, Math.min(this.maxScale, scale)),
            translateX,
            translateY,
        }
        this.notify()
    }

    zoomToBBox(bbox: BBox, viewportWidth: number, viewportHeight: number) {
        const availableWidth = viewportWidth - this.padding * 2
        const availableHeight = viewportHeight - this.padding * 2

        const scaleX = availableWidth / bbox.width
        const scaleY = availableHeight / bbox.height
        const scale = Math.min(scaleX, scaleY, this.maxScale)

        const bboxCenterX = bbox.x + bbox.width / 2
        const bboxCenterY = bbox.y + bbox.height / 2

        const translateX = viewportWidth / 2 - bboxCenterX * scale
        const translateY = viewportHeight / 2 - bboxCenterY * scale

        this.setZoom(scale, translateX, translateY)
    }

    zoomAtPoint(factor: number, pointX: number, pointY: number) {
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.state.scale * factor))
        
        const contentX = (pointX - this.state.translateX) / this.state.scale
        const contentY = (pointY - this.state.translateY) / this.state.scale
        
        const newTranslateX = pointX - contentX * newScale
        const newTranslateY = pointY - contentY * newScale
        
        this.state = {
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
        }
        this.notify()
    }

    zoomIn(factor: number = 1.2, pointX?: number, pointY?: number) {
        if (pointX !== undefined && pointY !== undefined) {
            this.zoomAtPoint(factor, pointX, pointY)
        } else {
            this.setZoom(
                this.state.scale * factor,
                this.state.translateX,
                this.state.translateY
            )
        }
    }

    zoomOut(factor: number = 1.2, pointX?: number, pointY?: number) {
        if (pointX !== undefined && pointY !== undefined) {
            this.zoomAtPoint(1 / factor, pointX, pointY)
        } else {
            this.setZoom(
                this.state.scale / factor,
                this.state.translateX,
                this.state.translateY
            )
        }
    }

    reset() {
        this.setZoom(1, 0, 0)
    }

    pan(deltaX: number, deltaY: number) {
        this.setZoom(
            this.state.scale,
            this.state.translateX + deltaX,
            this.state.translateY + deltaY
        )
    }

    getTransformStyle(): string {
        return `translate(${this.state.translateX}px, ${this.state.translateY}px) scale(${this.state.scale})`
    }
}

export function createZoomManager(options?: ZoomManagerOptions): ZoomManager {
    return new ZoomManager(options)
}
