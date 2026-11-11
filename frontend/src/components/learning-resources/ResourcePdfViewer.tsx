import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Download, ExternalLink, Loader2,
  Maximize, Minimize, Search, ZoomIn, ZoomOut,
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { DocumentCallback } from 'react-pdf/dist/shared/types.js'
import { loadResourcePdfBytes } from '../../lib/resourceFile'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type ResourcePdfViewerProps = {
  resourceId: string
  title: string
  previewUrl: string | null | undefined
  accessToken: string | null
  isPdf: boolean
  onDownload?: () => void
  onOpenInNewTab?: () => void
}

const MIN_SCALE = 0.6
const MAX_SCALE = 2.5
const SCALE_STEP = 0.12

export function ResourcePdfViewer({
  resourceId,
  title,
  previewUrl,
  accessToken,
  isPdf,
  onDownload,
  onOpenInNewTab,
}: ResourcePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const pdfDocRef = useRef<DocumentCallback | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const [pdfFile, setPdfFile] = useState<string | { data: Uint8Array } | null>(null)
  const [loading, setLoading] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [fitWidth, setFitWidth] = useState(true)
  const [containerWidth, setContainerWidth] = useState(720)
  const [fullscreen, setFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchStatus, setSearchStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      if (!isPdf) {
        setLoading(false)
        return
      }

      setLoading(true)
      setRenderError(null)
      setPdfFile(null)
      setNumPages(0)
      setPageNumber(1)

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }

      try {
        const bytes = await loadResourcePdfBytes(resourceId, accessToken, previewUrl)
        if (cancelled) return

        const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        blobUrlRef.current = blobUrl
        setPdfFile(blobUrl)
        console.log('[ResourcePdfViewer] PDF bytes loaded', { resourceId, bytes: bytes.byteLength })
      } catch (err) {
        if (!cancelled) {
          console.error('[ResourcePdfViewer] fetch failed', err)
          setRenderError(err instanceof Error ? err.message : 'Could not load PDF')
          setLoading(false)
        }
      }
    }

    void loadPdf()
    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [resourceId, previewUrl, accessToken, isPdf])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width && width > 0) setContainerWidth(Math.floor(width - 48))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [pdfFile])

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const pageWidth = fitWidth ? containerWidth : Math.floor(containerWidth * scale)

  const onDocumentLoadSuccess = useCallback((pdf: DocumentCallback) => {
    setLoading(false)
    setNumPages(pdf.numPages)
    setPageNumber(1)
    pdfDocRef.current = pdf
    setRenderError(null)
    console.log('[ResourcePdfViewer] PDF rendered', { pages: pdf.numPages })
  }, [])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('[ResourcePdfViewer] react-pdf error', err)
    setLoading(false)
    setRenderError('PDF renderer failed to parse the document.')
  }, [])

  const scrollToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setPageNumber(page)
    }
  }, [])

  const goToPage = useCallback((page: number) => {
    scrollToPage(Math.min(Math.max(1, page), numPages || 1))
  }, [numPages, scrollToPage])

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await el.requestFullscreen()
  }, [])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || numPages <= 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const page = Number((visible.target as HTMLElement).dataset.page)
        if (page > 0) setPageNumber(page)
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    )

    pageRefs.current.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [numPages, pageWidth])

  async function searchDocument() {
    const query = searchQuery.trim().toLowerCase()
    if (!query || !pdfDocRef.current) {
      setSearchStatus('Enter text to search')
      return
    }
    setSearchStatus('Searching…')
    const pdf = pdfDocRef.current
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .toLowerCase()
      if (text.includes(query)) {
        scrollToPage(i)
        setSearchStatus(`Found on page ${i}`)
        return
      }
    }
    setSearchStatus('No matches found')
  }

  const pageElements = useMemo(() => {
    if (numPages <= 0) return null
    return Array.from({ length: numPages }, (_, index) => {
      const page = index + 1
      return (
        <div
          key={page}
          ref={(node) => {
            if (node) pageRefs.current.set(page, node)
            else pageRefs.current.delete(page)
          }}
          className="mb-6 flex justify-center"
          data-page={page}
        >
          <Page
            pageNumber={page}
            width={pageWidth}
            renderTextLayer
            renderAnnotationLayer
            loading={
              <div className="flex h-[480px] w-full max-w-3xl items-center justify-center rounded bg-[#ececec]">
                <Loader2 size={20} className="animate-spin text-violet-500" />
              </div>
            }
            className="shadow-lg shadow-black/40"
          />
        </div>
      )
    })
  }, [numPages, pageWidth])

  if (!isPdf) {
    return (
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-8 text-center">
        <p className="text-sm text-white font-semibold">Preview not available for this file type.</p>
      </div>
    )
  }

  if (renderError && !pdfFile) {
    return (
      <div className="bg-[#161722] border border-[#2d2e3e] rounded-xl p-8 text-center space-y-3">
        <p className="text-sm text-red-400">{renderError}</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {onOpenInNewTab && (
            <button type="button" onClick={onOpenInNewTab}
              className="inline-flex items-center gap-2 border border-[#2d2e3e] text-[#8b8ca8] hover:text-white text-xs font-bold px-4 py-2 rounded-lg">
              <ExternalLink size={14} /> Open in new tab
            </button>
          )}
          {onDownload && (
            <button type="button" onClick={onDownload}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
              <Download size={14} /> Download PDF
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`bg-[#161722] border border-[#2d2e3e] rounded-xl overflow-hidden flex flex-col ${
        fullscreen ? 'h-screen' : 'min-h-[75vh]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-[#2d2e3e] bg-[#12131c]">
        <button type="button" onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1 || loading}
          className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white disabled:opacity-40"
          title="Previous page">
          <ChevronLeft size={14} />
        </button>
        <button type="button" onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages || loading}
          className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white disabled:opacity-40"
          title="Next page">
          <ChevronRight size={14} />
        </button>
        <span className="text-[11px] text-[#8b8ca8] min-w-[88px] text-center">
          Page {pageNumber} of {numPages || '—'}
        </span>

        <div className="h-4 w-px bg-[#2d2e3e] mx-1" />

        <button type="button" onClick={() => { setFitWidth(false); setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP)) }}
          className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white" title="Zoom out">
          <ZoomOut size={14} />
        </button>
        <button type="button" onClick={() => { setFitWidth(false); setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP)) }}
          className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white" title="Zoom in">
          <ZoomIn size={14} />
        </button>
        <button type="button" onClick={() => { setFitWidth(true); setScale(1) }}
          className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border ${
            fitWidth ? 'border-violet-500/40 text-violet-300 bg-violet-500/10' : 'border-[#2d2e3e] text-[#8b8ca8]'
          }`}>
          Fit width
        </button>

        <div className="flex items-center gap-1 flex-1 min-w-[180px]">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5c5d72]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void searchDocument() }}
              placeholder="Search document…"
              className="w-full bg-[#161722] border border-[#2d2e3e] rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white placeholder-[#5c5d72] focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <button type="button" onClick={() => void searchDocument()}
            className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            Find
          </button>
        </div>

        {searchStatus && <span className="text-[10px] text-violet-300">{searchStatus}</span>}

        {onDownload && (
          <button type="button" onClick={onDownload}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30">
            <Download size={12} /> Download
          </button>
        )}
        {onOpenInNewTab && (
          <button type="button" onClick={onOpenInNewTab}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white">
            <ExternalLink size={12} /> New tab
          </button>
        )}
        <button type="button" onClick={() => void toggleFullscreen()} title="Full screen"
          className="p-1.5 rounded-lg border border-[#2d2e3e] text-[#8b8ca8] hover:text-white ml-auto">
          {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#2b2d3a] px-4 py-6 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-[#8b8ca8] z-10 pointer-events-none">
            <Loader2 size={28} className="animate-spin text-violet-400" />
            Loading document…
          </div>
        )}
        {pdfFile && (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            {pageElements}
          </Document>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-[#2d2e3e] bg-[#12131c] text-[10px] text-[#5c5d72] truncate">
        {title}
      </div>
    </div>
  )
}
