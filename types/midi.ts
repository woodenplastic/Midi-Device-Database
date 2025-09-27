export interface MidiParameter {
  name: string;
  description: string;
  usage: string;
  curve: 'Toggle' | '0-based' | '1-based' | 'Centered';
  value?: number;
  msb?: number;
  lsb?: number;
  min: number;
  max: number;
  type: string;
  icon_number: number | null;
}

export interface MidiChannel {
  instructions: string;
}

export interface MidiDevice {
  midi_thru: boolean | string;
  midi_in: string;
  midi_clock: boolean | string;
  phantom_power: string;
  midi_channel: MidiChannel;
  instructions: string;
  cc: MidiParameter[];
  nrpn: MidiParameter[];
  pc: MidiParameter[];
}

export interface MidiDatabase {
  [brand: string]: {
    [device: string]: MidiDevice;
  };
}