import * as OBC from '@thatopen/components';

export class ItemsFinderManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.finder = null;
    this.finderReady = false;
    this.queries = new Map(); // Store custom queries
    this.isolationEnabled = false;
    this.originalFragments = null;
  }

  init() {
    console.log('Initializing Items Finder...');

    try {
      // Get the ItemsFinder component
      this.finder = this.components.get(OBC.ItemsFinder);

      if (!this.finder) {
        console.warn('ItemsFinder component not found');
        return false;
      }

      this.finderReady = true;
      console.log('Items Finder initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Items Finder:', error);
      return false;
    }
  }

  // Create a category-based search query
  createCategoryQuery(queryName, categories) {
    try {
      if (!this.finder) {
        console.warn('Items Finder not initialized');
        return false;
      }

      // Create query with regex patterns
      const categoryPatterns = categories.map(cat => new RegExp(cat, 'i'));

      const query = {
        categories: categoryPatterns,
      };

      this.finder.create(queryName, [query]);

      // Store query info
      this.queries.set(queryName, {
        name: queryName,
        type: 'category',
        categories: categories,
      });

      console.log(`Query created: ${queryName}`, categories);
      return true;
    } catch (error) {
      console.error('Error creating category query:', error);
      return false;
    }
  }

  // Create an attribute-based search query
  createAttributeQuery(queryName, categories, attributeName, attributeValue) {
    try {
      if (!this.finder) {
        console.warn('Items Finder not initialized');
        return false;
      }

      const categoryPatterns = categories.map(cat => new RegExp(cat, 'i'));
      const query = {
        categories: categoryPatterns,
        attributes: {
          queries: [
            {
              name: new RegExp(attributeName, 'i'),
              value: new RegExp(attributeValue, 'i'),
            },
          ],
        },
      };

      this.finder.create(queryName, [query]);

      this.queries.set(queryName, {
        name: queryName,
        type: 'attribute',
        categories: categories,
        attribute: { name: attributeName, value: attributeValue },
      });

      console.log(`Query created: ${queryName}`, { categories, attribute: { name: attributeName, value: attributeValue } });
      return true;
    } catch (error) {
      console.error('Error creating attribute query:', error);
      return false;
    }
  }

  // Execute a query and get results
  async executeQuery(queryName) {
    try {
      if (!this.finder) {
        console.warn('Items Finder not initialized');
        return null;
      }

      const finderQuery = this.finder.list.get(queryName);
      if (!finderQuery) {
        console.warn('Query not found:', queryName);
        return null;
      }

      const result = await finderQuery.test();
      console.log(`Query executed: ${queryName}`, result);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      return null;
    }
  }

  // Isolate found items and hide the rest
  async isolateItems(queryName) {
    try {
      const result = await this.executeQuery(queryName);
      if (!result) {
        console.warn('No results to isolate');
        return false;
      }

      // Get all fragments
      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      // Store original visibility state
      if (!this.originalFragments) {
        this.originalFragments = new Map();
        for (const fragment of fragmentsManager.list.values()) {
          if (fragment.mesh) {
            this.originalFragments.set(fragment, fragment.mesh.visible);
          }
        }
      }

      // Hide all items first
      for (const fragment of fragmentsManager.list.values()) {
        if (fragment.mesh) {
          fragment.mesh.visible = false;
        }
      }

      // Show only the found items
      for (const [modelId, itemIds] of Object.entries(result)) {
        const fragment = fragmentsManager.list.get(modelId);
        if (fragment) {
          fragment.mesh.visible = true;
        }
      }

      this.isolationEnabled = true;
      console.log('Items isolated:', queryName);
      return true;
    } catch (error) {
      console.error('Error isolating items:', error);
      return false;
    }
  }

  // Reset visibility to show all items
  resetIsolation() {
    try {
      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      if (this.originalFragments) {
        // Restore original visibility
        for (const [fragment, visible] of this.originalFragments.entries()) {
          if (fragment.mesh) {
            fragment.mesh.visible = visible;
          }
        }
      } else {
        // Show all fragments if no original state was saved
        for (const fragment of fragmentsManager.list.values()) {
          if (fragment.mesh) {
            fragment.mesh.visible = true;
          }
        }
      }

      this.isolationEnabled = false;
      console.log('Visibility reset - all items shown');
      return true;
    } catch (error) {
      console.error('Error resetting isolation:', error);
      return false;
    }
  }

  // Get all available queries
  getQueries() {
    return Array.from(this.queries.values());
  }

  // Get query names
  getQueryNames() {
    return Array.from(this.queries.keys());
  }

  // Delete a query
  deleteQuery(queryName) {
    try {
      if (!this.finder) {
        console.warn('Items Finder not initialized');
        return false;
      }

      this.finder.list.delete(queryName);
      this.queries.delete(queryName);
      console.log('Query deleted:', queryName);
      return true;
    } catch (error) {
      console.error('Error deleting query:', error);
      return false;
    }
  }

  // Create preset queries for common element types
  createPresetQueries() {
    try {
      // Walls & Slabs
      this.createCategoryQuery('Walls & Slabs', ['WALL', 'SLAB']);

      // Columns
      this.createCategoryQuery('Columns', ['COLUMN']);

      // Doors & Windows
      this.createCategoryQuery('Doors & Windows', ['DOOR', 'WINDOW']);

      // Furniture
      this.createCategoryQuery('Furniture', ['FURNITURE']);

      // Structural Elements
      this.createCategoryQuery('Structural Elements', ['BEAM', 'COLUMN', 'SLAB']);

      console.log('Preset queries created');
      return true;
    } catch (error) {
      console.error('Error creating preset queries:', error);
      return false;
    }
  }

  // Get info about items finder
  getInfo() {
    return {
      ready: this.finderReady,
      queryCount: this.queries.size,
      queries: this.getQueryNames(),
      isolationEnabled: this.isolationEnabled,
    };
  }
}
