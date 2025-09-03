/**
 * Utilities for extracting files from dataTransfer in a predictable cross-browser fashion.
 * Also recursively extracts files from a directory
 * Inspired by https://github.com/component/normalized-upload
 */

export function extractDroppedFiles(dataTransfer: DataTransfer) {
  const files = Array.from(dataTransfer.files || [])
  const items = Array.from(dataTransfer.items || [])
  if (files && files.length > 0) {
    return Promise.resolve(files)
  }
  return normalizeItems(items).then((arr) => arr.flat())
}

function normalizeItems(items: DataTransferItem[]) {
  return Promise.all(
    items.map((item) => {
      // directory
      if (item.kind === 'file' && item.webkitGetAsEntry) {
        let entry: FileSystemEntry | File[] | null
        // Edge throws
        try {
          entry = item.webkitGetAsEntry()
        } catch (err) {
          const file = item.getAsFile()
          return file ? [file] : []
        }
        if (!entry) {
          return []
        }
        return entry.isDirectory
          ? walk(entry)
          : (() => {
              const file = item.getAsFile()
              return file ? [file] : []
            })()
      }

      // file
      if (item.kind === 'file') {
        const file = item.getAsFile()
        return Promise.resolve(file ? [file] : [])
      }

      // others
      return new Promise((resolve) => item.getAsString(resolve)).then((str: unknown) => {
        const stringValue = str as string | undefined
        return stringValue ? [new File([stringValue], 'unknown.txt', {type: item.type})] : []
      })
    })
  )
}

function isFile(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile
}
function isDirectory(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry.isDirectory
}

function walk(entry: FileSystemEntry): Promise<File[]> {
  if (isFile(entry)) {
    return new Promise<File>((resolve) => entry.file(resolve)).then((file) => [file])
  }

  if (isDirectory(entry)) {
    const dir = entry.createReader()
    return new Promise<FileSystemEntry[]>((resolve) => dir.readEntries(resolve))
      .then((entries: FileSystemEntry[]) => entries.filter((entr) => !entr.name.startsWith('.')))
      .then((entries) => Promise.all(entries.map(walk)).then((arr) => arr.flat()))
  }
  return Promise.resolve([])
}
