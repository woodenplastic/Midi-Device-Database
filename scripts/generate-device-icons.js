const fs = require('fs');
const path = require('path');

const SVG_ICONS_DIR = path.join(__dirname, '..', 'public', 'svg-icons');
const OUTPUT_FILE = path.join(SVG_ICONS_DIR, 'device-icons.svg');

function extractSvgContent(svgContent, filename) {
    // Remove the XML declaration and DOCTYPE if present
    let content = svgContent.replace(/<\?xml[^>]*\?>/, '');
    content = content.replace(/<!DOCTYPE[^>]*>/, '');
    
    // Extract the content inside the <svg> tags
    const svgMatch = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!svgMatch) {
        console.warn(`Could not extract content from ${filename}`);
        return null;
    }
    
    let innerContent = svgMatch[1].trim();
    
    // If there's a single top-level <g> tag without attributes, extract its content
    // If the g tag has attributes (like id, transform, etc.), keep it
    const singleGMatch = innerContent.match(/^<g(\s[^>]*)?>[\s\S]*<\/g>$/);
    if (singleGMatch) {
        const gAttributes = singleGMatch[1];
        if (!gAttributes || gAttributes.trim() === '') {
            // Empty g tag, extract its content
            const gContentMatch = innerContent.match(/^<g[^>]*?>([\s\S]*)<\/g>$/);
            if (gContentMatch) {
                innerContent = gContentMatch[1].trim();
            }
        }
        // If g has attributes, keep the entire g tag
    }
    
    return innerContent;
}

function getIconIdFromFilename(filename) {
    // Remove .svg extension and convert to valid ID
    return filename.replace('.svg', '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generateDeviceIcons() {
    try {
        // Read all files in the svg-icons directory
        const files = fs.readdirSync(SVG_ICONS_DIR);
        const svgFiles = files.filter(file => 
            file.endsWith('.svg') && 
            file !== 'icons.svg' && 
            file !== 'device-icons.svg'
        );
        
        if (svgFiles.length === 0) {
            console.log('No SVG files found to process.');
            return;
        }
        
        console.log(`Processing ${svgFiles.length} SVG files...`);
        
        let symbols = '';
        
        for (const file of svgFiles) {
            const filePath = path.join(SVG_ICONS_DIR, file);
            const svgContent = fs.readFileSync(filePath, 'utf-8');
            const iconId = getIconIdFromFilename(file);
            
            console.log(`Processing ${file} -> icon-${iconId}`);
            
            const innerContent = extractSvgContent(svgContent, file);
            if (innerContent) {
                symbols += `
    <symbol id="icon-${iconId}" viewBox="0 0 500 300">
        ${innerContent.split('\n').map(line => line.trim()).filter(line => line).map(line => `        ${line}`).join('\n')}
    </symbol>
`;
            }
        }
        
        const deviceIconsSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
${symbols}
</svg>`;
        
        // Write the combined SVG file
        fs.writeFileSync(OUTPUT_FILE, deviceIconsSvg, 'utf-8');
        
        console.log(`Successfully generated device-icons.svg with ${svgFiles.length} icons.`);
        console.log(`Output file: ${OUTPUT_FILE}`);
        
        // Log the icon IDs for reference
        console.log('\nGenerated icon IDs:');
        svgFiles.forEach(file => {
            const iconId = getIconIdFromFilename(file);
            console.log(`  - icon-${iconId}`);
        });
        
        console.log('\nNOTE: This script preserves the original SVG content without scaling.');
        console.log('If icons appear too large/small, manual adjustments may be needed in the source SVG files.');
        
    } catch (error) {
        console.error('Error generating device icons:', error);
        process.exit(1);
    }
}

// Run the script
generateDeviceIcons();