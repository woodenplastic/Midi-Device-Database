const fs = require('fs');
const path = require('path');
const pako = require('pako');
const { createObjectCsvWriter } = require('csv-writer');

async function convertToCsv() {
  try {
    console.log('Starting JSON to CSV conversion...');
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'csv');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Determine which file to use (in order of preference)
    let data;
    if (fs.existsSync('midi.min.json.gz')) {
      console.log('Using compressed JSON file (midi.min.json.gz)');
      const compressedData = fs.readFileSync('midi.min.json.gz');
      const uint8Array = new Uint8Array(compressedData);
      const decompressedData = pako.inflate(uint8Array, { to: 'string' });
      data = JSON.parse(decompressedData);
    } else if (fs.existsSync('midi.min.json')) {
      console.log('Using minified JSON file (midi.min.json)');
      const jsonData = fs.readFileSync('midi.min.json', 'utf8');
      data = JSON.parse(jsonData);
    } else if (fs.existsSync('midi.json')) {
      console.log('Using full JSON file (midi.json)');
      const jsonData = fs.readFileSync('midi.json', 'utf8');
      data = JSON.parse(jsonData);
    } else {
      throw new Error('No JSON file found');
    }
    
    // Helper function to ensure string values are properly handled
    function safeString(value) {
      if (value === null || value === undefined) return '';
      return String(value);
    }
    
    // Helper function to ensure numeric values are properly handled
    function safeNumber(value) {
      if (value === null || value === undefined || value === '') return '';
      return Number(value);
    }
    
    // Process manufacturers and devices
    const manufacturers = [];
    const devices = [];
    const ccParams = [];
    const nrpnParams = [];
    const pcParams = [];
    
    // Process all brands except version and generatedAt
    console.log('Processing data...');
    Object.entries(data).forEach(([brandName, brandContent]) => {
      // Skip metadata fields
      if (brandName === "version" || brandName === "generatedAt") return;
      
      let deviceCount = 0;
      
      // Process devices
      Object.entries(brandContent).forEach(([deviceName, deviceData]) => {
        deviceCount++;
        
        const deviceId = `${brandName}_${deviceName}`.replace(/\s+/g, "_").toLowerCase();
        
        // Add device
        devices.push({
          id: deviceId,
          brand: brandName,
          device_name: deviceName,
          midi_thru: deviceData.midi_thru ? true : false, // Convert to boolean
          midi_clock: deviceData.midi_clock ? true : false, // Convert to boolean
          phantom_power: deviceData.phantom_power ? true : false // Convert to boolean
        });
        
        // Process CC parameters
        if (deviceData.cc && deviceData.cc.length > 0) {
          deviceData.cc.forEach((param, index) => {
            ccParams.push({
              id: `${deviceId}_cc_${index}`,
              device_id: deviceId,
              name: safeString(param.name),
              description: safeString(param.description),
              value: safeNumber(param.value),
              min: safeNumber(param.min),
              max: safeNumber(param.max),
            });
          });
        }
        
        // Process NRPN parameters
        if (deviceData.nrpn && deviceData.nrpn.length > 0) {
          deviceData.nrpn.forEach((param, index) => {
            nrpnParams.push({
              id: `${deviceId}_nrpn_${index}`,
              device_id: deviceId,
              name: safeString(param.name),
              description: safeString(param.description),
              msb: safeNumber(param.msb),
              lsb: safeNumber(param.lsb),
              min: safeNumber(param.min),
              max: safeNumber(param.max),
            });
          });
        }
        
        // Process PC parameters
        if (deviceData.pc && deviceData.pc.length > 0) {
          deviceData.pc.forEach((param, index) => {
            pcParams.push({
              id: `${deviceId}_pc_${index}`,
              device_id: deviceId,
              name: safeString(param.name),
              description: safeString(param.description),
              value: safeNumber(param.value),
              min: safeNumber(param.min),
              max: safeNumber(param.max),
            });
          });
        }
      });
      
      manufacturers.push({
        name: brandName,
        device_count: deviceCount,
      });
    });
    
    // Write manufacturers to CSV
    console.log('Writing manufacturers to CSV...');
    const manufacturersWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'manufacturers.csv'),
      header: [
        { id: 'name', title: 'name' },
        { id: 'device_count', title: 'device_count' }
      ]
    });
    await manufacturersWriter.writeRecords(manufacturers);
    
    // Write devices to CSV
    console.log('Writing devices to CSV...');
    const devicesWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'devices.csv'),
      header: [
        { id: 'id', title: 'id' },
        { id: 'brand', title: 'brand' },
        { id: 'device_name', title: 'device_name' },
        { id: 'midi_thru', title: 'midi_thru' }, // Boolean field
        { id: 'midi_clock', title: 'midi_clock' }, // Boolean field
        { id: 'phantom_power', title: 'phantom_power' } // Boolean field
      ]
    });
    await devicesWriter.writeRecords(devices);
    
    // Write CC parameters to CSV
    console.log('Writing CC parameters to CSV...');
    const ccWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'device_cc.csv'),
      header: [
        { id: 'id', title: 'id' },
        { id: 'device_id', title: 'device_id' },
        { id: 'name', title: 'name' },
        { id: 'description', title: 'description' },
        { id: 'value', title: 'value' },
        { id: 'min', title: 'min' },
        { id: 'max', title: 'max' }
      ]
    });
    await ccWriter.writeRecords(ccParams);
    
    // Write NRPN parameters to CSV
    console.log('Writing NRPN parameters to CSV...');
    const nrpnWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'device_nrpn.csv'),
      header: [
        { id: 'id', title: 'id' },
        { id: 'device_id', title: 'device_id' },
        { id: 'name', title: 'name' },
        { id: 'description', title: 'description' },
        { id: 'msb', title: 'msb' },
        { id: 'lsb', title: 'lsb' },
        { id: 'min', title: 'min' },
        { id: 'max', title: 'max' }
      ]
    });
    await nrpnWriter.writeRecords(nrpnParams);
    
    // Write PC parameters to CSV
    console.log('Writing PC parameters to CSV...');
    const pcWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'device_pc.csv'),
      header: [
        { id: 'id', title: 'id' },
        { id: 'device_id', title: 'device_id' },
        { id: 'name', title: 'name' },
        { id: 'description', title: 'description' },
        { id: 'value', title: 'value' },
        { id: 'min', title: 'min' },
        { id: 'max', title: 'max' }
      ]
    });
    await pcWriter.writeRecords(pcParams);
    
    console.log('CSV conversion completed successfully!');
    console.log(`CSV files are in: ${outputDir}`);
  } catch (error) {
    console.error('Error converting to CSV:', error);
    process.exit(1);
  }
}

convertToCsv();