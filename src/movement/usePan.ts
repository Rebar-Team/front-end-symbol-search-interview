import { useRef, useCallback, useEffect } from 'react'

export interface UsePanOptions {
    onPan: (deltaX: number, deltaY: number) => void
    enabled?: boolean
}

export interface UsePanReturn {
    isPanning: boolean
    panHandlers: {
        onMouseDown: (e: React.MouseEvent) => void
    }
}

export function usePan({ onPan, enabled = true }: UsePanOptions): UsePanReturn {
    const isPanningRef = useRef(false)
    const lastPositionRef = useRef({ x: 0, y: 0 })
    const isPanningStateRef = useRef(false)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!enabled) return
        if (e.button !== 0) return
        
        e.preventDefault()
        isPanningRef.current = true
        isPanningStateRef.current = true
        lastPositionRef.current = { x: e.clientX, y: e.clientY }
        
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
    }, [enabled])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return
            
            const deltaX = e.clientX - lastPositionRef.current.x
            const deltaY = e.clientY - lastPositionRef.current.y
            
            lastPositionRef.current = { x: e.clientX, y: e.clientY }
            
            onPan(deltaX, deltaY)
        }

        const handleMouseUp = () => {
            if (isPanningRef.current) {
                isPanningRef.current = false
                isPanningStateRef.current = false
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [onPan])

    return {
        isPanning: isPanningStateRef.current,
        panHandlers: {
            onMouseDown: handleMouseDown,
        },
    }
}
