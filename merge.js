const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Find the latest version of the midi-database file
function findLatestDatabase() {
    const files = fs.readdirSync(__dirname);
    const dbFiles = files.filter(file =>
        file.startsWith('midi-database-v') &&
        file.endsWith('.json') &&
        !file.endsWith('.min.json') &&
        !file.endsWith('.json.gz')
    );

    if (dbFiles.length === 0) {
        throw new Error('No midi-database files found');
    }

    // Sort files alphabetically (works for semantic versioning)
    dbFiles.sort().reverse();

    console.log(`Found latest database: ${dbFiles[0]}`);
    return path.join(__dirname, dbFiles[0]);
}

// Load mapping.json file
function loadMappings() {
    try {
        const mappingPath = path.join(__dirname, 'mapping.json');
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        // Parse mapping.json to create manufacturer and device mappings
        const manufacturerMapping = {};
        const deviceMapping = {};
        
        mapping.brands.forEach(brand => {
            const brandValue = brand.value;
            const brandName = brand.name;
            
            // Add the primary brand mapping - map to value (key)
            manufacturerMapping[brandValue] = brandValue;
            
            // Add common variations of brand names - also map to value (key)
            manufacturerMapping[brandName.toLowerCase()] = brandValue;
            manufacturerMapping[brandName.toLowerCase().replace(/\s+/g, '')] = brandValue;
            manufacturerMapping[brandName.toLowerCase().replace(/\s+/g, '_')] = brandValue;
            manufacturerMapping[brandName.toLowerCase().replace(/\s+/g, '-')] = brandValue;
            
            // Add common suffixes
            manufacturerMapping[brandValue + '_music'] = brandValue;
            manufacturerMapping[brandValue + 'music'] = brandValue;
            manufacturerMapping[brandValue + '_audio'] = brandValue;
            manufacturerMapping[brandValue + 'audio'] = brandValue;
            manufacturerMapping[brandValue + '_electronics'] = brandValue;
            manufacturerMapping[brandValue + 'electronics'] = brandValue;
            manufacturerMapping[brandValue + '_pedals'] = brandValue;
            manufacturerMapping[brandValue + 'pedals'] = brandValue;
            manufacturerMapping[brandValue + '_effects'] = brandValue;
            manufacturerMapping[brandValue + 'effects'] = brandValue;
            manufacturerMapping[brandValue + '_engineering'] = brandValue;
            manufacturerMapping[brandValue + 'engineering'] = brandValue;
            
            // Add name variations with spaces/underscores/dashes replaced
            manufacturerMapping[brandValue.replace(/-/g, '_')] = brandValue;
            manufacturerMapping[brandValue.replace(/_/g, '-')] = brandValue;
            
            // Process device models if available
            if (brand.models && Array.isArray(brand.models)) {
                brand.models.forEach(model => {
                    if (!model.value) return; // Skip entries without values
                    
                    const modelValue = model.value;
                    const modelName = model.name || modelValue;
                    
                    // Add the primary model mapping - map to value (key)
                    deviceMapping[modelValue] = modelValue;
                    
                    // Add variations of model names - also map to value (key)
                    deviceMapping[modelName.toLowerCase()] = modelValue;
                    deviceMapping[modelName.toLowerCase().replace(/\s+/g, '')] = modelValue;
                    deviceMapping[modelName.toLowerCase().replace(/\s+/g, '_')] = modelValue;
                    deviceMapping[modelName.toLowerCase().replace(/\s+/g, '-')] = modelValue;
                    
                    // Add common model variations with different separators
                    deviceMapping[modelValue.replace(/-/g, '_')] = modelValue;
                    deviceMapping[modelValue.replace(/_/g, '-')] = modelValue;
                    deviceMapping[modelValue.replace(/\./g, '')] = modelValue;
                    
                    // Special case for roman numerals and MK versions
                    deviceMapping[modelValue.replace(/mk(\d+)/i, 'mark$1')] = modelValue;
                    deviceMapping[modelValue.replace(/mark(\d+)/i, 'mk$1')] = modelValue;
                    deviceMapping[modelValue.replace(/mkii/i, 'mk2')] = modelValue;
                    deviceMapping[modelValue.replace(/mk2/i, 'mkii')] = modelValue;
                });
            }
        });
        
        // Brand display names - map from value (key) to display name
        const brandDisplayNames = {};
        mapping.brands.forEach(brand => {
            brandDisplayNames[brand.value] = brand.name;
        });
        
        // Model display names - map from value (key) to display name
        const modelDisplayNames = {};
        mapping.brands.forEach(brand => {
            if (brand.models && Array.isArray(brand.models)) {
                brand.models.forEach(model => {
                    if (model.value && model.name) {
                        if (!modelDisplayNames[brand.value]) {
                            modelDisplayNames[brand.value] = {};
                        }
                        modelDisplayNames[brand.value][model.value] = model.name;
                    }
                });
            }
        });
        
        console.log(`Loaded mappings for ${Object.keys(manufacturerMapping).length} manufacturer variations and ${Object.keys(deviceMapping).length} device variations`);
        return { manufacturerMapping, deviceMapping, brandDisplayNames, modelDisplayNames };
    } catch (error) {
        console.error('Error loading mapping.json:', error);
        return { manufacturerMapping: {}, deviceMapping: {}, brandDisplayNames: {}, modelDisplayNames: {} };
    }
}

