/** 文件类别 */
export enum FileKind {
  Image = 'image',
  Video = 'video',
  Pdf = 'pdf',
  Word = 'word',
  Excel = 'excel',
  Ppt = 'ppt',
  Markdown = 'markdown',
  Code = 'code',
  Text = 'text',
  Archive = 'archive',
  Other = 'other',
}

interface FileTypeInput {
  /** 文件名（可含后缀） */
  name?: string
  /** MIME 类型 */
  mime?: string
  /** 扩展名字段，形如 ".doc" */
  extension?: string
}

/** 从文件名或扩展名提取小写扩展名（不含点）；无扩展名返回空串 */
export function getExtension(name?: string): string {
  if (!name)
    return ''
  const idx = name.lastIndexOf('.')
  if (idx < 0)
    return ''
  return name.slice(idx + 1).toLowerCase()
}

const EXT_TO_KIND: Record<string, FileKind> = {
  // 图片
  'png': FileKind.Image,
  'jpg': FileKind.Image,
  'jpeg': FileKind.Image,
  'bmp': FileKind.Image,
  'gif': FileKind.Image,
  'svg': FileKind.Image,
  'webp': FileKind.Image,
  'tiff': FileKind.Image,
  'tif': FileKind.Image,
  'ico': FileKind.Image,
  // 视频
  'mp4': FileKind.Video,
  'webm': FileKind.Video,
  'flv': FileKind.Video,
  'avi': FileKind.Video,
  'mov': FileKind.Video,
  'wmv': FileKind.Video,
  'mkv': FileKind.Video,
  'mpeg': FileKind.Video,
  'mpg': FileKind.Video,
  '3gp': FileKind.Video,
  'm4v': FileKind.Video,
  // PDF
  'pdf': FileKind.Pdf,
  // Word
  'doc': FileKind.Word,
  'docx': FileKind.Word,
  'rtf': FileKind.Word,
  'odt': FileKind.Word,
  // Excel
  'xls': FileKind.Excel,
  'xlsx': FileKind.Excel,
  'csv': FileKind.Excel,
  'ods': FileKind.Excel,
  // PPT
  'ppt': FileKind.Ppt,
  'pptx': FileKind.Ppt,
  'odp': FileKind.Ppt,
  // Markdown
  'md': FileKind.Markdown,
  'markdown': FileKind.Markdown,
  // 代码
  'ts': FileKind.Code,
  'tsx': FileKind.Code,
  'js': FileKind.Code,
  'mjs': FileKind.Code,
  'cjs': FileKind.Code,
  'vue': FileKind.Code,
  'jsx': FileKind.Code,
  'css': FileKind.Code,
  'scss': FileKind.Code,
  'json': FileKind.Code,
  'py': FileKind.Code,
  'java': FileKind.Code,
  'go': FileKind.Code,
  'rs': FileKind.Code,
  'c': FileKind.Code,
  'cpp': FileKind.Code,
  'sh': FileKind.Code,
  'sql': FileKind.Code,
  'yaml': FileKind.Code,
  'yml': FileKind.Code,
  'toml': FileKind.Code,
  'ini': FileKind.Code,
  'log': FileKind.Code,
  // 文本
  'txt': FileKind.Text,
  // 压缩
  'zip': FileKind.Archive,
  'rar': FileKind.Archive,
  '7z': FileKind.Archive,
  'gz': FileKind.Archive,
  'tar': FileKind.Archive,
  'bz2': FileKind.Archive,
}

/** 判断文件类别：扩展名优先（extension > name），mime 兜底 */
export function getFileKind(input: FileTypeInput): FileKind {
  const ext = getExtension(input.extension) || getExtension(input.name)
  if (ext && EXT_TO_KIND[ext])
    return EXT_TO_KIND[ext]

  const mime = (input.mime ?? '').toLowerCase()
  if (mime.startsWith('image/'))
    return FileKind.Image
  if (mime.startsWith('video/'))
    return FileKind.Video
  if (mime.startsWith('application/pdf'))
    return FileKind.Pdf
  if (mime.startsWith('text/'))
    return FileKind.Text
  return FileKind.Other
}

/** 是否为可预览的文档类别（图片/视频由各端原生处理，压缩/未知不预览） */
export function isPreviewableKind(kind: FileKind): boolean {
  return ![FileKind.Image, FileKind.Video, FileKind.Other, FileKind.Archive].includes(kind)
}
