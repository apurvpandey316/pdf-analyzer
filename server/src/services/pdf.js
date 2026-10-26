import { PDFParse } from 'pdf-parse'
import HttpError from '../utils/httpError.js'

export const MAX_FILE_MB = 10
export const MAX_PAGES = 50
// ~30k tokens. Rejecting is better than silently cutting off part of the user's notes.
const MAX_CHARS = 120_000
// Less than this usually means a scanned PDF (images, no selectable text).
const MIN_CHARS = 200

export async function extractText(buffer) {
  // The browser-reported file type can be faked, so also check the PDF signature.
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(400, 'This file is not a valid PDF')
  }

  const parser = new PDFParse({ data: buffer })
  let result
  try {
    result = await parser.getText()
  } catch {
    throw new HttpError(400, 'Could not read this PDF. It may be corrupted or password-protected.')
  } finally {
    await parser.destroy()
  }

  if (result.total > MAX_PAGES) {
    throw new HttpError(400, `PDF has ${result.total} pages. The limit is ${MAX_PAGES}.`)
  }

  // Collapse whitespace so the AI gets compact text.
  const text = result.text
    .replace(/-- \d+ of \d+ --/g, '') // page markers added by pdf-parse
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (text.length < MIN_CHARS) {
    throw new HttpError(
      400,
      'This PDF has almost no selectable text. Scanned PDFs (images of pages) are not supported yet.',
    )
  }
  if (text.length > MAX_CHARS) {
    throw new HttpError(
      400,
      'This PDF has too much text for one deck. Try splitting it into smaller parts.',
    )
  }

  return { text, pageCount: result.total }
}
