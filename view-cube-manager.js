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

      // Append to DOM first (required for web component to fully initialize)
      document.body.appendChild(this.viewCube);
      console.log('ViewCube appended to DOM');

      // Style the ViewCube for positioning in bottom-left corner
      this.viewCube.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 120px;
        height: 120px;
        z-index: 100;
      `;
      console.log('ViewCube styled with fixed positioning');

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

    // Add click handlers for each face via custom events
    const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    for (const face of faceNames) {
      this.viewCube.addEventListener(face, () => {
        console.log(`Face event received: ${face}`);
        this.navigateToView(face);
      });
    }

    // Add manual click handler as fallback for cases where web component
    // internal click handlers don't work properly
    // Use capture phase to intercept clicks before canvas/container captures them
    this.viewCube.addEventListener('click', (event) => {
      // Check if click is within ViewCube bounds
      const rect = this.viewCube.getBoundingClientRect();
      const isWithinBounds =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (isWithinBounds) {
        console.log('ViewCube click detected, attempting to determine face...');
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Estimate which face was clicked based on position
        // The cube is 120x120, so divide it into regions
        const clickFace = this.determineFaceFromClick(x, y, rect.width, rect.height);

        if (clickFace) {
          console.log(`Determined face from click: ${clickFace}`);
          // Prevent the event from propagating to other handlers (canvas, etc.)
          event.stopPropagation();
          event.preventDefault();

          // Dispatch the appropriate face event
          const faceEvent = new CustomEvent(clickFace, { bubbles: true });
          this.viewCube.dispatchEvent(faceEvent);
        }
      }
    }, true); // Use capture phase to intercept early

    // Also add a document-level capture handler to ensure we catch clicks
    // even if they're captured by other elements first
    const handleDocumentClick = (event) => {
      const rect = this.viewCube.getBoundingClientRect();
      const isWithinBounds =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      // Trigger for any click within ViewCube bounds (including when event.target IS the viewCube)
      if (isWithinBounds) {
        console.log('Document-level capture: ViewCube click detected at:', {
          x: event.clientX,
          y: event.clientY,
          target: event.target?.tagName || 'unknown'
        });
        event.stopPropagation();
        event.preventDefault();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const clickFace = this.determineFaceFromClick(x, y, rect.width, rect.height);

        if (clickFace) {
          console.log(`Document capture determined face: ${clickFace}`);
          const faceEvent = new CustomEvent(clickFace, { bubbles: true });
          this.viewCube.dispatchEvent(faceEvent);
        }
      }
    };

    // Add document-level listener in capture phase for click events
    document.addEventListener('click', handleDocumentClick, true);

    // ALSO add listeners for pointer events which might be triggered before click
    const handlePointerEvent = (event) => {
      // Only process on pointer up to match click behavior
      if (event.type === 'pointerup' || event.type === 'pointerdown') {
        // Don't stop propagation for pointer events to avoid interfering with other handlers
        const rect = this.viewCube.getBoundingClientRect();
        const isWithinBounds =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (isWithinBounds && event.type === 'pointerup') {
          console.log('Pointer event: ViewCube area detected');
          // Don't prevent default for pointer - just log for now
        }
      }
    };

    // Add pointer event listeners in capture phase as backup
    document.addEventListener('pointerdown', handlePointerEvent, true);
    document.addEventListener('pointerup', handlePointerEvent, true);

    // Also add mousedown/mouseup as additional fallback
    const handleMouseEvent = (event) => {
      if (event.type === 'mouseup') {
        const rect = this.viewCube.getBoundingClientRect();
        const isWithinBounds =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (isWithinBounds) {
          console.log('Mouse event: ViewCube area detected, dispatching click...');
          // Manually trigger the click handler logic
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const clickFace = this.determineFaceFromClick(x, y, rect.width, rect.height);

          if (clickFace) {
            console.log(`Mouse event determined face: ${clickFace}`);
            event.stopPropagation();
            event.preventDefault();

            const faceEvent = new CustomEvent(clickFace, { bubbles: true });
            this.viewCube.dispatchEvent(faceEvent);
          }
        }
      }
    };

    document.addEventListener('mouseup', handleMouseEvent, true);
    document.addEventListener('mousedown', handleMouseEvent, true);

    console.log('ViewCube event listeners attached (including capture phase + pointer/mouse events)');
  }

  // Determine which face was clicked based on click coordinates
  determineFaceFromClick(clickX, clickY, width, height) {
    // Map 2D ViewCube clicks to 6 cube faces
    // Strategy: Divide into regions based on proximity to edges and center

    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate distances from center
    const dx = clickX - centerX;
    const dy = clickY - centerY;

    // Use 30% threshold for edge regions
    const edgeThreshold = width * 0.3;

    // Determine if we're in an edge region or center
    const isTopEdge = clickY < edgeThreshold;
    const isBottomEdge = clickY > (height - edgeThreshold);
    const isLeftEdge = clickX < edgeThreshold;
    const isRightEdge = clickX > (width - edgeThreshold);

    // Priority order: corners and edges first, then center regions

    // Top edge takes priority
    if (isTopEdge && !isLeftEdge && !isRightEdge) {
      return 'top';
    }

    // Bottom edge takes priority
    if (isBottomEdge && !isLeftEdge && !isRightEdge) {
      return 'bottom';
    }

    // Left edge
    if (isLeftEdge && !isTopEdge && !isBottomEdge) {
      return 'left';
    }

    // Right edge
    if (isRightEdge && !isTopEdge && !isBottomEdge) {
      return 'right';
    }

    // Corners: map to back view (since back face isn't directly visible)
    if ((isTopEdge && isLeftEdge) || (isTopEdge && isRightEdge) ||
        (isBottomEdge && isLeftEdge) || (isBottomEdge && isRightEdge)) {
      return 'back';
    }

    // Center region - determine based on which direction is dominant
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      // Horizontal dominance
      return dx < 0 ? 'left' : 'right';
    } else if (absDy > width * 0.1) {
      // Vertical dominance (with small deadzone)
      return dy < 0 ? 'top' : 'bottom';
    } else {
      // Very center - front face
      return 'front';
    }
  }

  // Navigate to a specific view
  async navigateToView(viewName) {
    if (!this.cameraControls) {
      console.warn('Camera controls not available');
      return false;
    }

    try {
      console.log(`Navigating to ${viewName} view`);

      // Map ViewCube face names to camera orientation codes
      // This uses the same logic as the orientation buttons in Camera Controls
      const orientationMap = {
        front: 'f',
        back: 'b',
        left: 'l',
        right: 'r',
        top: 't',
        bottom: 'd', // 'd' for down/bottom
      };

      const orientationCode = orientationMap[viewName];
      if (!orientationCode) {
        console.warn(`Unknown view: ${viewName}`);
        return false;
      }

      // Use the same setOrientation method as the Camera Controls buttons
      const success = await this.cameraControls.setOrientation(orientationCode);

      if (success) {
        console.log(`${viewName} view applied via orientation: ${orientationCode}`);
      } else {
        console.warn(`Failed to set ${viewName} view`);
      }

      return success;
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
          try {
            // Only compute bounding box if geometry has position attribute
            if (object.geometry.attributes && object.geometry.attributes.position) {
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
          } catch (err) {
            // Silently skip objects with invalid geometries
            // This is expected for UI elements and empty geometries
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
      // Silently return null - this is expected when scene has no valid geometries
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