// Paths to the JSON files
const targetDbPath = findLatestDatabase();
const sourceDbPath = path.join(__dirname, 'all.json');

// Changed output file names to be simpler
const outputPath = path.join(__dirname, 'midi.json');
const minifiedPath = path.join(__dirname, 'midi.min.json');
const gzipPath = path.join(__dirname, 'midi.min.json.gz');

// Load mappings from mapping.json
const { 
    manufacturerMapping, 
    deviceMapping, 
    brandDisplayNames, 
    modelDisplayNames 
} = loadMappings();

// Function to handle normalization and mapping with model number preservation
function normalizeAndMapKey(key, mappingTable = {}, displayNameTable = null) {
    // Direct mapping lookup (exact match)
    if (mappingTable[key]) {
        const normalizedKey = mappingTable[key];
        // Get display name if available
        const displayName = displayNameTable ? (displayNameTable[normalizedKey] || normalizedKey) : normalizedKey;
        
        return {
            normalized: normalizedKey.toLowerCase().replace(/\s+/g, '_'),
            canonical: displayName
        };
    }

    // Lowercase lookup
    const lowercaseKey = key.toLowerCase();
    if (mappingTable[lowercaseKey]) {
        const normalizedKey = mappingTable[lowercaseKey];
        const displayName = displayNameTable ? (displayNameTable[normalizedKey] || normalizedKey) : normalizedKey;
        
        return {
            normalized: normalizedKey.toLowerCase().replace(/\s+/g, '_'),
            canonical: displayName
        };
    }
    
    // No mapping found - create normalized version that preserves model identifiers
    // Convert spaces to underscores, convert to lowercase
    return {
        normalized: key.toLowerCase().replace(/\s+/g, '_'),
        canonical: key
    };
}

// Function to get display name for model from modelDisplayNames
function getModelDisplayName(brandKey, modelKey) {
    if (modelDisplayNames[brandKey] && modelDisplayNames[brandKey][modelKey]) {
        return modelDisplayNames[brandKey][modelKey];
    }
    return modelKey;
}

// Function to merge device data, preferring the more complete version
function mergeDevices(deviceA, deviceB) {
    // Create a merged device preferring non-empty values
    const merged = { ...deviceB, ...deviceA }; // Start with deviceB, overwrite with deviceA

    // Special handling for arrays like cc, nrpn, pc
    ['cc', 'nrpn', 'pc'].forEach(arrayField => {
        if (deviceA[arrayField]?.length > 0 && deviceB[arrayField]?.length > 0) {
            // Both have items - use the one with more data
            merged[arrayField] = deviceA[arrayField].length >= deviceB[arrayField].length
                ? deviceA[arrayField]
                : deviceB[arrayField];
        } else if (deviceA[arrayField]?.length > 0) {
            merged[arrayField] = deviceA[arrayField];
        } else if (deviceB[arrayField]?.length > 0) {
            merged[arrayField] = deviceB[arrayField];
        } else {
            merged[arrayField] = [];
        }
    });

    // Handle nested objects like midi_channel
    if (deviceA.midi_channel?.instructions && deviceB.midi_channel?.instructions) {
        // Use the longer instructions
        merged.midi_channel.instructions =
            deviceA.midi_channel.instructions.length >= deviceB.midi_channel.instructions.length
                ? deviceA.midi_channel.instructions
                : deviceB.midi_channel.instructions;
    }

    // Ensure all required fields exist
    merged.midi_thru = merged.midi_thru || false;
    merged.midi_in = merged.midi_in || "";
    merged.midi_clock = merged.midi_clock || false;
    merged.phantom_power = merged.phantom_power || "None";
    merged.midi_channel = merged.midi_channel || { instructions: "" };
    merged.instructions = merged.instructions || "";

    return merged;
}

