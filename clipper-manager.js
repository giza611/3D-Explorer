import * as OBC from '@thatopen/components';
import * as THREE from 'three';

export class ClipperManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.clipper = null;
    this.clipperReady = false;
  }

  init() {
    console.log('Initializing Clipper Manager...');

    try {
      // Get the Clipper component
      this.clipper = this.components.get(OBC.Clipper);

      if (!this.clipper) {
        console.warn('Clipper component not found');
        return false;
      }

      // Clipper is disabled by default
      this.clipper.enabled = false;

      // Set up default configuration
      this.clipper.config.color = new THREE.Color(0xff0000); // Red
      this.clipper.config.opacity = 0.2;
      this.clipper.config.size = 5;
      this.clipper.config.visible = true;

      this.clipperReady = true;
      console.log('Clipper Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Clipper Manager:', error);
      return false;
    }
  }

  // Enable/disable clipper
  setEnabled(enabled) {
    try {
      if (!this.clipper) {
        console.warn('Clipper not initialized');
        return false;
      }

      this.clipper.enabled = enabled;
      console.log('Clipper enabled:', enabled);
      return true;
    } catch (error) {
      console.error('Error toggling clipper:', error);
      return false;
    }
  }

  // Check if clipper is enabled
  isEnabled() {
    return this.clipper ? this.clipper.enabled : false;
  }

  // Create a clipping plane at raycasted intersection
  async createClippingPlane() {
    try {
      if (!this.clipper || !this.clipper.enabled) {
        console.warn('Clipper not ready or not enabled');
        return false;
      }

      // Create clipping plane at the raycasted intersection point
      this.clipper.create(this.world);
      console.log('Clipping plane created');
      return true;
    } catch (error) {
      console.error('Error creating clipping plane:', error);
      return false;
    }
  }

  // Delete a specific clipping plane (the one under mouse cursor)
  deleteClippingPlane() {
    try {
      if (!this.clipper) {
        console.warn('Clipper not initialized');
        return false;
      }

      this.clipper.delete(this.world);
      console.log('Clipping plane deleted');
      return true;
    } catch (error) {
      console.error('Error deleting clipping plane:', error);
      return false;
    }
  }

  // Delete all clipping planes
  deleteAllClippingPlanes() {
    try {
      if (!this.clipper) {
        console.warn('Clipper not initialized');
        return false;
      }

      this.clipper.deleteAll();
      console.log('All clipping planes deleted');
      return true;
    } catch (error) {
      console.error('Error deleting all clipping planes:', error);
      return false;
    }
  }

  // Toggle visibility of all clipping planes
  togglePlaneVisibility() {
    try {
      if (!this.clipper || !this.clipper.list) {
        console.warn('No clipping planes to toggle');
        return false;
      }

      for (const plane of this.clipper.list) {
        plane.visible = !plane.visible;
      }

      console.log('Clipping planes visibility toggled');
      return true;
    } catch (error) {
      console.error('Error toggling plane visibility:', error);
      return false;
    }
  }

  // Toggle the enabled state of all clipping planes
  toggleClippings() {
    try {
      if (!this.clipper || !this.clipper.list) {
        console.warn('No clipping planes to toggle');
        return false;
      }

      for (const [, clipping] of this.clipper.list) {
        clipping.enabled = !clipping.enabled;
      }

      console.log('Clipping planes toggled');
      return true;
    } catch (error) {
      console.error('Error toggling clippings:', error);
      return false;
    }
  }

  // Set clipping plane color
  setPlaneColor(colorHex) {
    try {
      if (!this.clipper || !this.clipper.config) {
        console.warn('Clipper not initialized');
        return false;
      }

      this.clipper.config.color = new THREE.Color(colorHex);
      console.log('Clipping plane color set to:', colorHex);
      return true;
    } catch (error) {
      console.error('Error setting plane color:', error);
      return false;
    }
  }

  // Set plane opacity
  setPlaneOpacity(opacity) {
    try {
      if (!this.clipper || !this.clipper.config) {
        console.warn('Clipper not initialized');
        return false;
      }

      // Clamp opacity between 0.1 and 1.0
      const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity));
      this.clipper.config.opacity = clampedOpacity;
      console.log('Clipping plane opacity set to:', clampedOpacity);
      return true;
    } catch (error) {
      console.error('Error setting plane opacity:', error);
      return false;
    }
  }

  // Set plane size
  setPlaneSize(size) {
    try {
      if (!this.clipper || !this.clipper.config) {
        console.warn('Clipper not initialized');
        return false;
      }

      // Clamp size between 2 and 10
      const clampedSize = Math.max(2, Math.min(10, size));
      this.clipper.config.size = clampedSize;
      console.log('Clipping plane size set to:', clampedSize);
      return true;
    } catch (error) {
      console.error('Error setting plane size:', error);
      return false;
    }
  }

  // Toggle plane visibility in config
  setPlaneVisibleInConfig(visible) {
    try {
      if (!this.clipper || !this.clipper.config) {
        console.warn('Clipper not initialized');
        return false;
      }

      this.clipper.config.visible = visible;
      console.log('Clipping plane visibility config set to:', visible);
      return true;
    } catch (error) {
      console.error('Error setting plane visibility config:', error);
      return false;
    }
  }

  // Get number of clipping planes
  getPlaneCount() {
    try {
      return this.clipper && this.clipper.list ? this.clipper.list.size : 0;
    } catch (error) {
      console.error('Error getting plane count:', error);
      return 0;
    }
  }

  // Get current clipper configuration
  getConfig() {
    try {
      if (!this.clipper || !this.clipper.config) {
        return null;
      }

      return {
        enabled: this.clipper.enabled,
        color: this.clipper.config.color ? this.clipper.config.color.getHexString() : '#ff0000',
        opacity: this.clipper.config.opacity,
        size: this.clipper.config.size,
        visible: this.clipper.config.visible,
        planeCount: this.getPlaneCount(),
      };
    } catch (error) {
      console.error('Error getting clipper config:', error);
      return null;
    }
  }
}
