export interface Detection {
    x: number
    y: number
    bbox: [number, number, number, number]
    conf: number
    page: number
    markup_id: number
    symbol_search_id: string
}

/**
 * Returns the URL for a detection's image snippet.
 * Images are stored at: /symbolSearchResults/images/detection-{page}-{bbox}.png
 */
export function getSnippetUrl(detection: Detection): string {
    const { page, bbox } = detection
    return `/symbolSearchResults/images/detection-${page}-${bbox[0]}-${bbox[1]}-${bbox[2]}-${bbox[3]}.png`
}

/**
 * Creates an SVG representation of the tool based on its metadata.
 * Useful for showing what the placed symbol should look like.
 */
export function createToolSVG(tool: { color: string; shape: string; name: string }, size: number = 24): string {
    const { color, shape, name } = tool

    if (shape === 'triangle') {
        return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L22 20H2L12 2Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <text x="12" y="17" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold" stroke="#87CEEB" stroke-width="0.5">${name}</text>
</svg>`.trim()
    }

    // Default shape (rectangle)
    return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold" stroke="#87CEEB" stroke-width="0.5">${name}</text>
</svg>`.trim()
}