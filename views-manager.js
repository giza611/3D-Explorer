import * as OBC from '@thatopen/components';
import * as THREE from 'three';

export class ViewsManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.viewsComponent = null;
    this.savedViews = new Map(); // Store custom saved views
    this.customSections = new Map(); // Store custom section views created by raycasting
    this.currentViewName = null;
    this.raycaster = null;
    this.raycasterReady = false;
    this.sectionsEnabled = false; // Enable/disable section creation mode
    this.previousProjection = null; // Store previous projection to restore later
    this.previousNavigationMode = null; // Store previous navigation mode
  }

  init() {
    console.log('Initializing Views Manager...');

    try {
      // Get the Views component
      this.viewsComponent = this.components.get(OBC.Views);

      if (!this.viewsComponent) {
        console.warn('Views component not found');
        return false;
      }

      // Set the world for views
      this.viewsComponent.world = this.world;

      // Initialize raycaster for custom sections
      this.initializeRaycaster();

      console.log('Views Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Views Manager:', error);
      return false;
    }
  }

  // Initialize raycaster for creating arbitrary views
  initializeRaycaster() {
    try {
      const raycasters = this.components.get(OBC.Raycasters);
      if (raycasters) {
        // Get the raycaster for this world
        this.raycaster = raycasters.get(this.world);
        if (this.raycaster) {
          this.raycasterReady = true;
          console.log('Raycaster initialized for custom sections');
        } else {
          console.warn('Could not get raycaster for world');
          this.raycasterReady = false;
        }
      } else {
        console.warn('Raycasters component not found');
        this.raycasterReady = false;
      }
    } catch (error) {
      console.warn('Could not initialize raycaster:', error);
      this.raycasterReady = false;
    }
  }

  // Create a custom section view from raycasted point
  async createCustomSection(name = null) {
    if (!this.raycasterReady || !this.raycaster) {
      console.warn('Raycaster not ready for creating custom sections');
      return false;
    }

    try {
      // Perform ray casting to detect intersection
      const result = await this.raycaster.castRay();

      if (!result) {
        console.warn('No intersection found. Double-click on the model to create a section.');
        return false;
      }

      // Extract intersection data
      const { point, normal, fragments } = result;

      if (!(normal && point)) {
        console.warn('Invalid intersection data');
        return false;
      }

      // Invert normal so view looks into the model (using negate for proper inversion)
      const invertedNormal = normal.clone().negate();

      // Offset the point slightly along the normal for better view positioning
      const offsetPoint = point.clone().addScaledVector(normal, 1);

      // Generate name if not provided
      const sectionName = name || `Section-${this.customSections.size + 1}`;

      // Get element information if available
      let elementInfo = null;
      if (fragments && fragments.modelId !== undefined) {
        try {
          const modelIdMap = { [fragments.modelId]: new Set([result.localId]) };
          elementInfo = { modelId: fragments.modelId, localId: result.localId };
          console.log('Selected element:', elementInfo);
        } catch (e) {
          console.warn('Could not get element info:', e);
        }
      }

      // Create the view using the intersection point and normal
      const view = this.viewsComponent.create(invertedNormal, offsetPoint, {
        id: sectionName,
        world: this.world,
      });

      if (view) {
        // Configure view properties
        view.range = 10; // Set viewing distance/range
        view.helpersVisible = false; // Hide helpers by default (can be toggled)

        // Save it as a custom section
        this.customSections.set(sectionName, {
          name: sectionName,
          view: view,
          point: point.clone(),
          offsetPoint: offsetPoint.clone(),
          normal: normal.clone(),
          invertedNormal: invertedNormal.clone(),
          timestamp: new Date().toLocaleTimeString(),
          isCustomSection: true,
          elementInfo: elementInfo,
          range: 10,
        });

        console.log('Custom section created:', sectionName, {
          point: { x: point.x, y: point.y, z: point.z },
          normal: { x: normal.x, y: normal.y, z: normal.z },
          elementInfo: elementInfo,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error creating custom section:', error);
      return false;
    }
  }

  // Get all custom sections
  getCustomSections() {
    return Array.from(this.customSections.values());
  }

  // Toggle section creation mode (enable/disable double-click sections)
  setSectionsEnabled(enabled) {
    try {
      this.sectionsEnabled = enabled;
      console.log('Sections mode:', enabled ? 'enabled' : 'disabled');
      return true;
    } catch (error) {
      console.error('Error toggling sections mode:', error);
      return false;
    }
  }

  // Load a custom section view
  async loadCustomSection(sectionName) {
    try {
      if (!this.customSections.has(sectionName)) {
        console.warn('Custom section not found:', sectionName);
        return false;
      }

      const sectionData = this.customSections.get(sectionName);

      // Hide all other custom sections and show the selected one
      for (const [name, section] of this.customSections.entries()) {
        if (section.view && section.view.helpersVisible !== undefined) {
          section.view.helpersVisible = (name === sectionName);
        }
      }

      // Store previous projection and navigation mode if not already stored
      if (!this.previousProjection) {
        this.previousProjection = this.world.camera.projection.active;
        this.previousNavigationMode = this.world.camera.mode;
      }

      // Switch to orthographic projection
      this.world.camera.projection.set('Orthographic');

      // Position camera perpendicular to the section plane
      const normal = sectionData.invertedNormal;
      const point = sectionData.offsetPoint;

      // Calculate a distance for the camera based on the section's range
      const distance = Math.max(sectionData.range || 10, 15);

      // Position camera at the offset point along the inverted normal
      const cameraPos = new THREE.Vector3(
        point.x + normal.x * distance,
        point.y + normal.y * distance,
        point.z + normal.z * distance
      );

      // Update camera position
      this.world.camera.three.position.copy(cameraPos);
      this.world.camera.three.lookAt(point.x, point.y, point.z);
      this.world.camera.three.updateProjectionMatrix();

      this.currentViewName = sectionName;
      console.log('Custom section loaded:', sectionName, { position: cameraPos, lookAt: point });
      return true;
    } catch (error) {
      console.error('Error loading custom section:', error);
      return false;
    }
  }

  // Restore previous camera settings
  restorePreviousView() {
    try {
      if (this.previousProjection) {
        this.world.camera.projection.set(this.previousProjection);
        console.log('Camera projection restored to:', this.previousProjection);
      }

      if (this.previousNavigationMode) {
        this.world.camera.set(this.previousNavigationMode);
        console.log('Camera navigation mode restored to:', this.previousNavigationMode);
      }

      this.previousProjection = null;
      this.previousNavigationMode = null;
      this.currentViewName = null;
      return true;
    } catch (error) {
      console.error('Error restoring camera view:', error);
      return false;
    }
  }

  // Check if there's an active 2D view
  hasActiveView() {
    try {
      if (!this.viewsComponent) {
        return false;
      }

      // Check if the Views component has an active plan
      if (this.viewsComponent.list && this.viewsComponent.list.size > 0) {
        // Check if any view is active by looking at the components
        for (const view of this.viewsComponent.list.values()) {
          if (view && view.active) {
            return true;
          }
        }
      }

      // Alternative: check if there's a current view name
      return this.currentViewName !== null;
    } catch (error) {
      console.warn('Error checking if view is active:', error);
      return false;
    }
  }

  // Close the currently active 2D view
  closeActiveView() {
    try {
      if (!this.viewsComponent) {
        console.warn('Views component not initialized');
        return false;
      }

      // Check if there's an active view to close
      if (!this.hasActiveView()) {
        console.warn('No active 2D view to close');
        return false;
      }

      // Close the active view
      this.viewsComponent.close();
      console.log('Active 2D view closed');

      // Clear current view name
      this.currentViewName = null;

      // Restore previous camera settings
      this.restorePreviousView();

      return true;
    } catch (error) {
      console.error('Error closing active view:', error);
      return false;
    }
  }

  // Delete a custom section
  deleteCustomSection(sectionName) {
    try {
      if (!this.customSections.has(sectionName)) {
        console.warn('Custom section not found:', sectionName);
        return false;
      }

      const sectionData = this.customSections.get(sectionName);
      const wasCurrentSection = this.currentViewName === sectionName;

      // Hide the view and dispose it
      if (sectionData.view) {
        // Hide the helpers first
        if (sectionData.view.helpersVisible !== undefined) {
          sectionData.view.helpersVisible = false;
        }

        // Try to dispose the view if it has a dispose method
        if (typeof sectionData.view.dispose === 'function') {
          sectionData.view.dispose();
        }
      }

      this.customSections.delete(sectionName);

      // If this was the currently loaded section, restore previous view
      if (wasCurrentSection) {
        this.restorePreviousView();
      }

      console.log('Custom section deleted:', sectionName);
      return true;
    } catch (error) {
      console.error('Error deleting custom section:', error);
      return false;
    }
  }

  // Get custom section names
  getCustomSectionNames() {
    return Array.from(this.customSections.keys());
  }

  // Toggle helpers visibility for a custom section
  toggleSectionHelpers(sectionName) {
    try {
      if (!this.customSections.has(sectionName)) {
        console.warn('Custom section not found:', sectionName);
        return false;
      }

      const sectionData = this.customSections.get(sectionName);
      if (sectionData.view && sectionData.view.helpersVisible !== undefined) {
        sectionData.view.helpersVisible = !sectionData.view.helpersVisible;
        console.log('Section helpers toggled:', sectionName, sectionData.view.helpersVisible);
        return sectionData.view.helpersVisible;
      }

      return false;
    } catch (error) {
      console.error('Error toggling section helpers:', error);
      return false;
    }
  }

  // Set viewing range for a custom section
  setSectionRange(sectionName, range) {
    try {
      if (!this.customSections.has(sectionName)) {
        console.warn('Custom section not found:', sectionName);
        return false;
      }

      const sectionData = this.customSections.get(sectionName);
      if (sectionData.view && sectionData.view.range !== undefined) {
        sectionData.view.range = range;
        sectionData.range = range;
        console.log('Section range updated:', sectionName, range);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error setting section range:', error);
      return false;
    }
  }

  // Get section details
  getSectionDetails(sectionName) {
    try {
      if (!this.customSections.has(sectionName)) {
        return null;
      }

      const sectionData = this.customSections.get(sectionName);
      return {
        name: sectionData.name,
        timestamp: sectionData.timestamp,
        range: sectionData.range,
        point: { x: sectionData.point.x, y: sectionData.point.y, z: sectionData.point.z },
        normal: { x: sectionData.normal.x, y: sectionData.normal.y, z: sectionData.normal.z },
        elementInfo: sectionData.elementInfo,
        helpersVisible: sectionData.view ? sectionData.view.helpersVisible : false,
      };
    } catch (error) {
      console.error('Error getting section details:', error);
      return null;
    }
  }

  // Save current camera view with a name
  saveCurrentView(viewName) {
    try {
      if (!viewName || viewName.trim() === '') {
        console.warn('View name cannot be empty');
        return false;
      }

      const camera = this.world.camera.three;

      // Save camera position and rotation
      const viewData = {
        name: viewName,
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
        fov: camera.fov,
        zoom: camera.zoom,
        timestamp: new Date().toLocaleTimeString(),
      };

      this.savedViews.set(viewName, viewData);
      console.log('View saved:', viewName, viewData);
      return true;
    } catch (error) {
      console.error('Error saving view:', error);
      return false;
    }
  }

  // Load a saved view
  async loadView(viewName) {
    try {
      if (!this.savedViews.has(viewName)) {
        console.warn('View not found:', viewName);
        return false;
      }

      const viewData = this.savedViews.get(viewName);
      const camera = this.world.camera.three;

      // Restore camera position and rotation
      camera.position.copy(viewData.position);
      camera.rotation.copy(viewData.rotation);
      camera.fov = viewData.fov;
      camera.zoom = viewData.zoom;
      camera.updateProjectionMatrix();

      // Update camera controls if available
      if (this.world.camera.controls && this.world.camera.controls.setLookAt) {
        await this.world.camera.controls.setLookAt(
          viewData.position.x,
          viewData.position.y,
          viewData.position.z,
          0,
          0,
          0
        );
      }

      this.currentViewName = viewName;
      console.log('View loaded:', viewName);
      return true;
    } catch (error) {
      console.error('Error loading view:', error);
      return false;
    }
  }

  // Delete a saved view
  deleteView(viewName) {
    try {
      if (!this.savedViews.has(viewName)) {
        console.warn('View not found:', viewName);
        return false;
      }

      this.savedViews.delete(viewName);
      if (this.currentViewName === viewName) {
        this.currentViewName = null;
      }

      console.log('View deleted:', viewName);
      return true;
    } catch (error) {
      console.error('Error deleting view:', error);
      return false;
    }
  }

  // Get all saved views
  getAllViews() {
    return Array.from(this.savedViews.entries()).map(([name, data]) => ({
      name,
      timestamp: data.timestamp,
    }));
  }

  // Get saved view names
  getViewNames() {
    return Array.from(this.savedViews.keys());
  }

  // Clear all views
  clearAllViews() {
    try {
      this.savedViews.clear();
      this.currentViewName = null;
      console.log('All views cleared');
      return true;
    } catch (error) {
      console.error('Error clearing views:', error);
      return false;
    }
  }

  // Check if view exists
  hasView(viewName) {
    return this.savedViews.has(viewName);
  }

  // Get current view name
  getCurrentViewName() {
    return this.currentViewName;
  }

  // Export views as JSON
  exportViewsAsJSON() {
    const viewsData = [];
    for (const [name, data] of this.savedViews) {
      viewsData.push({
        name,
        position: { x: data.position.x, y: data.position.y, z: data.position.z },
        rotation: { x: data.rotation.x, y: data.rotation.y, z: data.rotation.z },
        fov: data.fov,
        zoom: data.zoom,
        timestamp: data.timestamp,
      });
    }
    return JSON.stringify(viewsData, null, 2);
  }

  // Import views from JSON
  importViewsFromJSON(jsonString) {
    try {
      const viewsData = JSON.parse(jsonString);

      for (const view of viewsData) {
        const position = new THREE.Vector3(
          view.position.x,
          view.position.y,
          view.position.z
        );
        const rotation = new THREE.Euler(
          view.rotation.x,
          view.rotation.y,
          view.rotation.z
        );

        this.savedViews.set(view.name, {
          name: view.name,
          position,
          rotation,
          fov: view.fov,
          zoom: view.zoom,
          timestamp: view.timestamp,
        });
      }

      console.log('Views imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing views:', error);
      return false;
    }
  }

  // Create preset views
  createPresetViews() {
    try {
      const center = new THREE.Vector3(0, 0, 0);
      const distance = 50;

      // Top view
      const topPosition = new THREE.Vector3(0, distance, 0);
      this.savedViews.set('Top View', {
        name: 'Top View',
        position: topPosition,
        rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        fov: 50,
        zoom: 1,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Front view
      const frontPosition = new THREE.Vector3(0, 0, distance);
      this.savedViews.set('Front View', {
        name: 'Front View',
        position: frontPosition,
        rotation: new THREE.Euler(0, 0, 0),
        fov: 50,
        zoom: 1,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Right view
      const rightPosition = new THREE.Vector3(distance, 0, 0);
      this.savedViews.set('Right View', {
        name: 'Right View',
        position: rightPosition,
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        fov: 50,
        zoom: 1,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Isometric view
      const isoPosition = new THREE.Vector3(distance, distance, distance);
      this.savedViews.set('Isometric View', {
        name: 'Isometric View',
        position: isoPosition,
        rotation: new THREE.Euler(-Math.PI / 4, Math.PI / 4, 0),
        fov: 50,
        zoom: 1,
        timestamp: new Date().toLocaleTimeString(),
      });

      console.log('Preset views created');
      return true;
    } catch (error) {
      console.error('Error creating preset views:', error);
      return false;
    }
  }
}
