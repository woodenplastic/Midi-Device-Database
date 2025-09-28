import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { assert } from 'console'

const DATABASE_FILE = path.join(process.cwd(), 'midi-database-v1.json')

export async function GET() {
  try {
    if (!fs.existsSync(DATABASE_FILE)) {
      assert(false, 'Database file does not exist')
      return NextResponse.json({ error: 'Database file does not exist' }, { status: 404 })
    }

    const data = fs.readFileSync(DATABASE_FILE, 'utf8')
    const database = JSON.parse(data)
    return NextResponse.json(database)
  } catch (error) {
    console.error('Error loading database:', error)
    return NextResponse.json(
      { error: 'Failed to load database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const database = await request.json()
    
    // Backup current database
    if (fs.existsSync(DATABASE_FILE)) {
      const backupFile = `${DATABASE_FILE}.backup.${Date.now()}`
      fs.copyFileSync(DATABASE_FILE, backupFile)
    }

    // Save new database
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2))
    
    // Update version file
    const versionFile = path.join(process.cwd(), 'midi-database-version.json')
    const versionData = {
      version: 1,
      generatedAt: new Date().toISOString(),
      sourceFile: 'midi-database-v1.json',
      fileSizes: {
        original: fs.statSync(DATABASE_FILE).size
      }
    }
    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving database:', error)
    return NextResponse.json(
      { error: 'Failed to save database' },
      { status: 500 }
    )
  }
}