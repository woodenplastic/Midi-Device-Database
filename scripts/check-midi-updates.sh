#!/bin/bash

# MIDI Database Update Checker
# This script checks for updates to the MIDI database from the external repository

set -e

echo "🎵 MIDI Database Update Checker"
echo "================================"

# Configuration
REMOTE_REPO="woodenplastic/MidiDeviceDefinitions"
REMOTE_PATH="Json"
FILE_PATTERN="midi-database-v"

# Function to extract version number from filename
extract_version() {
    echo "$1" | grep -o 'v[0-9]\+' | sed 's/v//' || echo "0"
}

# Find current highest version in local repository
echo "📁 Checking local files..."
CURRENT_VERSION=0
CURRENT_FILE=""

if ls ${FILE_PATTERN}*.json 1> /dev/null 2>&1; then
    for file in ${FILE_PATTERN}*.json; do
        VERSION=$(extract_version "$file")
        if [ "$VERSION" -gt "$CURRENT_VERSION" ]; then
            CURRENT_VERSION=$VERSION
            CURRENT_FILE=$file
        fi
    done
fi

echo "   Current version: v$CURRENT_VERSION"
if [ -n "$CURRENT_FILE" ]; then
    echo "   Current file: $CURRENT_FILE"
else
    echo "   No local MIDI database files found"
fi

# Check remote repository for available versions
echo ""
echo "🔍 Checking remote repository..."
REPO_URL="https://api.github.com/repos/$REMOTE_REPO/contents/$REMOTE_PATH"

if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed"
    echo "   Please install jq to use this script"
    exit 1
fi

REMOTE_FILES=$(curl -s "$REPO_URL" | jq -r '.[].name | select(test("'${FILE_PATTERN}'[0-9]+\\.json"))')

if [ -z "$REMOTE_FILES" ]; then
    echo "❌ Error: Could not fetch remote files or no matching files found"
    exit 1
fi

HIGHEST_REMOTE_VERSION=0
DOWNLOAD_FILE=""

for file in $REMOTE_FILES; do
    VERSION=$(extract_version "$file")
    echo "   Found remote file: $file (v$VERSION)"
    if [ "$VERSION" -gt "$HIGHEST_REMOTE_VERSION" ]; then
        HIGHEST_REMOTE_VERSION=$VERSION
        DOWNLOAD_FILE=$file
    fi
done

echo ""
echo "📊 Version comparison:"
echo "   Local version:  v$CURRENT_VERSION"
echo "   Remote version: v$HIGHEST_REMOTE_VERSION"

# Check if update is needed
if [ "$HIGHEST_REMOTE_VERSION" -gt "$CURRENT_VERSION" ]; then
    echo ""
    echo "🆕 Update available!"
    echo "   New file: $DOWNLOAD_FILE"
    
    read -p "Do you want to download the updated file? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DOWNLOAD_URL="https://raw.githubusercontent.com/$REMOTE_REPO/main/$REMOTE_PATH/$DOWNLOAD_FILE"
        echo "⬇️  Downloading: $DOWNLOAD_URL"
        
        if curl -L -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
            # Verify the file is valid JSON
            if jq empty "$DOWNLOAD_FILE" 2>/dev/null; then
                echo "✅ Successfully downloaded and validated $DOWNLOAD_FILE"
                
                if [ -n "$CURRENT_FILE" ] && [ "$CURRENT_FILE" != "$DOWNLOAD_FILE" ]; then
                    read -p "Do you want to remove the old file ($CURRENT_FILE)? (y/N): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        rm "$CURRENT_FILE"
                        echo "🗑️  Removed old file: $CURRENT_FILE"
                    fi
                fi
            else
                echo "❌ Error: Downloaded file is not valid JSON"
                rm "$DOWNLOAD_FILE"
                exit 1
            fi
        else
            echo "❌ Error: Failed to download file"
            exit 1
        fi
    else
        echo "❌ Download cancelled"
    fi
else
    echo ""
    echo "✅ No update needed - you have the latest version!"
fi

echo ""
echo "🎵 Done!"