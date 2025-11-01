import * as THREE from 'three';
import * as OBCFront from '@thatopen/components-front';

export class LengthMeasurementManager {
  constructor(components, world, container) {
    this.components = components;
    this.world = world;
    this.container = container;
    this.measurer = null;
    this.measurerReady = false;
    this.enabled = false;
  }

  init() {
    console.log('Initializing Length Measurement...');

    try {
      // Get the LengthMeasurement component from the front module
      const LengthMeasurement = OBCFront.LengthMeasurement;

      if (!LengthMeasurement) {
        console.warn('LengthMeasurement not found in OBCFront');
        console.warn('Available components:', Object.keys(OBCFront).slice(0, 20));
        return false;
      }

      // Create the measurer instance
      this.measurer = new LengthMeasurement(this.components);
      this.measurer.world = this.world;
      this.measurer.enabled = false; // Start disabled
      this.measurer.color.set(0x494cb6); // Set measurement color

      // Setup double-click to create measurements
      if (this.container) {
        this.container.ondblclick = () => this.create();
      } else {
        // Fallback to canvas element
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.addEventListener('dblclick', () => this.create());
        }
      }

      // Setup keyboard shortcuts
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));

      this.measurerReady = true;
      console.log('Length Measurement initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Length Measurement:', error.message);
      this.measurerReady = false;
      return false;
    }
  }

  create() {
    if (!this.measurer || !this.enabled) return;

    try {
      this.measurer.create();
      console.log('Length measurement created');
    } catch (error) {
      console.error('Error creating measurement:', error);
    }
  }

  handleKeyPress(event) {
    if (!this.measurer || !this.enabled) return;

    // Delete measurement on Delete or Backspace
    if (event.key === 'Delete' || event.key === 'Backspace') {
      try {
        this.measurer.delete();
        console.log('Measurement deleted');
      } catch (error) {
        console.warn('Could not delete measurement:', error);
      }
    }

    // Enter to complete measurement
    if (event.key === 'Enter') {
      try {
        this.measurer.endCreation();
        console.log('Measurement completed');
      } catch (error) {
        console.warn('Could not complete measurement:', error);
      }
    }
  }

  // Toggle measurement tool on/off
  toggle(enabled) {
    if (!this.measurer) {
      console.warn('Length measurement not initialized');
      return false;
    }

    this.enabled = enabled;
    this.measurer.enabled = enabled;
    console.log('Length Measurement:', enabled ? 'enabled' : 'disabled');
    return true;
  }

  // Set measurement color
  setColor(color) {
    if (!this.measurer) {
      console.warn('Measurer not initialized');
      return false;
    }

    try {
      this.measurer.color.setStyle(color);
      console.log('Measurement color changed to:', color);
      return true;
    } catch (error) {
      console.error('Error setting measurement color:', error);
      return false;
    }
  }

  // Clear all measurements
  clearAll() {
    if (!this.measurer) {
      console.warn('Measurer not ready');
      return false;
    }

    try {
      this.measurer.deleteAll();
      console.log('All measurements cleared');
      return true;
    } catch (error) {
      console.error('Error clearing measurements:', error);
      return false;
    }
  }

  // Get measurements list
  getMeasurements() {
    if (!this.measurer) return [];

    try {
      return Array.from(this.measurer.list.values());
    } catch (error) {
      console.warn('Could not get measurements:', error);
      return [];
    }
  }

  // Get measurement info
  getInfo() {
    return {
      ready: this.measurerReady,
      enabled: this.enabled,
      count: this.getMeasurements().length,
    };
  }
}
