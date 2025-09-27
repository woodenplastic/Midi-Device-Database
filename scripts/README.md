# SVG Icon Generator Scripts

This folder contains scripts to automatically generate a combined SVG icon file from individual SVG files.

## Scripts

### generate-device-icons.js
Basic script that combines all SVG files in the `public/svg-icons` folder into a single `device-icons.svg` file.

**Features:**
- Converts individual SVG files to `<symbol>` elements
- Sets a standardized viewBox of `0 0 500 300`
- Generates icon IDs based on filenames (e.g., `elektron_analog_four_mkii.svg` → `icon-elektron_analog_four_mkii`)
- Excludes `icons.svg` and `device-icons.svg` from processing

### generate-device-icons-advanced.js
Advanced script with automatic scaling and transformation to fit the target viewBox.

**Features:**
- All features from the basic script
- Automatically scales and centers content to fit within the 500x300 viewBox
- Preserves aspect ratio
- Handles different original viewBox dimensions
- Maintains existing transformations

## Usage

### Command Line
```bash
# Basic version
npm run generate-icons

# Advanced version (recommended)
npm run generate-icons-advanced
```

### Windows Batch File
Double-click `generate-icons.bat` to run the basic script.

## Output

The script creates `public/svg-icons/device-icons.svg` containing all individual SVG files as symbols:

```xml
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    <symbol id="icon-elektron_analog_four_mkii" viewBox="0 0 500 300">
        <!-- SVG content -->
    </symbol>
    <!-- More symbols... -->
</svg>
```

## Usage in Components

To use the generated icons in your React components:

```jsx
// Import and use as SVG sprite
<svg width="100" height="60">
    <use href="#icon-elektron_analog_four_mkii" />
</svg>
```

## File Naming Convention

- Original file: `elektron_analog_four_mkii.svg`
- Generated symbol ID: `icon-elektron_analog_four_mkii`
- Special characters in filenames are converted to underscores

## Adding New Icons

1. Add your SVG file to the `public/svg-icons/` folder
2. Run the generation script
3. The new icon will be available as `#icon-[filename]`

## Notes

- The scripts automatically exclude `icons.svg` and `device-icons.svg` from processing
- The advanced script is recommended for SVGs with different dimensions
- Generated icon IDs are logged to the console for reference