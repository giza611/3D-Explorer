import * as OBC from '@thatopen/components';
import * as OBCFront from '@thatopen/components-front';

export class AreaMeasurementManager {
  constructor(components, world, container) {
    this.components = components;
    this.world = world;
    this.container = container;
    this.measurer = null;
    this.enabled = false;
  }

  async init() {
    console.log('Initializing Area Measurement...');

    try {
      // Debug: Log all available components
      console.log('Available in OBCFront:', Object.keys(OBCFront).slice(0, 20));

      // Get the AreaMeasurement component from the front module
      const AreaMeasurement = OBCFront.AreaMeasurement;

      if (!AreaMeasurement) {
        console.warn('AreaMeasurement not found in OBCFront');
        console.warn('Full OBCFront keys:', Object.keys(OBCFront));
        return false;
      }

      // Create the measurer instance
      this.measurer = new AreaMeasurement(this.components);
      this.measurer.world = this.world;
      this.measurer.enabled = false; // Start disabled
      this.measurer.color.set(0x494cb6); // Set measurement color

      // Setup double-click to create measurements
      this.container.ondblclick = () => this.create();

      // Setup keyboard shortcuts
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));

      console.log('Area Measurement initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Area Measurement:', error.message);
      return false;
    }
  }

  create() {
    if (!this.measurer || !this.enabled) return;

    try {
      this.measurer.create();
      console.log('Area measurement created');
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

  toggle(enabled) {
    if (!this.measurer) return;

    this.enabled = enabled;
    this.measurer.enabled = enabled;
    console.log('Area Measurement:', enabled ? 'enabled' : 'disabled');
  }

  setColor(color) {
    if (!this.measurer) return;

    this.measurer.color.setStyle(color);
    console.log('Measurement color changed to:', color);
  }

  setUnits(units) {
    if (!this.measurer) return;

    try {
      this.measurer.units = units;
      console.log('Measurement units set to:', units);
    } catch (error) {
      console.warn('Could not set units:', error);
    }
  }

  setPrecision(decimals) {
    if (!this.measurer) return;

    try {
      this.measurer.precision = decimals;
      console.log('Measurement precision set to:', decimals);
    } catch (error) {
      console.warn('Could not set precision:', error);
    }
  }

  clearAll() {
    if (!this.measurer) return;

    try {
      this.measurer.deleteAll();
      console.log('All measurements cleared');
    } catch (error) {
      console.warn('Could not clear measurements:', error);
    }
  }

  getMeasurements() {
    if (!this.measurer) return [];

    try {
      return Array.from(this.measurer.list.values());
    } catch (error) {
      console.warn('Could not get measurements:', error);
      return [];
    }
  }
}
