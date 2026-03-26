import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { SymbolSearch } from './SymbolSearch'
import { useZoom } from './movement/useZoom'
import { usePan } from './movement/usePan'
import { BBox } from './movement/ZoomManager'
import { ZoomControls } from './movement/ZoomControls'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function App() {
    const [numPages, setNumPages] = useState(0)
    const [page, setPage] = useState(1)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)

    const { zoomState, zoomToBBox, zoomIn, zoomOut, reset, transformStyle, pan } = useZoom({
        minScale: 0.1,
        maxScale: 5,
        padding: 40,
    })

    const { panHandlers } = usePan({
        onPan: pan,
    })

    const handleZoom = useCallback((bbox: BBox) => {
        if (viewportRef.current) {
            const { clientWidth, clientHeight } = viewportRef.current
            zoomToBBox(bbox, clientWidth, clientHeight)
        }
    }, [zoomToBBox])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        
        if (!viewportRef.current) return
        
        const rect = viewportRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        const delta = e.deltaY
        const factor = 1.1
        
        if (delta < 0) {
            zoomIn(factor, mouseX, mouseY)
        } else {
            zoomOut(factor, mouseX, mouseY)
        }
    }, [zoomIn, zoomOut])
    
    const handleZoomInButton = useCallback(() => {
        if (!viewportRef.current) return
        const centerX = viewportRef.current.clientWidth / 2
        const centerY = viewportRef.current.clientHeight / 2
        zoomIn(1.2, centerX, centerY)
    }, [zoomIn])
    
    const handleZoomOutButton = useCallback(() => {
        if (!viewportRef.current) return
        const centerX = viewportRef.current.clientWidth / 2
        const centerY = viewportRef.current.clientHeight / 2
        zoomOut(1.2, centerX, centerY)
    }, [zoomOut])

    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight - 40
                })
            }
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, display: 'flex' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
                <span>Bella Vista: </span>
                <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <span>Page {page} / {numPages} </span>
                <button onClick={() => setPage(p => Math.min(numPages, p + 1))}>Next</button>
            </div>

            <div 
                ref={viewportRef}
                onWheel={handleWheel}
                {...panHandlers}
                style={{ 
                    position: 'relative', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    flex: 1,
                    overflow: 'hidden',
                    cursor: 'grab',
                }}
            >
                <div style={{
                    transform: transformStyle,
                    transformOrigin: '0 0',
                    transition: 'transform 0.15s ease-out',
                }}>
                    <Document file="/Hotel.pdf" onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div style={{ width: 24, height: 24, border: '3px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}>
                        <Page 
                            pageNumber={page} 
                            height={size.height || undefined} 
                            devicePixelRatio={window.devicePixelRatio * 4}
                            renderAnnotationLayer={false} 
                            renderTextLayer={false} 
                        />
                    </Document>
                </div>
                
                <ZoomControls 
                    scale={zoomState.scale}
                    onZoomIn={handleZoomInButton}
                    onZoomOut={handleZoomOutButton}
                    onReset={reset}
                />
            </div>

            <SymbolSearch />
        </div>
    )
}
