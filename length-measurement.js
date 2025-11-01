import * as THREE from 'three';

export class LengthMeasurementManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.measurer = null;
    this.measurerReady = false;
    this.enabled = false;
  }

  init() {
    console.log('Initializing Length Measurement...');

    try {
      // Try to get LengthMeasurement component - it might be under different names
      let LengthMeasurementComponent = null;

      // Try different possible names/locations
      try {
        const OBF = require('@thatopen/fragments');
        if (OBF && OBF.LengthMeasurement) {
          LengthMeasurementComponent = OBF.LengthMeasurement;
        }
      } catch (e) {
        console.warn('Could not import from @thatopen/fragments:', e.message);
      }

      if (!LengthMeasurementComponent) {
        console.warn('LengthMeasurement component not available - feature disabled');
        this.measurerReady = false;
        return false;
      }

      this.measurer = this.components.get(LengthMeasurementComponent);

      if (!this.measurer) {
        console.warn('Could not instantiate LengthMeasurement component');
        return false;
      }

      // Configure the measurer
      this.measurer.world = this.world;

      try {
        this.measurer.color = new THREE.Color('#494cb6');
      } catch (e) {
        console.warn('Could not set measurement color:', e);
      }

      this.measurer.enabled = false;

      // Setup double-click handler for measurement creation
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.addEventListener('dblclick', (event) => {
            if (!this.enabled || !this.measurer) return;
            try {
              this.measurer.create();
            } catch (error) {
              console.warn('Error creating measurement:', error);
            }
          });
        }
      } catch (e) {
        console.warn('Could not setup double-click handler:', e);
      }

      // Setup Delete key handler for measurement removal
      try {
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Delete' && this.enabled && this.measurer) {
            try {
              this.measurer.delete();
            } catch (error) {
              console.warn('Error deleting measurement:', error);
            }
          }
        });
      } catch (e) {
        console.warn('Could not setup Delete key handler:', e);
      }

      this.measurerReady = true;
      console.log('Length Measurement initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Length Measurement:', error);
      this.measurerReady = false;
      return false;
    }
  }

  // Toggle measurement tool on/off
  toggle(enabled) {
    try {
      if (!this.measurerReady || !this.measurer) {
        console.warn('Length measurement not initialized');
        return false;
      }

      this.enabled = enabled;
      this.measurer.enabled = enabled;
      this.measurer.visible = enabled;

      if (enabled) {
        console.log('Length measurement enabled');
      } else {
        console.log('Length measurement disabled');
      }

      return true;
    } catch (error) {
      console.error('Error toggling measurement:', error);
      return false;
    }
  }

  // Set measurement color
  setColor(hexColor) {
    try {
      if (!this.measurer) {
        console.warn('Measurer not initialized');
        return false;
      }

      const color = new (require('three')).Color(hexColor);
      this.measurer.color = color;
      console.log('Measurement color set to:', hexColor);
      return true;
    } catch (error) {
      console.error('Error setting measurement color:', error);
      return false;
    }
  }

  // Clear all measurements
  clearAll() {
    try {
      if (!this.measurer || !this.measurer.list) {
        console.warn('Measurer not ready');
        return false;
      }

      this.measurer.list.clear();
      console.log('All measurements cleared');
      return true;
    } catch (error) {
      console.error('Error clearing measurements:', error);
      return false;
    }
  }

  // Get measurement count
  getCount() {
    try {
      if (!this.measurer || !this.measurer.list) {
        return 0;
      }
      return this.measurer.list.length || 0;
    } catch (error) {
      console.warn('Error getting measurement count:', error);
      return 0;
    }
  }

  // Get measurement info
  getInfo() {
    return {
      ready: this.measurerReady,
      enabled: this.enabled,
      count: this.getCount(),
    };
  }
}
