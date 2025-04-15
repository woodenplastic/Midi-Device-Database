# MIDI Database CSV Files

These CSV files were generated from the MIDI device database JSON.

## Files

- `midi_database_meta.csv`: Database metadata (version and generation date)
- `manufacturers.csv`: List of manufacturers with device counts
- `devices.csv`: Device information
- `device_cc.csv`: CC parameters for devices
- `device_nrpn.csv`: NRPN parameters for devices
- `device_pc.csv`: PC parameters for devices (if any)

## Import Instructions

To import these files into Supabase:

1. Go to your Supabase project dashboard
2. Navigate to the Table Editor
3. For each table:
   - Select the table
   - Click "Import Data"
   - Upload the corresponding CSV file
   - Follow the prompts to map columns

## Statistics

- Manufacturers: 161
- Devices: 644
- CC Parameters: 29566
- NRPN Parameters: 1994
- PC Parameters: 0

Generated on: 2025-04-15T18:36:30.912Z
