import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { getSnippetUrl, type Detection } from './helpers'
import type { SearchResults } from './SymbolSearch'

const CARD_HEIGHT = 72
const CARD_GAP = 6
const COLUMNS = 2
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP
const OVERSCAN = 3

export type DetectionStatus = 'pending' | 'confirmed' | 'rejected'

interface ResultFeedProps {
    results: SearchResults
    onSelectDetection: (detection: Detection) => void
    statuses: Map<number, DetectionStatus>
    onConfirm: (detection: Detection) => void
    onReject: (detection: Detection) => void
    activeIndex: number
    onActiveIndexChange: (index: number) => void
}

export function ResultFeed({
    results, onSelectDetection,
    statuses, onConfirm, onReject,
    activeIndex, onActiveIndexChange,
}: ResultFeedProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    const tool = results.metadata.tool

    // Filter out rejected detections
    const detections = useMemo(
        () => results.detections.filter(d => statuses.get(d.markup_id) !== 'rejected'),
        [results.detections, statuses]
    )
    const activeDetection = detections[activeIndex] ?? null

    const rowCount = Math.ceil(detections.length / COLUMNS)
    const totalHeight = rowCount * ROW_HEIGHT

    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            setScrollTop(scrollRef.current.scrollTop)
        }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            setContainerHeight(scrollRef.current.clientHeight)
        }
    }, [results])

    const handleSelect = (index: number) => {
        onActiveIndexChange(index)
        const det = detections[index]
        if (det) onSelectDetection(det)
    }

    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const endRow = Math.min(rowCount, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN)

    // Only render visible cards
    const visibleDetections = useMemo(() => {
        const visible: { detection: Detection; index: number; row: number; col: number }[] = []
        for (let row = startRow; row < endRow; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                const idx = row * COLUMNS + col
                if (idx < detections.length) {
                    visible.push({ detection: detections[idx], index: idx, row, col })
                }
            }
        }
        return visible
    }, [startRow, endRow, detections])

    const confirmedCount = detections.filter(d => statuses.get(d.markup_id) === 'confirmed').length
    const pendingCount = detections.length - confirmedCount

    return (
        <div style={{
            width: 320,
            height: '100%',
            backgroundColor: '#0f172a',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
        }}>
            {/* Header with tool metadata */}
            <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    borderRadius: 8,
                    border: `1px solid ${tool.color}44`,
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: tool.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        {tool.name}
                    </div>
                    <div>
                        <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{tool.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{tool.category}</div>
                    </div>
                </div>
            </div>

            {/* Active detection preview with confirm/reject */}
            {activeDetection && (
                <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: 8,
                        border: `2px solid ${statusBorderColor(statuses.get(activeDetection.markup_id))}`,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <img
                            src={getSnippetUrl(activeDetection)}
                            alt="Active detection"
                            style={{
                                width: '100%',
                                maxHeight: 120,
                                objectFit: 'contain',
                                borderRadius: 4,
                                backgroundColor: '#fff',
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            alignItems: 'center',
                        }}>
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>
                                Page {activeDetection.page}
                            </span>
                            <ConfBadge conf={activeDetection.conf} />
                            <span style={{ color: '#64748b', fontSize: 11 }}>
                                {activeIndex + 1} / {detections.length}
                            </span>
                        </div>

                        {/* Per-card Confirm / Reject */}
                        {statuses.get(activeDetection.markup_id) !== 'confirmed' ? (
                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                <button
                                    onClick={() => onConfirm(activeDetection)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 0',
                                        backgroundColor: '#22c55e',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                    }}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => onReject(activeDetection)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 0',
                                        backgroundColor: '#dc2626',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#22c55e',
                                fontSize: 13,
                                fontWeight: 600,
                            }}>
                                <span>&#10003;</span> Confirmed
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detection counts */}
            <div style={{
                padding: '0 16px 8px',
                color: '#64748b',
                fontSize: 12,
                flexShrink: 0,
                display: 'flex',
                gap: 12,
            }}>
                <span>{detections.length} results</span>
                {confirmedCount > 0 && <span style={{ color: '#22c55e' }}>{confirmedCount} placed</span>}
                {pendingCount > 0 && <span>{pendingCount} pending</span>}
            </div>

            {/* Virtualized detection grid */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 16px 16px',
                }}
            >
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {visibleDetections.map(({ detection, index, row, col }) => {
                        const isActive = index === activeIndex
                        const status = statuses.get(detection.markup_id) ?? 'pending'
                        const isConfirmed = status === 'confirmed'
                        const cardWidth = `calc((100% - ${CARD_GAP}px) / ${COLUMNS})`
                        return (
                            <div
                                key={detection.markup_id}
                                onClick={() => handleSelect(index)}
                                style={{
                                    position: 'absolute',
                                    top: row * ROW_HEIGHT,
                                    left: col === 0 ? 0 : `calc(50% + ${CARD_GAP / 2}px)`,
                                    width: cardWidth,
                                    height: CARD_HEIGHT,
                                    backgroundColor: isConfirmed
                                        ? (isActive ? '#14392a' : '#0f2e22')
                                        : (isActive ? '#1e3a5f' : '#1e293b'),
                                    borderRadius: 6,
                                    border: isActive
                                        ? `2px solid ${isConfirmed ? '#22c55e' : '#3b82f6'}`
                                        : isConfirmed
                                            ? '2px solid #22c55e44'
                                            : '2px solid transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    padding: 4,
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s, background-color 0.15s',
                                }}
                            >
                                <div style={{ position: 'relative', width: '100%', height: 40 }}>
                                    <img
                                        src={getSnippetUrl(detection)}
                                        alt={`Detection ${index + 1}`}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: 40,
                                            objectFit: 'contain',
                                            borderRadius: 3,
                                            backgroundColor: '#fff',
                                        }}
                                    />
                                    {isConfirmed && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 1,
                                            right: 1,
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            backgroundColor: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 8,
                                            color: '#fff',
                                            fontWeight: 700,
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    alignItems: 'center',
                                    padding: '0 2px',
                                    gap: 3,
                                }}>
                                    <span style={{ color: '#64748b', fontSize: 8 }}>
                                        p.{detection.page}
                                    </span>
                                    <ConfBadge conf={detection.conf} size="sm" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function statusBorderColor(status?: DetectionStatus): string {
    if (status === 'confirmed') return '#22c55e'
    return '#3b82f6'
}

function ConfBadge({ conf, size = 'md' }: { conf: number; size?: 'sm' | 'md' }) {
    const pct = Math.round(conf * 100)
    const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'
    const isSm = size === 'sm'
    return (
        <span style={{
            backgroundColor: `${color}22`,
            color,
            fontSize: isSm ? 10 : 12,
            fontWeight: 600,
            padding: isSm ? '1px 4px' : '2px 6px',
            borderRadius: 4,
            border: `1px solid ${color}44`,
        }}>
            {pct}%
        </span>
    )
}