// Function to create a standardized device object
function createStandardDevice(deviceData, brandName, deviceName) {
    return {
        brand: brandName,
        device_name: deviceName,
        midi_thru: deviceData.midi_thru || false,
        midi_in: deviceData.midi_in || "",
        midi_clock: deviceData.midi_clock || false,
        phantom_power: deviceData.phantom_power || "None",
        midi_channel: {
            instructions: deviceData.midi_channel?.instructions || ""
        },
        instructions: deviceData.instructions || "",
        cc: (deviceData.cc || []).map(cc => ({
            name: cc.name || "",
            description: cc.description || "",
            usage: cc.usage || "",
            curve: cc.curve || "0-based",
            value: typeof cc.value === 'string' ? parseInt(cc.value, 10) : cc.value,
            min: typeof cc.min === 'string' ? parseInt(cc.min, 10) : (cc.min !== undefined ? cc.min : 0),
            max: typeof cc.max === 'string' ? parseInt(cc.max, 10) : (cc.max !== undefined ? cc.max : 127),
            type: cc.type || "Parameter"
        })),
        nrpn: (deviceData.nrpn || []).map(nrpn => ({
            name: nrpn.name || "",
            description: nrpn.description || "",
            usage: nrpn.usage || "",
            curve: nrpn.curve || "0-based",
            msb: typeof nrpn.msb === 'string' ? parseInt(nrpn.msb, 10) : nrpn.msb,
            lsb: typeof nrpn.lsb === 'string' ? parseInt(nrpn.lsb, 10) : nrpn.lsb,
            min: typeof nrpn.min === 'string' ? parseInt(nrpn.min, 10) : (nrpn.min !== undefined ? nrpn.min : 0),
            max: typeof nrpn.max === 'string' ? parseInt(nrpn.max, 10) : (nrpn.max !== undefined ? nrpn.max : 16383),
            type: nrpn.type || "Parameter"
        })),
        pc: []
    };
}

