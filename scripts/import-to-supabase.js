const fs = require('fs');
const path = require('path');
const pako = require('pako');
const { createClient } = require('@supabase/supabase-js');

async function importToSupabase() {
  try {
    console.log('Starting MIDI database import to Supabase...');
    
    // Initialize Supabase client with debug logging
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key (first 10 chars):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not provided');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with a simple query
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.from('manufacturers').select('*').limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      throw new Error(`Supabase connection test failed: ${testError.message}`);
    }
    
    console.log('Connection test result:', testData);
    
    // Read the gzipped JSON file
    const filePath = path.join(process.cwd(), 'midi.min.json.gz');
    const compressedData = fs.readFileSync(filePath);
    
    // Convert Buffer to Uint8Array for pako
    const uint8Array = new Uint8Array(compressedData);
    
    // Decompress the data
    console.log('Decompressing data...');
    const decompressedData = pako.inflate(uint8Array, { to: 'string' });
    
    // Parse the JSON
    console.log('Parsing JSON...');
    const data = JSON.parse(decompressedData);
    
    // Store metadata
    console.log('Storing metadata...');
    const { error: metaError } = await supabase.from("midi_database_meta").upsert({
      id: 1,
      version: data.version,
      generated_at: data.generatedAt,
    });
    
    if (metaError) {
      console.error('Failed to insert metadata:', metaError);
      throw new Error(`Failed to insert metadata: ${metaError.message}`);
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
          midi_thru: deviceData.midi_thru,
          midi_in: deviceData.midi_in,
          midi_clock: deviceData.midi_clock,
          phantom_power: deviceData.phantom_power,
          midi_channel: deviceData.midi_channel,
          instructions: deviceData.instructions,
        });

        // Process CC parameters
        if (deviceData.cc && deviceData.cc.length > 0) {
          deviceData.cc.forEach((param, index) => {
            ccParams.push({
              id: `${deviceId}_cc_${index}`,
              device_id: deviceId,
              name: param.name,
              description: param.description,
              usage: param.usage,
              curve: param.curve,
              value: param.value,
              min: param.min,
              max: param.max,
              type: param.type,
            });
          });
        }

        // Process NRPN parameters
        if (deviceData.nrpn && deviceData.nrpn.length > 0) {
          deviceData.nrpn.forEach((param, index) => {
            nrpnParams.push({
              id: `${deviceId}_nrpn_${index}`,
              device_id: deviceId,
              name: param.name,
              description: param.description,
              usage: param.usage,
              curve: param.curve,
              msb: param.msb,
              lsb: param.lsb,
              min: param.min,
              max: param.max,
              type: param.type,
            });
          });
        }

        // Process PC parameters
        if (deviceData.pc && deviceData.pc.length > 0) {
          deviceData.pc.forEach((param, index) => {
            pcParams.push({
              id: `${deviceId}_pc_${index}`,
              device_id: deviceId,
              name: param.name,
              description: param.description,
              usage: param.usage,
              curve: param.curve,
              value: param.value,
              min: param.min,
              max: param.max,
              type: param.type,
            });
          });
        }
      });

      manufacturers.push({
        name: brandName,
        device_count: deviceCount,
      });
    });

    // Insert data in batches
    console.log(`Inserting ${manufacturers.length} manufacturers...`);
    const { error: mfgError } = await supabase.from("manufacturers").upsert(manufacturers);
    if (mfgError) {
      console.error('Failed to insert manufacturers:', mfgError);
      throw new Error(`Failed to insert manufacturers: ${mfgError.message}`);
    }

    // Insert devices in batches of 100
    console.log(`Inserting ${devices.length} devices...`);
    for (let i = 0; i < devices.length; i += 100) {
      const batch = devices.slice(i, i + 100);
      const { error: devError } = await supabase.from("devices").upsert(batch);
      if (devError) {
        console.error(`Failed to insert devices batch ${i + 1} to ${Math.min(i + 100, devices.length)}:`, devError);
        throw new Error(`Failed to insert devices: ${devError.message}`);
      }
      console.log(`Inserted devices ${i + 1} to ${Math.min(i + 100, devices.length)}`);
    }

    // Insert CC parameters in batches of 100
    console.log(`Inserting ${ccParams.length} CC parameters...`);
    for (let i = 0; i < ccParams.length; i += 100) {
      const batch = ccParams.slice(i, i + 100);
      const { error: ccError } = await supabase.from("device_cc").upsert(batch);
      if (ccError) {
        console.error(`Failed to insert CC parameters batch ${i + 1} to ${Math.min(i + 100, ccParams.length)}:`, ccError);
        throw new Error(`Failed to insert CC parameters: ${ccError.message}`);
      }
      console.log(`Inserted CC parameters ${i + 1} to ${Math.min(i + 100, ccParams.length)}`);
    }

    // Insert NRPN parameters in batches of 100
    console.log(`Inserting ${nrpnParams.length} NRPN parameters...`);
    for (let i = 0; i < nrpnParams.length; i += 100) {
      const batch = nrpnParams.slice(i, i + 100);
      const { error: nrpnError } = await supabase.from("device_nrpn").upsert(batch);
      if (nrpnError) {
        console.error(`Failed to insert NRPN parameters batch ${i + 1} to ${Math.min(i + 100, nrpnParams.length)}:`, nrpnError);
        throw new Error(`Failed to insert NRPN parameters: ${nrpnError.message}`);
      }
      console.log(`Inserted NRPN parameters ${i + 1} to ${Math.min(i + 100, nrpnParams.length)}`);
    }

    // Insert PC parameters in batches of 100
    console.log(`Inserting ${pcParams.length} PC parameters...`);
    for (let i = 0; i < pcParams.length; i += 100) {
      const batch = pcParams.slice(i, i + 100);
      if (batch.length > 0) {
        const { error: pcError } = await supabase.from("device_pc").upsert(batch);
        if (pcError) {
          console.error(`Failed to insert PC parameters batch ${i + 1} to ${Math.min(i + 100, pcParams.length)}:`, pcError);
          throw new Error(`Failed to insert PC parameters: ${pcError.message}`);
        }
        console.log(`Inserted PC parameters ${i + 1} to ${Math.min(i + 100, pcParams.length)}`);
      }
    }

    // Verify data was inserted
    console.log('Verifying data insertion...');
    const { data: mfgCount, error: mfgCountError } = await supabase.from('manufacturers').select('*', { count: 'exact', head: true });
    if (mfgCountError) {
      console.error('Failed to verify manufacturers count:', mfgCountError);
    } else {
      console.log('Manufacturers count:', mfgCount.count);
    }
