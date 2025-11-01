import * as THREE from 'three';
import * as BUI from '@thatopen/ui';

export class ViewCubeManager {
  constructor(components, world, cameraControls) {
    this.components = components;
    this.world = world;
    this.cameraControls = cameraControls;
    this.viewCube = null;
    this.viewCubeReady = false;
  }

  init() {
    console.log('Initializing ViewCube...');

    try {
      // Create the ViewCube element directly using createElement
      this.viewCube = document.createElement('bim-view-cube');

      if (!this.viewCube) {
        console.warn('Could not create ViewCube element');
        return false;
      }

      // Set camera reference
      this.viewCube.camera = this.world.camera.three;
      console.log('ViewCube camera set');

      // Setup event listeners for ViewCube face clicks
      this.setupViewCubeEvents();

      // Update ViewCube orientation when camera moves
      if (this.world.camera.controls) {
        this.world.camera.controls.addEventListener('rest', () => {
          this.updateViewCubeOrientation();
        });
      }

      this.viewCubeReady = true;
      console.log('ViewCube initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize ViewCube:', error.message);
      console.error(error);
      this.viewCubeReady = false;
      return false;
    }
  }

  // Setup ViewCube face click events for navigation
  setupViewCubeEvents() {
    if (!this.viewCube) {
      console.warn('ViewCube not initialized');
      return;
    }

    // Define view positions for each cube face
    const viewPositions = {
      front: { x: 0, y: 0, z: 1 },
      back: { x: 0, y: 0, z: -1 },
      left: { x: -1, y: 0, z: 0 },
      right: { x: 1, y: 0, z: 0 },
      top: { x: 0, y: 1, z: 0 },
      bottom: { x: 0, y: -1, z: 0 },
    };

    // Add click handlers for each face
    const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    for (const face of faceNames) {
      this.viewCube.addEventListener(face, () => {
        this.navigateToView(face);
      });
    }

    console.log('ViewCube event listeners attached');
  }

  // Navigate to a specific view
  async navigateToView(viewName) {
    if (!this.cameraControls) {
      console.warn('Camera controls not available');
      return false;
    }

    try {
      console.log(`Navigating to ${viewName} view`);

      // Define camera positions for each view
      const viewConfigs = {
        front: { x: 0, y: 0, z: 1, lookX: 0, lookY: 0, lookZ: 0 },
        back: { x: 0, y: 0, z: -1, lookX: 0, lookY: 0, lookZ: 0 },
        left: { x: -1, y: 0, z: 0, lookX: 0, lookY: 0, lookZ: 0 },
        right: { x: 1, y: 0, z: 0, lookX: 0, lookY: 0, lookZ: 0 },
        top: { x: 0, y: 1, z: 0, lookX: 0, lookY: 0, lookZ: 0 },
        bottom: { x: 0, y: -1, z: 0, lookX: 0, lookY: 0, lookZ: 0 },
      };

      const config = viewConfigs[viewName];
      if (!config) {
        console.warn(`Unknown view: ${viewName}`);
        return false;
      }

      // Get bounding box to calculate distance
      const bbox = this.getBoundingBox();
      if (!bbox) {
        console.warn('Could not calculate bounding box for view');
        return false;
      }

      // Calculate camera distance based on model size
      const size = Math.max(
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y,
        bbox.max.z - bbox.min.z
      );
      const distance = size / 2 / Math.tan(Math.PI / 6); // 30 degree FOV

      const center = {
        x: (bbox.min.x + bbox.max.x) / 2,
        y: (bbox.min.y + bbox.max.y) / 2,
        z: (bbox.min.z + bbox.max.z) / 2,
      };

      // Calculate camera position
      const camX = center.x + config.x * distance;
      const camY = center.y + config.y * distance;
      const camZ = center.z + config.z * distance;

      // Use camera controls to set position
      if (
        this.cameraControls.fitToAll &&
        typeof this.cameraControls.fitToAll === 'function'
      ) {
        // Try to use fitToAll first
        await this.cameraControls.fitToAll(this.world.scene.three);
        console.log(`${viewName} view applied`);
      } else if (this.world.camera.controls && this.world.camera.controls.setLookAt) {
        // Fallback to direct camera positioning
        await this.world.camera.controls.setLookAt(
          camX,
          camY,
          camZ,
          center.x,
          center.y,
          center.z
        );
        console.log(`${viewName} view applied`);
      }

      return true;
    } catch (error) {
      console.error(`Error navigating to ${viewName} view:`, error);
      return false;
    }
  }

  // Get bounding box of all scene objects
  getBoundingBox() {
    try {
      if (!this.world || !this.world.scene || !this.world.scene.three) {
        return null;
      }

      const bbox = {
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity },
      };

      let hasObjects = false;

      // Traverse scene to find all geometries
      this.world.scene.three.traverse((object) => {
        if (object.geometry) {
          object.geometry.computeBoundingBox();
          const box = object.geometry.boundingBox;

          if (box) {
            // Transform by object's world matrix
            const worldPos = new THREE.Vector3();
            object.getWorldPosition(worldPos);

            bbox.min.x = Math.min(bbox.min.x, worldPos.x + box.min.x);
            bbox.min.y = Math.min(bbox.min.y, worldPos.y + box.min.y);
            bbox.min.z = Math.min(bbox.min.z, worldPos.z + box.min.z);
            bbox.max.x = Math.max(bbox.max.x, worldPos.x + box.max.x);
            bbox.max.y = Math.max(bbox.max.y, worldPos.y + box.max.y);
            bbox.max.z = Math.max(bbox.max.z, worldPos.z + box.max.z);

            hasObjects = true;
          }
        }
      });

      if (!hasObjects) {
        // Return default bounding box if no objects
        return {
          min: { x: -10, y: -10, z: -10 },
          max: { x: 10, y: 10, z: 10 },
        };
      }

      return bbox;
    } catch (error) {
      console.error('Error calculating bounding box:', error);
      return null;
    }
  }

  // Update ViewCube orientation based on camera
  updateViewCubeOrientation() {
    if (!this.viewCube || !this.world.camera.three) {
      return;
    }

    try {
      // Update the ViewCube to reflect current camera orientation
      if (this.viewCube.updateOrientation) {
        this.viewCube.updateOrientation();
      }
    } catch (error) {
      console.warn('Could not update ViewCube orientation:', error.message);
    }
  }

  // Get the ViewCube element for rendering
  getViewCubeElement() {
    return this.viewCube;
  }

  // Get info about ViewCube
  getInfo() {
    return {
      ready: this.viewCubeReady,
      element: this.viewCube,
    };
  }
}
