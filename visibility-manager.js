import * as OBC from '@thatopen/components';

export class VisibilityManager {
  constructor(components, world) {
    this.components = components;
    this.world = world;
    this.hider = null;
    this.hiderReady = false;
    this.hiddenItems = new Map(); // Track hidden items
    this.isolatedItems = new Map(); // Track isolated items
  }

  init() {
    console.log('Initializing Visibility Manager...');

    try {
      // Get the Hider component
      this.hider = this.components.get(OBC.Hider);

      if (!this.hider) {
        console.warn('Hider component not found');
        return false;
      }

      this.hiderReady = true;
      console.log('Visibility Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Visibility Manager:', error);
      return false;
    }
  }

  // Show all items (reset visibility)
  showAll() {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      this.hider.set(true);
      this.hiddenItems.clear();
      this.isolatedItems.clear();
      console.log('All items shown');
      return true;
    } catch (error) {
      console.error('Error showing all items:', error);
      return false;
    }
  }

  // Hide specific items by category
  hideByCategory(categories) {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      // Create map of items to hide
      const itemsToHide = this.getItemsByCategory(fragmentsManager, categories);

      if (Object.keys(itemsToHide).length === 0) {
        console.warn('No items found matching categories:', categories);
        return false;
      }

      // Hide the items
      this.hider.set(false, itemsToHide);

      // Store hidden items
      for (const [modelId, itemIds] of Object.entries(itemsToHide)) {
        this.hiddenItems.set(`${modelId}:${itemIds.join(',')}`, {
          modelId,
          itemIds,
          type: 'category',
          categories,
        });
      }

      console.log('Items hidden by category:', categories);
      return true;
    } catch (error) {
      console.error('Error hiding items by category:', error);
      return false;
    }
  }

  // Isolate items by category (hide all except specified)
  isolateByCategory(categories) {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      // Get items to isolate
      const itemsToIsolate = this.getItemsByCategory(fragmentsManager, categories);

      if (Object.keys(itemsToIsolate).length === 0) {
        console.warn('No items found matching categories:', categories);
        return false;
      }

      // Isolate the items
      this.hider.isolate(itemsToIsolate);

      // Store isolated items
      for (const [modelId, itemIds] of Object.entries(itemsToIsolate)) {
        this.isolatedItems.set(`${modelId}:${itemIds.join(',')}`, {
          modelId,
          itemIds,
          type: 'category',
          categories,
        });
      }

      console.log('Items isolated by category:', categories);
      return true;
    } catch (error) {
      console.error('Error isolating items by category:', error);
      return false;
    }
  }

  // Hide specific categories completely
  hideCategoriesCompletely(categories) {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      const itemsToHide = this.getItemsByCategory(fragmentsManager, categories);

      if (Object.keys(itemsToHide).length === 0) {
        console.warn('No items found');
        return false;
      }

      this.hider.set(false, itemsToHide);
      console.log('Categories hidden completely:', categories);
      return true;
    } catch (error) {
      console.error('Error hiding categories:', error);
      return false;
    }
  }

  // Show specific categories
  showCategories(categories) {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return false;
      }

      const itemsToShow = this.getItemsByCategory(fragmentsManager, categories);

      if (Object.keys(itemsToShow).length === 0) {
        console.warn('No items found');
        return false;
      }

      this.hider.set(true, itemsToShow);
      console.log('Categories shown:', categories);
      return true;
    } catch (error) {
      console.error('Error showing categories:', error);
      return false;
    }
  }

  // Get all items matching categories
  getItemsByCategory(fragmentsManager, categories) {
    const categorySet = new Set(categories.map(c => c.toUpperCase()));
    const result = {};

    try {
      for (const model of fragmentsManager.list.values()) {
        if (!model.properties) continue;

        const itemIds = [];
        for (const prop of model.properties) {
          if (prop.category && categorySet.has(prop.category.toUpperCase())) {
            itemIds.push(prop.expressID);
          }
        }

        if (itemIds.length > 0) {
          const modelId = model.uuid || model.name || Object.keys(result).length.toString();
          result[modelId] = itemIds;
        }
      }
    } catch (error) {
      console.warn('Error extracting items by category:', error);
    }

    return result;
  }

  // Get list of available categories
  getAvailableCategories() {
    try {
      const fragmentsManager = this.components.get(OBC.FragmentsManager);
      if (!fragmentsManager) {
        console.warn('FragmentsManager not found');
        return [];
      }

      const categories = new Set();

      for (const model of fragmentsManager.list.values()) {
        if (!model.properties) continue;

        for (const prop of model.properties) {
          if (prop.category) {
            categories.add(prop.category);
          }
        }
      }

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  // Hide all fragments (everything)
  hideAll() {
    try {
      if (!this.hider) {
        console.warn('Hider not initialized');
        return false;
      }

      this.hider.set(false);
      console.log('All items hidden');
      return true;
    } catch (error) {
      console.error('Error hiding all items:', error);
      return false;
    }
  }

  // Get info about visibility state
  getInfo() {
    return {
      ready: this.hiderReady,
      hiddenItemsCount: this.hiddenItems.size,
      isolatedItemsCount: this.isolatedItems.size,
      hiddenItems: Array.from(this.hiddenItems.values()),
      isolatedItems: Array.from(this.isolatedItems.values()),
    };
  }
}
