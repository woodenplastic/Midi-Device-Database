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

  const updateDeviceInfo = (field: string, value: any) => {
    if (!selectedBrand || !selectedDevice) return

    const updatedDatabase = { ...database }
    const device = updatedDatabase[selectedBrand][selectedDevice]
    
    if (field === 'midi_channel_instructions') {
      device.midi_channel.instructions = value
    } else {
      (device as any)[field] = value
    }
    
    onSave(updatedDatabase)
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

  const renderDeviceInfoEditor = () => {
    if (!selectedBrand || !selectedDevice) return null
    
    const device = database[selectedBrand][selectedDevice]
    
    return (
      <div style={{ 
        color: 'var(--text-color)', 
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: 'clamp(12px, 3vw, 20px)',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>Device Information</h3>
        
        <div className="device-info-grid">
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              MIDI Thru:
            </label>
            <select
              value={device.midi_thru?.toString() || ''}
              onChange={(e) => updateDeviceInfo('midi_thru', e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value)}
              style={{
                width: '100%',
                padding: '12px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Not specified</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              MIDI Input:
            </label>
            <input
              type="text"
              value={device.midi_in || ''}
              onChange={(e) => updateDeviceInfo('midi_in', e.target.value)}
              placeholder="e.g., TRS, DIN, USB"
              style={{
                width: '100%',
                padding: '12px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              MIDI Clock:
            </label>
            <select
              value={device.midi_clock?.toString() || ''}
              onChange={(e) => updateDeviceInfo('midi_clock', e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value)}
              style={{
                width: '100%',
                padding: '12px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Not specified</option>
              <option value="true">Supported</option>
              <option value="false">Not supported</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              Phantom Power:
            </label>
            <input
              type="text"
              value={device.phantom_power || ''}
              onChange={(e) => updateDeviceInfo('phantom_power', e.target.value)}
              placeholder="e.g., None, Required, Optional"
              style={{
                width: '100%',
                padding: '12px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            MIDI Channel Setup Instructions:
          </label>
          <textarea
            value={device.midi_channel?.instructions || ''}
            onChange={(e) => updateDeviceInfo('midi_channel_instructions', e.target.value)}
            placeholder="Step by step instructions for setting MIDI channel..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            General Instructions:
          </label>
          <textarea
            value={device.instructions || ''}
            onChange={(e) => updateDeviceInfo('instructions', e.target.value)}
            placeholder="General device instructions..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
          />
        </div>
      </div>
    )
  }

  const renderParameterList = (type: 'cc' | 'nrpn' | 'pc', parameters: MidiParameter[]) => {
    const filteredParams = parameters.filter(param =>
      param.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>
          {type.toUpperCase()} Parameters ({filteredParams.length})
        </h4>
        {filteredParams.map((param, index) => {
          const originalIndex = parameters.findIndex(p => p === param)
          return (
            <div key={originalIndex} className="parameter-item" style={{
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div className="parameter-grid">
                {/* Name and Description */}
                <div className="parameter-full-width">
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Parameter Name:
                  </label>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => updateParameter(type, originalIndex, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}
                  />
                  
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Description:
                  </label>
                  <textarea
                    value={param.description}
                    onChange={(e) => updateParameter(type, originalIndex, 'description', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Parameter description..."
                  />
                </div>

                {/* Usage */}
                <div className="parameter-full-width">
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Usage:
                  </label>
                  <textarea
                    value={param.usage}
                    onChange={(e) => updateParameter(type, originalIndex, 'usage', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Usage instructions..."
                  />
                </div>

                {/* CC Value / NRPN MSB/LSB / PC Value */}
                {type === 'cc' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      CC Number:
                    </label>
                    <input
                      type="number"
                      value={param.value || ''}
                      onChange={(e) => updateParameter(type, originalIndex, 'value', parseInt(e.target.value) || 0)}
                      min="0"
                      max="127"
                      style={{
                        width: '100%',
                        padding: '12px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {type === 'nrpn' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        MSB:
                      </label>
                      <input
                        type="number"
                        value={param.msb || ''}
                        onChange={(e) => updateParameter(type, originalIndex, 'msb', parseInt(e.target.value) || 0)}
                        min="0"
                        max="127"
                        style={{
                          width: '100%',
                          padding: '12px 8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        LSB:
                      </label>
                      <input
                        type="number"
                        value={param.lsb || ''}
                        onChange={(e) => updateParameter(type, originalIndex, 'lsb', parseInt(e.target.value) || 0)}
                        min="0"
                        max="127"
                        style={{
                          width: '100%',
                          padding: '12px 8px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </>
                )}

                {type === 'pc' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      PC Number:
                    </label>
                    <input
                      type="number"
                      value={param.value || ''}
                      onChange={(e) => updateParameter(type, originalIndex, 'value', parseInt(e.target.value) || 0)}
                      min="0"
                      max="127"
                      style={{
                        width: '100%',
                        padding: '12px 8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}

                {/* Min/Max Range */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Min Value:
                  </label>
                  <input
                    type="number"
                    value={param.min}
                    onChange={(e) => updateParameter(type, originalIndex, 'min', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Max Value:
                  </label>
                  <input
                    type="number"
                    value={param.max}
                    onChange={(e) => updateParameter(type, originalIndex, 'max', parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Curve */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Curve:
                  </label>
                  <select
                    value={param.curve}
                    onChange={(e) => updateParameter(type, originalIndex, 'curve', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Toggle">Toggle</option>
                    <option value="0-based">0-based</option>
                    <option value="1-based">1-based</option>
                    <option value="Centered">Centered</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Type:
                  </label>
                  <input
                    type="text"
                    value={param.type}
                    onChange={(e) => updateParameter(type, originalIndex, 'type', e.target.value)}
                    placeholder="Parameter, System, Scene, etc."
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Icon Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Icon Number:
                  </label>
                  <input
                    type="number"
                    value={param.icon_number || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value)
                      updateParameter(type, originalIndex, 'icon_number', value)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Icon number"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="selector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
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
              padding: '12px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px'
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
              padding: '12px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px',
              opacity: !selectedBrand ? 0.6 : 1
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
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            {deviceIcon && (
              <div style={{ 
                width: '64px', 
                height: '64px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
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
              <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                {selectedBrand} - {selectedDevice}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-color)' }}>
                {deviceIcon ? `Icon: ${deviceIcon}` : 'No icon available'}
              </p>
              {!deviceIcon && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-color)' }}>
                  Upload SVG as: {selectedBrand.toLowerCase()}_{selectedDevice.toLowerCase().replace(/\s+/g, '-')}.svg
                </p>
              )}
            </div>
          </div>

          {/* Device Information Editor */}
          {renderDeviceInfoEditor()}

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
                padding: '12px 8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', scrollbarColor: 'var(--border-color)', scrollbarWidth: 'thin', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
            {database[selectedBrand][selectedDevice].cc.length > 0 && 
              renderParameterList('cc', database[selectedBrand][selectedDevice].cc)}
            
            {database[selectedBrand][selectedDevice].nrpn.length > 0 && 
              renderParameterList('nrpn', database[selectedBrand][selectedDevice].nrpn)}
            
            {database[selectedBrand][selectedDevice].pc.length > 0 && 
              renderParameterList('pc', database[selectedBrand][selectedDevice].pc)}
            
            {database[selectedBrand][selectedDevice].cc.length === 0 && 
             database[selectedBrand][selectedDevice].nrpn.length === 0 && 
             database[selectedBrand][selectedDevice].pc.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>No parameters found for this device.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}