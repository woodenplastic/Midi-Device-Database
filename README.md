# MIDI Device Database Editor

A Next.js React application for editing MIDI device parameters and managing SVG icon uploads.

## Features

- **Device Parameter Editor**: Edit `icon_number` fields for CC, NRPN, and PC parameters
- **SVG File Upload**: Upload SVG files to the public folder with drag-and-drop support
- **Search & Filter**: Find specific parameters by name
- **Real-time Save**: Changes are saved immediately to the database
- **File Management**: View and manage uploaded SVG files

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Editing Parameters

1. Select a **Brand** from the dropdown (e.g., Roland, Moog)
2. Select a **Device** from the second dropdown (e.g., JU-06A, Minitaur)  
3. Use the search box to filter parameters by name
4. Edit the **Icon Number** field for any CC, NRPN, or PC parameter
5. Changes are automatically saved to the database

### Uploading SVG Files

1. Use the upload area on the right side of the screen
2. **Drag and drop** SVG files or **click "Choose Files"**
3. Only SVG files are accepted
4. Files are saved to `/public/svg-icons/`
5. View uploaded files in the list below

## Database Structure

The MIDI database follows this JSON format:

```json
{
  "brand": {
    "device": {
      "midi_thru": true|false,
      "midi_in": "TRS|DIN|USB|...",
      "midi_clock": true|false,
      "phantom_power": "None|Required|Optional|...",
      "midi_channel": {
        "instructions": "Step by step instructions..."
      },
      "instructions": "General device instructions",
      "cc": [
        {
          "name": "Parameter Name",
          "description": "Detailed description",
          "usage": "Further Details",
          "curve": "Toggle|0-based|1-based|Centered",
          "value": 0,
          "min": 0,
          "max": 127,
          "type": "Parameter|System|Scene",
          "icon_number": null
        }
      ],
      "nrpn": [...],
      "pc": [...]
    }
  }
}
```

## API Endpoints

- `GET /api/database` - Load the MIDI database
- `POST /api/database` - Save the MIDI database  
- `POST /api/upload-svg` - Upload SVG files
- `GET /api/list-svg` - List uploaded SVG files
- `GET /api/download-svg/[filename]` - View/download SVG files

## File Structure

```
├── app/
│   ├── api/                  # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── DeviceEditor.tsx     # Parameter editing component
│   └── SvgUploader.tsx      # File upload component
├── types/
│   └── midi.ts              # TypeScript interfaces
├── public/
│   └── svg-icons/           # Uploaded SVG files
└── midi-database-v1.json    # Main database file
```

## Development

- Built with **Next.js 14** and **TypeScript**
- Uses App Router for routing
- File-based API routes
- Responsive design with inline styles
- Real-time updates and auto-save functionality

## Backup

The application automatically creates backup files when saving:
- Database backups: `midi-database-v1.json.backup.[timestamp]`
- Version tracking in `midi-database-version.json`