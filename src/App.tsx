import { useRef, useEffect, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { SymbolSearch, type SearchResults } from './SymbolSearch'
import { ResultFeed, type DetectionStatus } from './ResultFeed'
import { createToolSVG, type Detection } from './helpers'
import { useZoom } from './movement/useZoom'
import { usePan } from './movement/usePan'
import { ZoomControls } from './movement/ZoomControls'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function App() {
    const [numPages, setNumPages] = useState(0)
    const [page, setPage] = useState(1)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [activeDetection, setActiveDetection] = useState<Detection | null>(null)
    const [statuses, setStatuses] = useState<Map<number, DetectionStatus>>(new Map())
    const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null)
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

    // Adaptive pixel ratio based on zoom level
    const adaptivePixelRatio = zoomState.scale < 0.5 ? 1 : zoomState.scale < 2 ? 1.5 : 2

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

    // Compute the scale from PDF coords to rendered pixel coords
    const renderHeight = size.height || 0
    const pdfScale = pageDims ? renderHeight / pageDims.height : 1

    const handleSelectDetection = useCallback((detection: Detection) => {
        setActiveDetection(detection)
        setPage(detection.page)

        if (viewportRef.current) {
            const { clientWidth, clientHeight } = viewportRef.current
            const [x1, y1, x2, y2] = detection.bbox
            const bboxWidth = x2 - x1
            const bboxHeight = y2 - y1
            // Larger padding relative to bbox size for better centering
            const padX = Math.max(120, bboxWidth * 0.6)
            const padY = Math.max(120, bboxHeight * 0.6)

            zoomToBBox({
                x: (x1 - padX) * pdfScale,
                y: (y1 - padY) * pdfScale,
                width: (bboxWidth + padX * 2) * pdfScale,
                height: (bboxHeight + padY * 2) * pdfScale,
            }, clientWidth, clientHeight)
        }
    }, [pdfScale, zoomToBBox])

    const handleConfirm = useCallback((detection: Detection) => {
        setStatuses(prev => {
            const next = new Map(prev)
            next.set(detection.markup_id, 'confirmed')
            return next
        })
    }, [])

    const handleReject = useCallback((detection: Detection) => {
        setStatuses(prev => {
            const next = new Map(prev)
            next.set(detection.markup_id, 'rejected')
            return next
        })
    }, [])

    const handleConfirmWithAdvance = useCallback((detection: Detection) => {
        handleConfirm(detection)
        // Auto-advance to next pending detection
        if (searchResults) {
            const remaining = searchResults.detections.filter(d => {
                const s = statuses.get(d.markup_id) ?? 'pending'
                return s === 'pending' || d.markup_id === detection.markup_id
            })
            const currentIdx = remaining.findIndex(d => d.markup_id === detection.markup_id)
            if (currentIdx < remaining.length - 1) {
                const nextDetection = remaining[currentIdx + 1]
                setActiveIndex(activeIndex + 1)
                setActiveDetection(nextDetection)
                handleSelectDetection(nextDetection)
            }
        }
    }, [activeIndex, searchResults, statuses, handleConfirm, handleSelectDetection])

    const handleReset = useCallback(() => {
        setSearchResults(null)
        setActiveDetection(null)
        setActiveIndex(0)
        setStatuses(new Map())
    }, [])

    // Get pending detections on the current page for overlay
    const pendingOnPage = searchResults
        ? searchResults.detections.filter(d =>
            d.page === page && statuses.get(d.markup_id) !== 'confirmed' && statuses.get(d.markup_id) !== 'rejected'
        )
        : []

    // Get confirmed detections on the current page for overlay (only show symbols, no boxes)
    const confirmedOnPage = searchResults
        ? searchResults.detections.filter(d =>
            d.page === page && statuses.get(d.markup_id) === 'confirmed'
        )
        : []

    // Active detection highlight (only if on current page and not confirmed)
    const showActiveHighlight = activeDetection && activeDetection.page === page && statuses.get(activeDetection.markup_id) !== 'confirmed'

    const tool = searchResults?.metadata?.tool

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0, display: 'flex' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            {/* Left sidebar - Result Feed */}
            {searchResults && (
                <ResultFeed
                    results={searchResults}
                    onSelectDetection={handleSelectDetection}
                    statuses={statuses}
                    onConfirm={handleConfirmWithAdvance}
                    onReject={handleReject}
                    activeIndex={activeIndex}
                    onActiveIndexChange={setActiveIndex}
                />
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Bella Vista</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: page === 1 ? '#e2e8f0' : '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            cursor: page === 1 ? 'default' : 'pointer',
                            color: page === 1 ? '#cbd5e1' : '#334155',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                        }}
                    >
                        ‹
                    </button>
                    <span style={{ color: '#475569', fontSize: 13, fontWeight: 500, minWidth: 56, textAlign: 'center' }}>
                        {page} / {numPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(numPages, p + 1))}
                        disabled={page === numPages}
                        style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: page === numPages ? '#e2e8f0' : '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            cursor: page === numPages ? 'default' : 'pointer',
                            color: page === numPages ? '#cbd5e1' : '#334155',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                        }}
                    >
                        ›
                    </button>
                </div>
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
                    backgroundColor: '#e0e0e0',
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
                            devicePixelRatio={adaptivePixelRatio}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            onLoadSuccess={(pageObj) => {
                                const viewport = pageObj.getViewport({ scale: 1 })
                                setPageDims({ width: viewport.width, height: viewport.height })
                            }}
                        />
                    </Document>

                    {/* Highlight overlays */}
                    {tool && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                        }}>
                            {/* Active detection highlight box (pending only) */}
                            {showActiveHighlight && activeDetection && (
                                <DetectionOverlay
                                    detection={activeDetection}
                                    pdfScale={pdfScale}
                                    tool={tool}
                                    type="active"
                                />
                            )}

                            {/* Pending detection highlights */}
                            {pendingOnPage.filter(d => d.markup_id !== activeDetection?.markup_id).map(d => (
                                <DetectionOverlay
                                    key={d.markup_id}
                                    detection={d}
                                    pdfScale={pdfScale}
                                    tool={tool}
                                    type="pending"
                                />
                            ))}

                            {/* Confirmed detection symbols (no boxes) */}
                            {confirmedOnPage.map(d => (
                                <ConfirmedSymbol
                                    key={d.markup_id}
                                    detection={d}
                                    pdfScale={pdfScale}
                                    tool={tool}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <ZoomControls
                    scale={zoomState.scale}
                    onZoomIn={handleZoomInButton}
                    onZoomOut={handleZoomOutButton}
                    onReset={reset}
                />

                {/* Floating top-right search panel */}
                <SymbolSearch
                    onResults={(data) => {
                        setSearchResults(data)
                        setStatuses(new Map())
                        setActiveIndex(0)
                        // Jump to first detection
                        if (data.detections.length > 0) {
                            const first = data.detections[0]
                            setActiveDetection(first)
                            handleSelectDetection(first)
                        }
                    }}
                    onReset={handleReset}
                />
            </div>

            </div>
        </div>
    )
}

interface DetectionOverlayProps {
    detection: Detection
    pdfScale: number
    tool: { color: string; shape: string; name: string }
    type: 'active' | 'pending'
}

function DetectionOverlay({ detection, pdfScale, tool, type }: DetectionOverlayProps) {
    const [x1, y1, x2, y2] = detection.bbox
    const bboxWidth = x2 - x1
    const bboxHeight = y2 - y1

    // Minimal padding for display (20% on all sides)
    const expandFactor = 0.2
    const expandW = bboxWidth * expandFactor
    const expandH = bboxHeight * expandFactor

    const left = (x1 - expandW) * pdfScale
    const top = (y1 - expandH) * pdfScale
    const width = (bboxWidth + expandW * 2) * pdfScale
    const height = (bboxHeight + expandH * 2) * pdfScale

    const isActive = type === 'active'
    const borderColor = isActive ? tool.color : '#64748b'
    const bgColor = isActive ? `${tool.color}15` : '#64748b08'

    return (
        <div style={{
            position: 'absolute',
            left,
            top,
            width,
            height,
            border: `1px solid ${borderColor}`,
            backgroundColor: bgColor,
            borderRadius: 2,
            boxShadow: isActive ? `0 0 12px ${tool.color}66` : undefined,
        }} />
    )
}

interface ConfirmedSymbolProps {
    detection: Detection
    pdfScale: number
    tool: { color: string; shape: string; name: string }
}

function ConfirmedSymbol({ detection, pdfScale, tool }: ConfirmedSymbolProps) {
    const { x, y } = detection
    const left = x * pdfScale
    const top = y * pdfScale

    // Small symbol size for placed detections
    const symbolSize = 20
    const svgString = createToolSVG(tool, symbolSize)

    return (
        <div
            style={{
                position: 'absolute',
                left: left - symbolSize / 2,
                top: top - symbolSize / 2,
                width: symbolSize,
                height: symbolSize,
                opacity: 0.7,
            }}
            dangerouslySetInnerHTML={{ __html: svgString }}
        />
    )
}
