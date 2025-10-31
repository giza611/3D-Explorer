# 3D Explorer - Advanced BIM Viewer

A powerful, feature-rich 3D BIM (Building Information Modeling) viewer built with **ThatOpen Components** and **Three.js**. This application provides comprehensive tools for viewing, analyzing, and interacting with 3D building models.

## Features

### Core Viewing
- **IFC File Loading** - Load and convert IFC (Industry Foundation Classes) files with real-time progress feedback
- **Fragment Models** - Load pre-converted fragment files for faster performance
- **Camera Controls** - Multiple projection modes (Perspective/Orthographic) and navigation modes (Orbit/FirstPerson/Plan)
- **Orientation Views** - Quick access to standard views (Front, Back, Left, Right, Top, Bottom) with single-click buttons

### Analysis & Visualization
- **Visibility Management** - Hide, show, or isolate model elements by category
- **Custom Sections** - Create 2D cross-sections by double-clicking on the model
- **Clipping Planes** - Slice models with adjustable clipping planes
- **Area Measurement** - Measure areas on model surfaces with customizable colors
- **Grids** - Reference grids for spatial navigation and orientation

### View Management
- **Save Custom Views** - Save and restore camera positions and states
- **Preset Views** - Built-in preset views (Top, Front, Right, Isometric)
- **Items Finder** - Search and isolate specific building elements (walls, columns, doors, windows, furniture, etc.)

### UI/UX
- **Collapsible Sections** - Organize tools in expandable panels
- **Dark/Light Mode** - Theme toggle for comfortable viewing in different lighting conditions
- **Responsive Layout** - Fixed sidebar with 350px width, adaptive main viewing area
- **Real-time Stats** - Performance monitoring with FPS and memory usage

## Project Structure

```
3d-worlds-app/
├── index.html              # Main HTML file with styling
├── main.js                 # Application entry point and initialization
├── package.json            # Project dependencies
├── vite.config.js         # Vite bundler configuration
├── ifc-loader.js          # IFC file loading management
├── fragments-models.js    # Fragment file loading management
├── camera-controls.js     # Camera manipulation and orientation
├── views-manager.js       # View saving and section creation
├── clipper-manager.js     # Clipping plane management
├── items-finder.js        # Item search and filtering
├── visibility-manager.js  # Element visibility control (Hider)
├── area-measurement.js    # Area measurement tool
├── grids-manager.js       # Grid visualization
└── README.md              # This file
```

## Dependencies

### Main Libraries
- **@thatopen/components** - Core BIM components (IFC loading, clipping, measurements, etc.)
- **@thatopen/fragments** - Fragment handling for optimized model loading
- **@thatopen/ui** - UI component library
- **three** - 3D graphics library
- **vite** - Fast build tool and dev server
- **stats.js** - Performance monitoring

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3d-worlds-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3001`

4. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### Loading Models

1. **IFC Files**
   - Click "Select IFC File" to choose an IFC file from your computer
   - Click "Load IFC" to convert and load the model
   - Camera automatically fits the loaded model in the window

2. **Fragment Files**
   - Enter a URL or select a pre-converted fragment file
   - Click "Load from URL" or "Load Fragment File"

### Camera Controls

- **Navigation**: Use mouse to rotate, pan, and zoom
- **Projection Mode**: Switch between Perspective and Orthographic views
- **Navigation Mode**: Choose between Orbit, FirstPerson, or Plan navigation
- **Quick Views**: Use orientation buttons (F, B, L, R, T, D) for standard views
- **Fit to Window**: Auto-fit camera to display entire model

### Creating Sections

1. Enable "Sections" by clicking the toggle button
2. Double-click on the model to create a cross-section
3. The 2D view opens with orthographic projection perpendicular to the section plane
4. Click "Close 2D View" to return to 3D

### Element Visibility

1. Navigate to the **Visibility** section
2. Select a category from the dropdown
3. Use buttons to:
   - **Isolate** - Show only selected category
   - **Hide** - Hide selected category
   - **Show** - Display selected category
   - **Show All** - Reset visibility

### Area Measurement

1. Enable measurements in the **Area Measurement** section
2. Double-click on model surfaces to measure areas
3. Customize measurement color as needed

### Theme Control

- Click the moon/sun icon (🌙/☀️) in the top-right corner to toggle dark mode
- Theme preference is saved in local storage

## File Format Support

- **IFC** (.ifc) - Industry Foundation Classes format
- **FRAG** (.frag) - Pre-converted fragment format for better performance

## Keyboard Shortcuts

- **Mouse Wheel** - Zoom in/out
- **Left Click + Drag** - Rotate view (Orbit mode)
- **Right Click + Drag** - Pan view
- **Double Click** - Create section or measure area

## Performance Tips

1. For large models, use pre-converted fragment files (.frag format)
2. Use "Isolate Category" to focus on specific elements
3. Enable grids for better spatial reference
4. Monitor performance using the stats panel in the corner

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Architecture

### Manager Pattern
The application uses a manager pattern where each major feature is wrapped in its own class:
- **IFC Loader Manager** - Handles IFC file conversion
- **Fragments Models Manager** - Manages fragment file loading
- **Camera Controls Manager** - Controls camera and orientation
- **Views Manager** - Manages saved views and sections
- **Clipper Manager** - Manages clipping planes
- **Items Finder Manager** - Searches and filters elements
- **Visibility Manager** - Controls element visibility
- **Grids Manager** - Manages grid visualization
- **Area Measurement Manager** - Handles measurements

### State Management
State is maintained at the application level with managers handling their specific domains. LocalStorage is used for persistent settings like theme preferences.

### UI Framework
The UI is built using ThatOpen UI components with custom styling for a professional look and responsive behavior.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is provided as-is for educational and professional use.

## Credits

- Built with [ThatOpen Components](https://github.com/ThatOpen/engine_components)
- 3D graphics powered by [Three.js](https://threejs.org)
- UI components from [ThatOpen UI](https://github.com/ThatOpen/engine_ui)

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Made with ❤️ for the AEC industry**
