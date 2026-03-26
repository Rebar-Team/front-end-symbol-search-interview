import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { SymbolSearch, getConfidenceColor, detectionToBBox, DroppedIcon } from './SymbolSearch'
import { createToolSVG } from './helpers'
import { useZoom } from './movement/useZoom'
import { usePan } from './movement/usePan'
import { BBox } from './movement/ZoomManager'
import { ZoomControls } from './movement/ZoomControls'
import { Detection } from './helpers'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function App() {
    const [numPages, setNumPages] = useState(0)
    const [page, setPage] = useState(1)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [pdfOriginalSize, setPdfOriginalSize] = useState({ width: 0, height: 0 })
    const [activeDetection, setActiveDetection] = useState<Detection | null>(null)
    const [droppedIcons, setDroppedIcons] = useState<DroppedIcon[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const pendingZoomRef = useRef<{ bbox: BBox; page: number } | null>(null)

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

    const executeZoom = useCallback((bbox: BBox, originalHeight: number) => {
        if (!viewportRef.current || originalHeight <= 0) return
        
        const { clientWidth, clientHeight } = viewportRef.current
        const scale = size.height / originalHeight
        const padding = 30
        const scaledBBox = {
            x: bbox.x * scale - padding,
            y: bbox.y * scale - padding,
            width: bbox.width * scale + padding * 2,
            height: bbox.height * scale + padding * 2,
        }
        
        zoomToBBox(scaledBBox, clientWidth, clientHeight)
    }, [zoomToBBox, size.height])

    const handleZoomToDetection = useCallback((bbox: BBox, detectionPage: number) => {
        if (detectionPage !== page) {
            pendingZoomRef.current = { bbox, page: detectionPage }
            setPage(detectionPage)
        } else {
            executeZoom(bbox, pdfOriginalSize.height)
        }
    }, [page, pdfOriginalSize.height, executeZoom])

    const handlePageLoadSuccess = useCallback((pageData: { originalWidth: number; originalHeight: number }) => {
        setPdfOriginalSize({
            width: pageData.originalWidth,
            height: pageData.originalHeight,
        })
        
        if (pendingZoomRef.current) {
            const { bbox } = pendingZoomRef.current
            pendingZoomRef.current = null
            requestAnimationFrame(() => {
                executeZoom(bbox, pageData.originalHeight)
            })
        }
    }, [executeZoom])

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
                    position: 'relative',
                }}>
                    <Document file="/Hotel.pdf" onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div style={{ width: 24, height: 24, border: '3px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}>
                        <Page 
                            pageNumber={page} 
                            height={size.height || undefined} 
                            devicePixelRatio={window.devicePixelRatio * 4}
                            renderAnnotationLayer={false} 
                            renderTextLayer={false}
                            onLoadSuccess={handlePageLoadSuccess}
                        />
                    </Document>
                    
                    {activeDetection && activeDetection.page === page && pdfOriginalSize.height > 0 && (() => {
                        const bbox = detectionToBBox(activeDetection)
                        const confidenceColor = getConfidenceColor(activeDetection.conf)
                        const scale = size.height / pdfOriginalSize.height
                        return (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: bbox.x * scale - 4,
                                    top: bbox.y * scale - 4,
                                    width: bbox.width * scale + 8,
                                    height: bbox.height * scale + 8,
                                    border: `1px solid ${confidenceColor}`,
                                    pointerEvents: 'none',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: -24,
                                        left: 0,
                                        backgroundColor: confidenceColor,
                                        color: '#fff',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        borderRadius: 3,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {(activeDetection.conf * 100).toFixed(1)}%
                                </div>
                            </div>
                        )
                    })()}
                    
                    {/* Render dropped icons for current page */}
                    {pdfOriginalSize.height > 0 && droppedIcons
                        .filter(icon => icon.detection.page === page)
                        .map(icon => {
                            const bbox = detectionToBBox(icon.detection)
                            const scale = size.height / pdfOriginalSize.height
                            const iconSize = 16
                            return (
                                <div
                                    key={icon.detection.markup_id}
                                    style={{
                                        position: 'absolute',
                                        left: bbox.x * scale + (bbox.width * scale - iconSize) / 2,
                                        top: bbox.y * scale + (bbox.height * scale - iconSize) / 2,
                                        width: iconSize,
                                        height: iconSize,
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: createToolSVG(icon.tool, iconSize)
                                    }}
                                />
                            )
                        })
                    }
                </div>
                
                <ZoomControls 
                    scale={zoomState.scale}
                    onZoomIn={handleZoomInButton}
                    onZoomOut={handleZoomOutButton}
                    onReset={reset}
                />
            </div>

            <SymbolSearch 
                onZoomToDetection={handleZoomToDetection}
                onActiveDetectionChange={setActiveDetection}
                onDropIcon={(droppedIcon) => {
                    setDroppedIcons(prev => [...prev, droppedIcon])
                    console.log('Dropped icons:', [...droppedIcons, droppedIcon])
                }}
            />
        </div>
    )
}
