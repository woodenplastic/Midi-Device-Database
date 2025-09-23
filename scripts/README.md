# MIDI Database Update Scripts

This directory contains scripts to check for and download updates to the MIDI database from the upstream repository.

## Files

- **`check-midi-updates.ps1`** - PowerShell script for Windows
- **`check-midi-updates.sh`** - Bash script for Linux/macOS

## Usage

### PowerShell (Windows)

```powershell
# Interactive mode - prompts for confirmation
.\scripts\check-midi-updates.ps1

# Automatic mode - downloads without prompts
.\scripts\check-midi-updates.ps1 -AutoDownload
```

### Bash (Linux/macOS)

```bash
# Make script executable (first time only)
chmod +x scripts/check-midi-updates.sh

# Run the script
./scripts/check-midi-updates.sh
```

## What the scripts do

1. **Check local files**: Scans for existing `midi-database-v*.json` files in the current directory
2. **Check remote repository**: Queries the GitHub API to find available versions in the upstream repository
3. **Compare versions**: Determines if a newer version is available
4. **Download updates**: If a newer version exists, offers to download it
5. **Validation**: Ensures downloaded files are valid JSON
6. **Cleanup**: Optionally removes old version files

## GitHub Action

The repository also includes a GitHub Action (`.github/workflows/check-midi-database-updates.yml`) that:

- Runs automatically every day at 9 AM UTC
- Can be triggered manually from the Actions tab
- Creates a pull request when updates are found
- Includes validation and detailed change information

## Requirements

### PowerShell Script
- PowerShell 5.0 or later
- Internet connection

### Bash Script
- Bash shell
- `curl` command
- `jq` command (for JSON parsing)

### GitHub Action
- No additional setup required
- Uses Ubuntu latest runner
- Includes all necessary dependencies

## Source Repository

The scripts check for updates from:
https://github.com/woodenplastic/MidiDeviceDefinitions/tree/main/Json

They look for files matching the pattern `midi-database-v*.json` where `*` is a version number.