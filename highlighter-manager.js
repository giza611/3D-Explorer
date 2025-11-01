import * as THREE from 'three';
import * as OBCFront from '@thatopen/components-front';

export class HighlighterManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.highlighter = null;
    this.highlighterReady = false;
    this.selectedItems = new Map(); // Track selected items
  }

  init() {
    console.log('Initializing Highlighter...');

    try {
      // Get the Highlighter component from the front module
      const Highlighter = OBCFront.Highlighter;

      if (!Highlighter) {
        console.warn('Highlighter not found in OBCFront');
        return false;
      }

      // Create the highlighter instance
      this.highlighter = new Highlighter(this.components);

      // Setup the highlighter with world and material definition
      this.highlighter.setup({
        world: this.world,
        selectMaterialDefinition: {
          color: new THREE.Color('#bcf124'),
          opacity: 1,
          transparent: false,
          renderedFaces: 0,
        },
      });

      // Listen to selection events
      this.highlighter.events.select.onHighlight.add((modelIdMap) => {
        console.log('Items highlighted:', modelIdMap);
        this.selectedItems = new Map(Object.entries(modelIdMap));
      });

      this.highlighter.events.select.onClear.add(() => {
        console.log('Selection cleared');
        this.selectedItems.clear();
      });

      this.highlighterReady = true;
      console.log('Highlighter initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Highlighter:', error.message);
      this.highlighterReady = false;
      return false;
    }
  }

  // Add custom highlight style
  addStyle(name, color) {
    if (!this.highlighter) {
      console.warn('Highlighter not initialized');
      return false;
    }

    try {
      this.highlighter.styles.set(name, {
        color: new THREE.Color(color),
        opacity: 1,
        transparent: false,
        renderedFaces: 0,
      });
      console.log(`Highlighter style '${name}' added with color:`, color);
      return true;
    } catch (error) {
      console.error('Error adding highlighter style:', error);
      return false;
    }
  }

  // Apply highlighting to items
  highlightByID(styleName, modelIdMap) {
    if (!this.highlighter) {
      console.warn('Highlighter not initialized');
      return false;
    }

    try {
      this.highlighter.highlightByID(styleName, modelIdMap);
      console.log(`Applied '${styleName}' style to items:`, modelIdMap);
      return true;
    } catch (error) {
      console.error('Error highlighting items:', error);
      return false;
    }
  }

  // Clear highlighting from items
  clear(styleName, modelIdMap) {
    if (!this.highlighter) {
      console.warn('Highlighter not initialized');
      return false;
    }

    try {
      this.highlighter.clear(styleName, modelIdMap);
      console.log(`Cleared '${styleName}' style from items:`, modelIdMap);
      return true;
    } catch (error) {
      console.error('Error clearing highlight:', error);
      return false;
    }
  }

  // Clear all highlights
  clearAll() {
    if (!this.highlighter) {
      console.warn('Highlighter not initialized');
      return false;
    }

    try {
      // Get all style names and clear them
      for (const [styleName] of this.highlighter.styles) {
        this.highlighter.clear(styleName);
      }
      console.log('All highlights cleared');
      return true;
    } catch (error) {
      console.error('Error clearing all highlights:', error);
      return false;
    }
  }

  // Get currently selected items
  getSelectedItems() {
    return Array.from(this.selectedItems.entries());
  }

  // Get selection count
  getSelectionCount() {
    let count = 0;
    for (const items of this.selectedItems.values()) {
      count += items.length || 0;
    }
    return count;
  }

  // Set selection color
  setSelectionColor(hexColor) {
    if (!this.highlighter) {
      console.warn('Highlighter not initialized');
      return false;
    }

    try {
      // Update the select material definition
      this.highlighter.setup({
        world: this.world,
        selectMaterialDefinition: {
          color: new THREE.Color(hexColor),
          opacity: 1,
          transparent: false,
          renderedFaces: 0,
        },
      });
      console.log('Selection color set to:', hexColor);
      return true;
    } catch (error) {
      console.error('Error setting selection color:', error);
      return false;
    }
  }

  // Get info about highlighter
  getInfo() {
    return {
      ready: this.highlighterReady,
      selectionCount: this.getSelectionCount(),
      styles: this.highlighter ? Array.from(this.highlighter.styles.keys()) : [],
    };
  }
}
