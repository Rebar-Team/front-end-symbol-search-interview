import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { SymbolSearch } from './SymbolSearch'
import { useZoom } from './movement/useZoom'
import { usePan } from './movement/usePan'
import { BBox } from './movement/ZoomManager'
import { ZoomControls } from './movement/ZoomControls'
import { PageHeader } from './PageHeader'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function App() {
    const [numPages, setNumPages] = useState(0)
    const [page, setPage] = useState(1)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [pageLoading, setPageLoading] = useState(false)
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
                    backgroundColor: '#e0e0e0',
                }}
            >
                <PageHeader
                    name="AC Hotel"
                    page={page}
                    numPages={numPages}
                    onPageChange={(p) => { setPageLoading(true); setPage(p) }}
                />
                {pageLoading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{ width: 28, height: 28, border: '3px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                )}
                    <div style={{
                        transform: transformStyle,
                        transformOrigin: '0 0',
                        transition: 'transform 0.15s ease-out',
                    }}>
                        <Document file="/Hotel.pdf" onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                            <Page 
                                pageNumber={page} 
                                height={size.height || undefined} 
                                devicePixelRatio={window.devicePixelRatio * 4}
                                renderAnnotationLayer={false} 
                                renderTextLayer={false}
                                onRenderSuccess={() => setPageLoading(false)}
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
