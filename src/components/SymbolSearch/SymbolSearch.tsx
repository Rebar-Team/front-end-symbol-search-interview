import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { getAvailablePages, type Detection } from '../../helpers'
import type { SymbolSearchProps, SearchResults, DroppedIcon } from './types'
import { detectionToBBox } from './utils'
import { SearchHeader } from './SearchHeader'
import { ToolInfo } from './ToolInfo'
import { PageFilter } from './PageFilter'
import { DetectionList } from './DetectionList'
import { EmptyFilterState } from './EmptyFilterState'

const THROTTLE_MS = 100

export function SymbolSearch({ onZoomToDetection, onActiveDetectionChange, onDropIcon }: SymbolSearchProps) {
    const [results, setResults] = useState<SearchResults | null>(null)
    const [detections, setDetections] = useState<Detection[]>([])
    const [activeId, setActiveId] = useState<number | null>(null)
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
    const [filterOpen, setFilterOpen] = useState(false)
    const lastKeyTime = useRef<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)
    
    const tool = results?.metadata?.tool || null
    
    const availablePages = useMemo(() => getAvailablePages(detections), [detections])
    
    const filteredDetections = useMemo(() => {
        if (selectedPages.size === 0) return detections
        return detections.filter(d => selectedPages.has(d.page))
    }, [detections, selectedPages])
    
    const activeDetection = filteredDetections.find(d => d.markup_id === activeId) || null
    
    useEffect(() => {
        onActiveDetectionChange?.(activeDetection)
    }, [activeDetection, onActiveDetectionChange])
    
    const refreshPageFilter = useCallback((newDetections: Detection[]) => {
        const newAvailablePages = new Set(newDetections.map(d => d.page))
        setSelectedPages(prev => {
            const updated = new Set<number>()
            prev.forEach(page => {
                if (newAvailablePages.has(page)) {
                    updated.add(page)
                }
            })
            return updated
        })
    }, [])
    
    const togglePage = useCallback((page: number) => {
        setSelectedPages(prev => {
            const updated = new Set(prev)
            if (updated.has(page)) {
                updated.delete(page)
            } else {
                updated.add(page)
            }
            return updated
        })
    }, [])
    
    const selectAllPages = useCallback(() => {
        setSelectedPages(new Set(availablePages))
    }, [availablePages])
    
    const clearAllPages = useCallback(() => {
        setSelectedPages(new Set())
    }, [])

    const handleSearch = async () => {
        const response = await fetch('/symbolSearchResults/results.json')
        const data: SearchResults = await response.json()
        const sorted = [...data.detections].sort((a, b) => b.conf - a.conf)
        setDetections(sorted)
        setResults(data)
        setActiveId(null)
        setSelectedPages(new Set())
        setFilterOpen(false)
    }

    const handleReset = () => {
        setResults(null)
        setDetections([])
        setActiveId(null)
        setSelectedPages(new Set())
        setFilterOpen(false)
    }

    const handleReject = useCallback((markupId: number) => {
        setDetections(prev => {
            const newDetections = prev.filter(d => d.markup_id !== markupId)
            refreshPageFilter(newDetections)
            return newDetections
        })
        if (activeId === markupId) {
            setActiveId(null)
        }
    }, [activeId, refreshPageFilter])

    const handleAccept = useCallback((detection: Detection) => {
        if (!tool) return
        
        const droppedIcon: DroppedIcon = {
            detection,
            tool: { ...tool },
        }
        onDropIcon?.(droppedIcon)
        
        setDetections(prev => {
            const newDetections = prev.filter(d => d.markup_id !== detection.markup_id)
            refreshPageFilter(newDetections)
            return newDetections
        })
        if (activeId === detection.markup_id) {
            setActiveId(null)
        }
    }, [tool, activeId, onDropIcon, refreshPageFilter])

    const handleSelect = useCallback((detection: Detection) => {
        setActiveId(detection.markup_id)
        if (onZoomToDetection) {
            const bbox = detectionToBBox(detection)
            onZoomToDetection(bbox, detection.page)
        }
    }, [onZoomToDetection])

    const selectNextDetection = useCallback((currentDetections: Detection[], removedId: number) => {
        const removedIndex = currentDetections.findIndex(d => d.markup_id === removedId)
        const remaining = currentDetections.filter(d => d.markup_id !== removedId)
        
        if (remaining.length === 0) {
            setActiveId(null)
            return
        }
        
        const nextIndex = Math.min(removedIndex, remaining.length - 1)
        const nextDetection = remaining[nextIndex]
        setActiveId(nextDetection.markup_id)
        
        if (onZoomToDetection) {
            const bbox = detectionToBBox(nextDetection)
            onZoomToDetection(bbox, nextDetection.page)
        }
    }, [onZoomToDetection])

    const handleRejectWithNext = useCallback((markupId: number) => {
        const detectionsSnapshot = filteredDetections
        setDetections(prev => {
            const newDetections = prev.filter(d => d.markup_id !== markupId)
            refreshPageFilter(newDetections)
            return newDetections
        })
        selectNextDetection(detectionsSnapshot, markupId)
    }, [filteredDetections, refreshPageFilter, selectNextDetection])

    const handleAcceptWithNext = useCallback((detection: Detection) => {
        if (!tool) return
        
        const droppedIcon: DroppedIcon = {
            detection,
            tool: { ...tool },
        }
        onDropIcon?.(droppedIcon)
        
        const detectionsSnapshot = filteredDetections
        setDetections(prev => {
            const newDetections = prev.filter(d => d.markup_id !== detection.markup_id)
            refreshPageFilter(newDetections)
            return newDetections
        })
        selectNextDetection(detectionsSnapshot, detection.markup_id)
    }, [tool, filteredDetections, onDropIcon, refreshPageFilter, selectNextDetection])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredDetections.length === 0) return
            
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            const now = Date.now()
            if (now - lastKeyTime.current < THROTTLE_MS) return

            const currentIndex = activeId !== null 
                ? filteredDetections.findIndex(d => d.markup_id === activeId)
                : -1

            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight': {
                    e.preventDefault()
                    lastKeyTime.current = now
                    const nextIndex = currentIndex < filteredDetections.length - 1 ? currentIndex + 1 : 0
                    const nextDetection = filteredDetections[nextIndex]
                    handleSelect(nextDetection)
                    break
                }
                case 'ArrowUp':
                case 'ArrowLeft': {
                    e.preventDefault()
                    lastKeyTime.current = now
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredDetections.length - 1
                    const prevDetection = filteredDetections[prevIndex]
                    handleSelect(prevDetection)
                    break
                }
                case 'Enter':
                case ' ': {
                    e.preventDefault()
                    lastKeyTime.current = now
                    if (activeId !== null) {
                        const activeDetection = filteredDetections.find(d => d.markup_id === activeId)
                        if (activeDetection) {
                            handleAcceptWithNext(activeDetection)
                        }
                    }
                    break
                }
                case 'Backspace':
                case 'Delete':
                case 'Escape': {
                    e.preventDefault()
                    lastKeyTime.current = now
                    if (activeId !== null) {
                        handleRejectWithNext(activeId)
                    }
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [filteredDetections, activeId, handleSelect, handleAcceptWithNext, handleRejectWithNext])

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            style={{
                width: 300,
                height: '100%',
                backgroundColor: '#0f172a',
                borderLeft: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
                outline: 'none',
            }}>
            <div style={{
                padding: 16,
                borderBottom: '1px solid #334155',
                flexShrink: 0,
            }}>
                <SearchHeader onSearch={handleSearch} onReset={handleReset} />

                {results && tool && (
                    <ToolInfo
                        tool={tool}
                        filteredCount={filteredDetections.length}
                        totalCount={detections.length}
                        hasFilter={selectedPages.size > 0}
                    />
                )}
                
                {results && (
                    <PageFilter
                        availablePages={availablePages}
                        selectedPages={selectedPages}
                        detections={detections}
                        isOpen={filterOpen}
                        onToggleOpen={() => setFilterOpen(!filterOpen)}
                        onTogglePage={togglePage}
                        onSelectAll={selectAllPages}
                        onClearAll={clearAllPages}
                    />
                )}
            </div>

            <DetectionList
                detections={filteredDetections}
                activeId={activeId}
                onSelect={handleSelect}
                onAccept={handleAccept}
                onReject={handleReject}
            />
            
            {results && filteredDetections.length === 0 && detections.length > 0 && (
                <EmptyFilterState onClearFilter={clearAllPages} />
            )}
        </div>
    )
}
