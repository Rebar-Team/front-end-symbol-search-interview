import { createToolSVG } from '../../helpers'
import type { ToolMetadata } from './types'

interface ToolInfoProps {
    tool: ToolMetadata
    filteredCount: number
    totalCount: number
    hasFilter: boolean
}

export function ToolInfo({ tool, filteredCount, totalCount, hasFilter }: ToolInfoProps) {
    return (
        <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        }}>
            <div 
                dangerouslySetInnerHTML={{ 
                    __html: createToolSVG(tool, 32) 
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ 
                    color: '#f8fafc', 
                    fontWeight: 600, 
                    fontSize: 13,
                }}>
                    {tool.name}
                </div>
                <div style={{ 
                    color: '#94a3b8', 
                    fontSize: 11,
                }}>
                    {tool.category}
                </div>
            </div>
            <div style={{
                color: '#94a3b8',
                fontSize: 12,
                flexShrink: 0,
            }}>
                {filteredCount}{hasFilter ? `/${totalCount}` : ''} results
            </div>
        </div>
    )
}
