import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ZoomManager, ZoomState, BBox, ZoomManagerOptions } from './ZoomManager'

export interface UseZoomReturn {
    zoomState: ZoomState
    zoomToBBox: (bbox: BBox, viewportWidth: number, viewportHeight: number) => void
    zoomIn: (factor?: number, pointX?: number, pointY?: number) => void
    zoomOut: (factor?: number, pointX?: number, pointY?: number) => void
    zoomAtPoint: (factor: number, pointX: number, pointY: number) => void
    reset: () => void
    pan: (deltaX: number, deltaY: number) => void
    transformStyle: string
    zoomManager: ZoomManager
}

export function useZoom(options?: ZoomManagerOptions): UseZoomReturn {
    const zoomManagerRef = useRef<ZoomManager | null>(null)
    
    if (!zoomManagerRef.current) {
        zoomManagerRef.current = new ZoomManager(options)
    }
    
    const zoomManager = zoomManagerRef.current
    const [zoomState, setZoomState] = useState<ZoomState>(zoomManager.getState())

    useEffect(() => {
        return zoomManager.subscribe(setZoomState)
    }, [zoomManager])

    const zoomToBBox = useCallback((bbox: BBox, viewportWidth: number, viewportHeight: number) => {
        zoomManager.zoomToBBox(bbox, viewportWidth, viewportHeight)
    }, [zoomManager])

    const zoomIn = useCallback((factor?: number, pointX?: number, pointY?: number) => {
        zoomManager.zoomIn(factor, pointX, pointY)
    }, [zoomManager])

    const zoomOut = useCallback((factor?: number, pointX?: number, pointY?: number) => {
        zoomManager.zoomOut(factor, pointX, pointY)
    }, [zoomManager])

    const zoomAtPoint = useCallback((factor: number, pointX: number, pointY: number) => {
        zoomManager.zoomAtPoint(factor, pointX, pointY)
    }, [zoomManager])

    const reset = useCallback(() => {
        zoomManager.reset()
    }, [zoomManager])

    const pan = useCallback((deltaX: number, deltaY: number) => {
        zoomManager.pan(deltaX, deltaY)
    }, [zoomManager])

    const transformStyle = useMemo(() => {
        return `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`
    }, [zoomState])

    return {
        zoomState,
        zoomToBBox,
        zoomIn,
        zoomOut,
        zoomAtPoint,
        reset,
        pan,
        transformStyle,
        zoomManager,
    }
}
