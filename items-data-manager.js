export class ItemsDataManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.itemsDataReady = false;
    this.propertiesTable = null;
    this.updatePropertiesTable = null;
    this.selectedModelIdMap = {};
    this.highlighter = null;
  }

  init(highlighter) {
    console.log('Initializing Items Data Manager...');

    try {
      // Store reference to highlighter for selection events
      this.highlighter = highlighter;

      if (!highlighter || !highlighter.highlighter) {
        console.warn('Highlighter not available for Items Data');
        return false;
      }

      // Import BUI components for tables
      // This is lazy-loaded because it may not be needed immediately
      this.itemsDataReady = true;
      console.log('Items Data Manager initialized successfully');
      return true;
    } catch (error) {
      console.warn('Could not initialize Items Data Manager:', error.message);
      console.error(error);
      this.itemsDataReady = false;
      return false;
    }
  }

  // Initialize properties table with BUI component
  async initPropertiesTable(containerElement) {
    try {
      console.log('Initializing properties table...');

      // Dynamically import BUIC (BUI Components for OBC)
      let BUIC;
      try {
        BUIC = await import('@thatopen/ui-obc');
        console.log('Successfully imported @thatopen/ui-obc');
      } catch (error) {
        console.error('Could not import @thatopen/ui-obc:', error);
        return false;
      }

      // Get the tables object and itemsData method
      if (!BUIC || !BUIC.tables || !BUIC.tables.itemsData) {
        console.error('BUIC.tables.itemsData not found');
        return false;
      }

      // Create the properties table component
      const [propertiesTable, updatePropertiesTable] = BUIC.tables.itemsData({
        components: this.components,
        modelIdMap: {},
      });

      // Configure table options as per tutorial
      propertiesTable.preserveStructureOnFilter = true;
      propertiesTable.indentationInText = false;

      this.propertiesTable = propertiesTable;
      this.updatePropertiesTable = updatePropertiesTable;

      // Clear container and append table
      containerElement.innerHTML = '';
      containerElement.appendChild(propertiesTable);

      console.log('Properties table created successfully');
      return true;
    } catch (error) {
      console.error('Error initializing properties table:', error);
      return false;
    }
  }

  // Update displayed properties based on selection
  updateSelection(modelIdMap) {
    if (!this.updatePropertiesTable) {
      console.warn('Properties table not initialized');
      return false;
    }

    try {
      console.log('Updating properties display with selection:', modelIdMap);
      this.selectedModelIdMap = modelIdMap || {};

      // Update the table with selected items - pass as object with modelIdMap property
      this.updatePropertiesTable({ modelIdMap: modelIdMap || {} });

      return true;
    } catch (error) {
      console.error('Error updating properties:', error);
      return false;
    }
  }

  // Clear all displayed properties
  clearProperties() {
    try {
      console.log('Clearing all properties');
      this.selectedModelIdMap = {};
      if (this.updatePropertiesTable) {
        // Pass empty modelIdMap as per tutorial format
        this.updatePropertiesTable({ modelIdMap: {} });
      }
      return true;
    } catch (error) {
      console.error('Error clearing properties:', error);
      return false;
    }
  }

  // Get current selection count
  getSelectionCount() {
    let count = 0;
    for (const items of Object.values(this.selectedModelIdMap)) {
      if (Array.isArray(items)) {
        count += items.length;
      }
    }
    return count;
  }

  // Get info about items data
  getInfo() {
    return {
      ready: this.itemsDataReady,
      selectionCount: this.getSelectionCount(),
      selectedItems: this.selectedModelIdMap,
    };
  }
}
