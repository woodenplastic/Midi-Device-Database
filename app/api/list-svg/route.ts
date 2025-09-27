import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'svg-icons')
    
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(uploadDir)
    const svgFiles = files.filter(file => file.endsWith('.svg'))
    
    return NextResponse.json(svgFiles)
  } catch (error) {
    console.error('Error listing SVG files:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}