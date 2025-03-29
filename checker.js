const fs = require('fs');
const path = require('path');

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

// Load the mapping.json file
const mappingPath = path.join(__dirname, 'mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Create quick lookup structures
const brandsByName = new Map();
const brandsByValue = new Map();
const devicesByValue = new Map();

mapping.brands.forEach(brand => {
    brandsByName.set(brand.name.toLowerCase(), brand);
    brandsByValue.set(brand.value.toLowerCase(), brand);
    
    if (brand.models) {
        brand.models.forEach(model => {
            if (!model.value) return;
            devicesByValue.set(`${brand.value}_${model.value}`.toLowerCase(), model);
        });
    }
});

// Load databases
const targetDbPath = findLatestDatabase();
const sourceDbPath = path.join(__dirname, 'all.json');

const targetDb = JSON.parse(fs.readFileSync(targetDbPath, 'utf8'));
const sourceDb = JSON.parse(fs.readFileSync(sourceDbPath, 'utf8'));

// Find missing brands and devices
const missingBrands = new Set();
const missingDevices = new Map(); // Map<brandValue, Set<deviceName>>

// Process target database
const reservedKeys = ['version', 'generatedAt'];

Object.keys(targetDb).forEach(brandKey => {
    if (reservedKeys.includes(brandKey)) return;
    
    const normalizedBrandKey = brandKey.toLowerCase().replace(/\s+/g, '');
    
    // Check if this brand exists in our mapping
    if (!brandsByName.has(brandKey.toLowerCase()) && 
        !brandsByValue.has(normalizedBrandKey) &&
        !brandsByValue.has(brandKey.toLowerCase())) {
        missingBrands.add(brandKey);
    } else {
        // Get the brand from our mapping
        let brand;
        if (brandsByName.has(brandKey.toLowerCase())) {
            brand = brandsByName.get(brandKey.toLowerCase());
        } else if (brandsByValue.has(normalizedBrandKey)) {
            brand = brandsByValue.get(normalizedBrandKey);
        } else {
            brand = brandsByValue.get(brandKey.toLowerCase());
        }
        
        // Check devices for this brand
        Object.keys(targetDb[brandKey]).forEach(deviceKey => {
            const deviceId = `${brand.value}_${deviceKey.toLowerCase().replace(/\s+/g, '')}`;
            
            if (!devicesByValue.has(deviceId)) {
                if (!missingDevices.has(brand.value)) {
                    missingDevices.set(brand.value, new Set());
                }
                missingDevices.get(brand.value).add(deviceKey);
            }
        });
    }
});

// Process source database
Object.keys(sourceDb).forEach(brandKey => {
    const normalizedBrandKey = brandKey.toLowerCase().replace(/\s+/g, '');
    
    // Check if this brand exists in our mapping
    if (!brandsByName.has(brandKey.toLowerCase()) && 
        !brandsByValue.has(normalizedBrandKey) &&
        !brandsByValue.has(brandKey.toLowerCase())) {
        missingBrands.add(brandKey);
    } else {
        // Get the brand from our mapping
        let brand;
        if (brandsByName.has(brandKey.toLowerCase())) {
            brand = brandsByName.get(brandKey.toLowerCase());
        } else if (brandsByValue.has(normalizedBrandKey)) {
            brand = brandsByValue.get(normalizedBrandKey);
        } else {
            brand = brandsByValue.get(brandKey.toLowerCase());
        }
        
        // Check devices for this brand
        Object.keys(sourceDb[brandKey]).forEach(deviceKey => {
            const deviceId = `${brand.value}_${deviceKey.toLowerCase().replace(/\s+/g, '')}`;
            
            if (!devicesByValue.has(deviceId)) {
                if (!missingDevices.has(brand.value)) {
                    missingDevices.set(brand.value, new Set());
                }
                missingDevices.get(brand.value).add(deviceKey);
            }
        });
    }
});

// Output results
console.log('===== Missing Brands =====');
if (missingBrands.size === 0) {
    console.log('No missing brands found!');
} else {
    missingBrands.forEach(brand => {
        const suggestedValue = brand.toLowerCase().replace(/\s+/g, '');
        console.log(`  {
    "name": "${brand}",
    "value": "${suggestedValue}",
    "models": []
  },`);
    });
}

console.log('\n===== Missing Devices =====');
if (missingDevices.size === 0) {
    console.log('No missing devices found!');
} else {
    for (const [brandValue, devices] of missingDevices.entries()) {
        const brand = brandsByValue.get(brandValue);
        console.log(`\nFor ${brand.name} (${brandValue}):`);
        
        devices.forEach(device => {
            const suggestedValue = device.toLowerCase().replace(/\s+/g, '');
            console.log(`  {
    "name": "${device}",
    "value": "${suggestedValue}"
  },`);
        });
    }
}