try {
    console.log('Reading source files...');
    const targetDb = JSON.parse(fs.readFileSync(targetDbPath, 'utf8'));
    const sourceDb = JSON.parse(fs.readFileSync(sourceDbPath, 'utf8'));

    // Preserve metadata from target database
    const metadata = {};
    const reservedKeys = ['version', 'generatedAt'];
    reservedKeys.forEach(key => {
        if (targetDb[key] !== undefined) {
            metadata[key] = targetDb[key];
        }
    });

    console.log('Combining and normalizing devices...');

    // Combine all devices from both databases and group by normalized names
    const manufacturers = {};
    const normalizedDeviceMap = {};

    // Process target database
    Object.entries(targetDb).forEach(([brandKey, brandData]) => {
        // Skip metadata fields
        if (reservedKeys.includes(brandKey)) return;

        // Get normalized and canonical keys for manufacturer
        const { normalized: normalizedBrand, canonical: canonicalBrand } =
            normalizeAndMapKey(brandKey, manufacturerMapping, brandDisplayNames);

        // Save original and normalized forms
        if (!manufacturers[normalizedBrand]) {
            manufacturers[normalizedBrand] = {
                variants: [brandKey],
                canonicalName: canonicalBrand, // Store canonical name
                devices: {}
            };
        } else {
            manufacturers[normalizedBrand].variants.push(brandKey);
        }

        Object.entries(brandData).forEach(([deviceKey, deviceData]) => {
            // Get normalized and canonical keys for device
            const { normalized: normalizedDevice, canonical: canonicalDevice } =
                normalizeAndMapKey(deviceKey, deviceMapping);
            const displayDeviceName = getModelDisplayName(normalizedBrand, normalizedDevice);

            const deviceId = `${normalizedBrand}_${normalizedDevice}`;

            if (!normalizedDeviceMap[deviceId]) {
                normalizedDeviceMap[deviceId] = [];
            }

            // Store both original key and canonical name
            normalizedDeviceMap[deviceId].push({
                brandKey,
                deviceKey,
                canonicalBrandName: canonicalBrand,
                canonicalDeviceName: displayDeviceName,
                data: createStandardDevice(deviceData, deviceData.brand || canonicalBrand, deviceData.device_name || displayDeviceName)
            });

            manufacturers[normalizedBrand].devices[normalizedDevice] = deviceId;
        });
    });

    // Process source database
    Object.entries(sourceDb).forEach(([brandKey, brandData]) => {
        // Apply manual mapping first, then normalize
        const { normalized: normalizedBrand, canonical: canonicalBrand } = 
            normalizeAndMapKey(brandKey, manufacturerMapping, brandDisplayNames);

        if (!manufacturers[normalizedBrand]) {
            manufacturers[normalizedBrand] = {
                variants: [brandKey],
                canonicalName: canonicalBrand,
                devices: {}
            };
        } else if (!manufacturers[normalizedBrand].variants.includes(brandKey)) {
            manufacturers[normalizedBrand].variants.push(brandKey);
        }

        Object.entries(brandData).forEach(([deviceKey, deviceData]) => {
            // Apply manual mapping first, then normalize
            const { normalized: normalizedDevice, canonical: canonicalDevice } = 
                normalizeAndMapKey(deviceKey, deviceMapping);
            const displayDeviceName = getModelDisplayName(normalizedBrand, normalizedDevice);

            const deviceId = `${normalizedBrand}_${normalizedDevice}`;

            if (!normalizedDeviceMap[deviceId]) {
                normalizedDeviceMap[deviceId] = [];
            }

            // Special handling for PC if it's an object instead of array
            if (deviceData.pc && !Array.isArray(deviceData.pc)) {
                const pcData = deviceData.pc;
                deviceData.pc = [{
                    name: "Program Change",
                    description: pcData.description || "",
                    usage: "",
                    curve: "0-based",
                    value: 0,
                    min: 0,
                    max: 127,
                    type: "Parameter"
                }];
            }

            normalizedDeviceMap[deviceId].push({
                brandKey,
                deviceKey,
                canonicalBrandName: canonicalBrand,
                canonicalDeviceName: displayDeviceName,
                data: createStandardDevice(deviceData, canonicalBrand, displayDeviceName)
            });

            manufacturers[normalizedBrand].devices[normalizedDevice] = deviceId;
        });
    });

    // Select the best brand name for each normalized manufacturer
    const finalDb = { ...metadata };

    Object.entries(manufacturers).forEach(([normalizedBrand, data]) => {
        // Use the canonical name for the brand
        const primaryBrandKey = data.canonicalName;

        finalDb[primaryBrandKey] = {};

        // Process each device
        Object.entries(data.devices).forEach(([normalizedDevice, deviceId]) => {
            const deviceVariants = normalizedDeviceMap[deviceId];

            // Don't merge different models - split by canonical name
            const variantsByName = {};

            deviceVariants.forEach(variant => {
                const modelName = variant.canonicalDeviceName || variant.deviceKey;
                if (!variantsByName[modelName]) {
                    variantsByName[modelName] = [];
                }
                variantsByName[modelName].push(variant);
            });

            // Process each distinct model separately
            Object.entries(variantsByName).forEach(([modelName, variants]) => {
                // Sort variants of this specific model by data completeness
                variants.sort((a, b) => {
                    const aCount = (a.data.cc?.length || 0) + (a.data.nrpn?.length || 0) + (a.data.pc?.length || 0);
                    const bCount = (b.data.cc?.length || 0) + (b.data.nrpn?.length || 0) + (b.data.pc?.length || 0);
                    return bCount - aCount;
                });

                const primaryVariant = variants[0];

                // Merge data only from variants with the same model name
                let mergedData = { ...primaryVariant.data };
                if (variants.length > 1) {
                    for (let i = 1; i < variants.length; i++) {
                        mergedData = mergeDevices(mergedData, variants[i].data);
                    }
                }

                // Ensure brand and device name are set correctly
                mergedData.brand = primaryBrandKey;
                mergedData.device_name = modelName;

                // Add to final database under the appropriate name
                finalDb[primaryBrandKey][modelName] = mergedData;
            });
        });
    });

    // Write the final database
    console.log('Writing final database...');
    fs.writeFileSync(outputPath, JSON.stringify(finalDb, null, 2));

    // Write the minified version
    const minified = JSON.stringify(finalDb);
    fs.writeFileSync(minifiedPath, minified);

    // Write the gzipped version
    const compressed = zlib.gzipSync(minified);
    fs.writeFileSync(gzipPath, compressed);

    // Extract version info and write to version file
    console.log('Creating version information file...');
    const versionPath = path.join(__dirname, 'midi-database-version.json');
    const versionInfo = {
        version: finalDb.version || "unknown",
        generatedAt: finalDb.generatedAt || new Date().toISOString(),
        sourceFile: path.basename(targetDbPath),
        databaseStats: {
            brands: brandCount,
            devices: deviceCount,
            parameters: {
                cc: ccCount,
                nrpn: nrpnCount,
                pc: pcCount,
                total: ccCount + nrpnCount + pcCount
            }
        },
        sizes: {
            prettyJson: `${prettySize} KB`,
            minifiedJson: `${minSize} KB`,
            gzippedJson: `${gzipSize} KB`,
            compressionRatio: `${(gzipSize / prettySize * 100).toFixed(1)}%`
        }
    };
    fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
    console.log(`Version information written to ${versionPath}`);

    // Calculate and display file sizes
    const prettySize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    const minSize = (fs.statSync(minifiedPath).size / 1024).toFixed(2);
    const gzipSize = (fs.statSync(gzipPath).size / 1024).toFixed(2);

    // Count statistics
    let brandCount = 0;
    let deviceCount = 0;
    let ccCount = 0;
    let nrpnCount = 0;
    let pcCount = 0;

    Object.keys(finalDb).forEach(key => {
        // Skip metadata fields in statistics calculation
        if (reservedKeys.includes(key)) return;

        brandCount++;
        const brand = finalDb[key];
        const devices = Object.values(brand);
        deviceCount += devices.length;

        devices.forEach(device => {
            ccCount += device.cc ? device.cc.length : 0;
            nrpnCount += device.nrpn ? device.nrpn.length : 0;
            pcCount += device.pc ? device.pc.length : 0;
        });
    });

    // Count original sources statistics
    let targetBrandCount = 0;
    let targetDeviceCount = 0;
    let sourceBrandCount = 0;
    let sourceDeviceCount = 0;

    Object.keys(targetDb).forEach(key => {
        if (reservedKeys.includes(key)) return;
        targetBrandCount++;
        targetDeviceCount += Object.keys(targetDb[key]).length;
    });

    Object.keys(sourceDb).forEach(key => {
        sourceBrandCount++;
        sourceDeviceCount += Object.keys(sourceDb[key]).length;
    });

    console.log(`\nMerge Results:`);
    console.log(`- Target Database: ${targetBrandCount} brands, ${targetDeviceCount} devices`);
    console.log(`- Source Database: ${sourceBrandCount} brands, ${sourceDeviceCount} devices`);
    console.log(`- Final Database: ${brandCount} brands, ${deviceCount} devices`);
    console.log(`- Removed duplicates: ${(targetBrandCount + sourceBrandCount) - brandCount} brands, ${(targetDeviceCount + sourceDeviceCount) - deviceCount} devices`);

    console.log(`\nFile Sizes:`);
    console.log(`- Pretty JSON: ${prettySize} KB`);
    console.log(`- Minified JSON: ${minSize} KB`);
    console.log(`- GZipped JSON: ${gzipSize} KB`);
    console.log(`- Compression ratio: ${(gzipSize / prettySize * 100).toFixed(1)}%`);

    console.log(`\nDatabase Statistics:`);
    console.log(`- Brands: ${brandCount}`);
    console.log(`- Devices: ${deviceCount}`);
    console.log(`- CC Parameters: ${ccCount}`);
    console.log(`- NRPN Parameters: ${nrpnCount}`);
    console.log(`- PC Parameters: ${pcCount}`);
    console.log(`- Total Parameters: ${ccCount + nrpnCount + pcCount}`);

} catch (error) {
    console.error('Error processing database:', error);
}