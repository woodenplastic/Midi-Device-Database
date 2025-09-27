'use client'

import React, { useState, useEffect } from 'react'
import { MidiDatabase, MidiParameter } from '../types/midi'

interface DeviceEditorProps {
  database: MidiDatabase
  onSave: (database: MidiDatabase) => void
}

export default function DeviceEditor({ database, onSave }: DeviceEditorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [deviceIcon, setDeviceIcon] = useState<string | null>(null)

  const brands = Object.keys(database).filter(key => 
    !['version', 'generatedAt', 'sourceFile', 'fileSizes'].includes(key) &&
    typeof database[key] === 'object' && 
    database[key] !== null &&
    !Array.isArray(database[key])
  )
  const devices = selectedBrand ? Object.keys(database[selectedBrand] || {}) : []

  // Check for device icon when brand/device selection changes
  useEffect(() => {
    if (selectedBrand && selectedDevice) {
      checkForDeviceIcon()
    } else {
      setDeviceIcon(null)
    }
  }, [selectedBrand, selectedDevice])

  const checkForDeviceIcon = async () => {
    if (!selectedBrand || !selectedDevice) return
    
    // Create filename in format: manufacturer_devicename.svg (all lowercase)
    const iconFilename = `${selectedBrand.toLowerCase()}_${selectedDevice.toLowerCase().replace(/\s+/g, '-')}.svg`
    
    try {
      const response = await fetch(`/api/download-svg/${iconFilename}`)
      if (response.ok) {
        setDeviceIcon(iconFilename)
      } else {
        setDeviceIcon(null)
      }
    } catch (error) {
      setDeviceIcon(null)
    }
  }

  const updateParameter = (
    type: 'cc' | 'nrpn' | 'pc',
    index: number,
    field: keyof MidiParameter,
    value: any
  ) => {
    if (!selectedBrand || !selectedDevice) return

    const updatedDatabase = { ...database }
    const device = updatedDatabase[selectedBrand][selectedDevice]
    
    if (device[type] && device[type][index]) {
      (device[type][index] as any)[field] = value
      onSave(updatedDatabase)
    }
  }

  const renderParameterList = (type: 'cc' | 'nrpn' | 'pc', parameters: MidiParameter[]) => {
    const filteredParams = parameters.filter(param =>
      param.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#374151', marginBottom: '10px' }}>
          {type.toUpperCase()} Parameters ({filteredParams.length})
        </h4>
        {filteredParams.map((param, index) => (
          <div key={index} className="parameter-item" style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <strong>{param.name}</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                  {param.description}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  Icon Number:
                </label>
                <input
                  type="number"
                  value={param.icon_number || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value)
                    updateParameter(type, index, 'icon_number', value)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter icon number"
                />
              </div>
              <div>
                <strong>Type:</strong> {param.type}<br />
                <strong>Range:</strong> {param.min}-{param.max}<br />
                <strong>Curve:</strong> {param.curve}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Select Brand:
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value)
              setSelectedDevice('')
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            <option value="">Choose a brand...</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Select Device:
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            disabled={!selectedBrand}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            <option value="">Choose a device...</option>
            {devices.map(device => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedBrand && selectedDevice && (
        <>
          {/* Device Info Header with Icon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            marginBottom: '20px', 
            padding: '16px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            {deviceIcon && (
              <div style={{ 
                width: '64px', 
                height: '64px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <img
                  src={`/api/download-svg/${deviceIcon}`}
                  alt={`${selectedBrand} ${selectedDevice}`}
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>
                {selectedBrand} - {selectedDevice}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {deviceIcon ? `Icon: ${deviceIcon}` : 'No icon available'}
              </p>
              {!deviceIcon && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  Upload SVG as: {selectedBrand.toLowerCase()}_{selectedDevice.toLowerCase().replace(/\s+/g, '-')}.svg
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Search Parameters:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by parameter name..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            {database[selectedBrand][selectedDevice].cc.length > 0 && 
              renderParameterList('cc', database[selectedBrand][selectedDevice].cc)}
            
            {database[selectedBrand][selectedDevice].nrpn.length > 0 && 
              renderParameterList('nrpn', database[selectedBrand][selectedDevice].nrpn)}
            
            {database[selectedBrand][selectedDevice].pc.length > 0 && 
              renderParameterList('pc', database[selectedBrand][selectedDevice].pc)}
            
            {database[selectedBrand][selectedDevice].cc.length === 0 && 
             database[selectedBrand][selectedDevice].nrpn.length === 0 && 
             database[selectedBrand][selectedDevice].pc.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No parameters found for this device.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}