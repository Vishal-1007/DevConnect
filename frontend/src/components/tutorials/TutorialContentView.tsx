export function TutorialContentView({ html }: { html: string }) {
  return (
    <article
      className="tutorial-content prose prose-invert max-w-none
        prose-headings:text-white prose-p:text-[#c8c9d8] prose-li:text-[#c8c9d8]
        prose-a:text-violet-300 prose-strong:text-white
        prose-blockquote:border-l-violet-500 prose-blockquote:bg-violet-500/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-code:text-emerald-300 prose-pre:bg-[#0f1018] prose-pre:border prose-pre:border-[#2d2e3e]
        prose-table:border-collapse prose-th:border prose-th:border-[#2d2e3e] prose-th:bg-[#161722] prose-th:p-2
        prose-td:border prose-td:border-[#2d2e3e] prose-td:p-2"
      dangerouslySetInnerHTML={{ __html: html || '<p>No content yet.</p>' }}
    />
  )
}
