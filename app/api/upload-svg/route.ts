import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Authentication is now handled by middleware
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadDir = path.join(process.cwd(), 'public', 'svg-icons')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const uploadedFilenames: string[] = []

    for (const file of files) {
      if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
        continue
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = path.join(uploadDir, sanitizedName)

      // Check if file already exists and create unique name if needed
      let finalPath = filePath
      let counter = 1
      while (fs.existsSync(finalPath)) {
        const ext = path.extname(sanitizedName)
        const nameWithoutExt = path.basename(sanitizedName, ext)
        finalPath = path.join(uploadDir, `${nameWithoutExt}_${counter}${ext}`)
        counter++
      }

      fs.writeFileSync(finalPath, buffer)
      uploadedFilenames.push(path.basename(finalPath))
    }

    return NextResponse.json({ 
      filenames: uploadedFilenames,
      count: uploadedFilenames.length 
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}