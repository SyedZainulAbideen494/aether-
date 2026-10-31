import jsPDF from 'jspdf'

export function generateExplainPdf(exp: any, filename?: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 50
  const pageWidth = doc.internal.pageSize.getWidth()
  const usable = pageWidth - margin * 2
  let y = margin

  const addText = (text: string, size = 11, bold = false, italic = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : italic ? 'italic' : 'normal')
    const lines = doc.splitTextToSize(text, usable)
    for (const line of lines) {
      if (y + size + 4 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage(); y = margin
      }
      doc.text(line, margin, y)
      y += size + 4
    }
  }
  const heading = (text: string) => {
    y += 8
    addText(text, 14, true)
    y += 2
  }

  addText('AETHER — AVIATION LEARNING', 16, true)
  addText(`Concept: ${exp.title}`, 13, true)
  addText(`Subject: Performance Air Navigation`, 10, false, true)
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10, false, true)
  y += 6

  if (exp.definition) { heading('Simple Definition'); addText(exp.definition) }

  for (const s of (exp.sections || [])) {
    heading(s.heading)
    // strip markdown-ish
    addText(s.content.replace(/\*\*/g, '').replace(/\*/g, ''))
  }
  if (exp.importantPoints?.length) { heading('Important Points'); exp.importantPoints.forEach((p: string) => addText('• ' + p)) }
  if (exp.commonMisconceptions?.length) { heading('Common Misconceptions'); exp.commonMisconceptions.forEach((p: string) => addText('• ' + p)) }
  if (exp.memoryTrick) { heading('Memory Trick'); addText(exp.memoryTrick) }
  if (exp.knowledgeCheck) {
    heading('Quick Knowledge Check')
    addText(exp.knowledgeCheck.question)
    exp.knowledgeCheck.options?.forEach((o: string, i: number) => addText(`${String.fromCharCode(65 + i)}. ${o}`))
    addText(`Answer: ${exp.knowledgeCheck.correctAnswer}`, 11, true)
    if (exp.knowledgeCheck.explanation) addText(exp.knowledgeCheck.explanation)
  }

  // footer page numbers
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.text(`AETHER | Performance Air Nav — Page ${i} of ${pages}`, margin, doc.internal.pageSize.getHeight() - 20)
  }

  const name = filename || `AETHER_${(exp.title || 'Explanation').replace(/\s+/g, '_')}_Notes.pdf`
  doc.save(name)
  return name
}
