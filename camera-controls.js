import * as OBC from '@thatopen/components';

export class CameraControlsManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.camera = world.camera;
    this.projectionMode = 'Perspective';
    this.navigationMode = 'Orbit';
    this.boundingBoxer = null;
    this.boundingBoxerReady = false;
  }

  init() {
    console.log('Initializing Camera Controls...');

    try {
      // Verify camera has the required methods
      if (!this.camera.projection || !this.camera.set) {
        console.warn('Camera does not support projection switching or navigation modes');
        return false;
      }

      // Initialize BoundingBoxer for orientation support
      this.initializeBoundingBoxer();

      console.log('Camera Controls initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Camera Controls:', error);
      return false;
    }
  }

  // Initialize BoundingBoxer for camera orientation
  initializeBoundingBoxer() {
    try {
      this.boundingBoxer = this.components.get(OBC.BoundingBoxer);
      if (this.boundingBoxer) {
        this.boundingBoxerReady = true;
        console.log('BoundingBoxer initialized for camera orientation');
      }
    } catch (error) {
      console.warn('Could not initialize BoundingBoxer:', error);
      this.boundingBoxerReady = false;
    }
  }

  // Get camera position and target for a specific orientation
  async getCameraOrientation(orientation) {
    try {
      if (!this.boundingBoxer || !this.boundingBoxerReady) {
        console.warn('BoundingBoxer not ready for orientation');
        return null;
      }

      const { position, target } = await this.boundingBoxer.getCameraOrientation(orientation);
      console.log(`Camera orientation set to: ${orientation}`);
      return { position, target };
    } catch (error) {
      console.error('Error getting camera orientation:', error);
      return null;
    }
  }

  // Set camera to a specific orientation
  async setOrientation(orientation) {
    try {
      if (!this.camera.controls || !this.camera.controls.setLookAt) {
        console.warn('Camera controls not available for orientation');
        return false;
      }

      const orientationData = await this.getCameraOrientation(orientation);
      if (!orientationData) {
        return false;
      }

      const { position, target } = orientationData;
      await this.camera.controls.setLookAt(
        position.x,
        position.y,
        position.z,
        target.x,
        target.y,
        target.z,
        true // Enable smooth animation
      );

      console.log(`Camera set to ${orientation} view`);
      return true;
    } catch (error) {
      console.error('Error setting orientation:', error);
      return false;
    }
  }

  // Get available orientations
  getAvailableOrientations() {
    return ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];
  }

  // Get available projection modes
  getProjectionModes() {
    return ['Perspective', 'Orthographic'];
  }

  // Get available navigation modes
  getNavigationModes() {
    return ['Orbit', 'FirstPerson', 'Plan'];
  }

  // Switch projection mode
  setProjectionMode(mode) {
    try {
      if (!['Perspective', 'Orthographic'].includes(mode)) {
        console.warn('Invalid projection mode:', mode);
        return false;
      }

      // Prevent FirstPerson mode with Orthographic projection
      if (mode === 'Orthographic' && this.navigationMode === 'FirstPerson') {
        console.warn('Cannot use FirstPerson navigation with Orthographic projection');
        console.log('Switching navigation to Orbit');
        this.setNavigationMode('Orbit');
      }

      this.camera.projection.set(mode);
      this.projectionMode = mode;
      console.log('Projection mode set to:', mode);
      return true;
    } catch (error) {
      console.error('Error setting projection mode:', error);
      return false;
    }
  }

  // Switch navigation mode
  setNavigationMode(mode) {
    try {
      if (!['Orbit', 'FirstPerson', 'Plan'].includes(mode)) {
        console.warn('Invalid navigation mode:', mode);
        return false;
      }

      // Prevent FirstPerson with Orthographic projection
      if (mode === 'FirstPerson' && this.projectionMode === 'Orthographic') {
        console.warn('Cannot use FirstPerson with Orthographic projection');
        console.log('Switching projection to Perspective');
        this.setProjectionMode('Perspective');
      }

      this.camera.set(mode);
      this.navigationMode = mode;
      console.log('Navigation mode set to:', mode);
      return true;
    } catch (error) {
      console.error('Error setting navigation mode:', error);
      return false;
    }
  }

  // Toggle user input on/off
  setUserInput(enabled) {
    try {
      this.camera.setUserInput(enabled);
      console.log('User input:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.error('Error setting user input:', error);
      return false;
    }
  }

  // Fit camera to object (requires mesh or group)
  fitToObject(object) {
    try {
      if (!object) {
        console.warn('No object provided to fit camera to');
        return false;
      }

      this.camera.fit([object]);
      console.log('Camera fitted to object');
      return true;
    } catch (error) {
      console.error('Error fitting camera to object:', error);
      return false;
    }
  }

  // Fit camera to all visible meshes
  fitToAll(scene) {
    try {
      const meshes = [];
      scene.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child);
        }
      });

      if (meshes.length > 0) {
        // First, fit the camera to all meshes
        this.camera.fit(meshes);

        // Account for the split layout by adjusting camera position
        // The sidebar is 350px wide on the right, so center the view in the remaining space
        const viewportWidth = window.innerWidth - 350; // Subtract sidebar width
        const viewportHeight = window.innerHeight;
        const centerOffset = (window.innerWidth - viewportWidth) / 2; // Half of the sidebar width

        // Adjust camera to account for offset
        const camera = this.camera.three;
        const currentPos = camera.position.clone();

        // Calculate the shift needed to center within the reduced viewport
        const viewportCenterX = viewportWidth / 2; // Center of visible area
        const windowCenterX = window.innerWidth / 2; // Center of full window
        const pixelShift = viewportCenterX - windowCenterX; // Pixel difference

        // Scale this to world coordinates based on camera distance and FOV
        const vFOV = camera.fov * Math.PI / 180; // vertical field of view in radians
        const height = 2 * Math.tan(vFOV / 2) * camera.position.length();
        const width = height * camera.aspect;

        // World units per pixel
        const worldUnitsPerPixel = width / window.innerWidth;
        const worldShift = pixelShift * worldUnitsPerPixel;

        // Shift camera right to compensate for sidebar
        currentPos.x += worldShift * 0.5;
        camera.position.copy(currentPos);
        camera.updateProjectionMatrix();

        console.log('Camera fitted to all meshes and adjusted for layout');
        return true;
      } else {
        console.warn('No meshes found in scene');
        return false;
      }
    } catch (error) {
      console.error('Error fitting camera to scene:', error);
      return false;
    }
  }

  // Get current camera info
  getCameraInfo() {
    return {
      projection: this.projectionMode,
      navigation: this.navigationMode,
      position: this.camera.three.position.toArray(),
      direction: this.camera.three.getWorldDirection(new (require('three')).Vector3()).toArray(),
    };
  }

  // Reset camera to default view
  async resetView() {
    try {
      await this.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
      console.log('Camera reset to default view');
      return true;
    } catch (error) {
      console.error('Error resetting camera:', error);
      return false;
    }
  }
}
