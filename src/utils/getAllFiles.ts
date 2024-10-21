import * as fs from 'fs'
import * as path from 'path'

export const getAllFiles = (dir: string | string[], foldersOnly = false) => {
  let files: string[] = []

  const processDirectory = (directory: string) => {
    const dirents = fs.readdirSync(directory, { withFileTypes: true })

    for (const dirent of dirents) {
      const filePath = path.join(directory, dirent.name)

      if (foldersOnly) {
        if (dirent.isDirectory()) {
          files.push(filePath)
        }
      } else {
        files.push(filePath)
      }
    }
  }

  if (Array.isArray(dir)) {
    dir.forEach((d) => processDirectory(d))
  } else {
    processDirectory(dir)
  }

  return files
}
