# TableData Source Code

This directory contains the source code for the **TableData** JavaScript library - an interactive HTML table component that supports sorting, filtering, pagination, and data formatting.

## Architecture Overview

TableData uses a modular architecture with a core system and pluggable modules that extend functionality. The library is designed to handle both client-side and remote server-side data processing.

### Core Components

#### GridCore (`core/gridCore.js`)
The foundation class that:
- Manages grid lifecycle and initialization
- Provides module registration system via `addModules()`
- Handles core settings and container management
- Creates the base `GridContext` for data and rendering

#### TableData (`tabledata.js`)
The main entry point class that extends `GridCore` and automatically registers common modules based on settings:
- `FilterModule` - Column filtering (when `enableFilter: true`)
- `SortModule` - Column sorting (when `enableSort: true`)
- `RowCountModule` - Row count display (when `rowCountId` is set)
- `RefreshModule` - Remote data refresh (when `refreshableId` is set)
- `CsvModule` - CSV export (when `csvExportId` is set)

### Directory Structure

```
src/
├── tabledata.js              # Main entry point and default build
├── builds/                   # Alternative build configurations
│   ├── ems.js               # ES Module build
│   └── full.js              # Full-featured build
├── components/              # Core UI and data components
│   ├── cell/                # Cell rendering and formatting
│   ├── column/              # Column definitions and management
│   ├── context/             # Grid context and state management
│   ├── data/                # Data loading, persistence, and pipeline
│   ├── events/              # Event system
│   └── table/               # Table rendering
├── core/                    # Core grid functionality
│   └── gridCore.js          # Base grid class
├── css/                     # Stylesheet source files (SCSS)
├── helpers/                 # Utility functions
│   ├── cssHelper.js         # CSS manipulation utilities
│   ├── dateHelper.js        # Date parsing and formatting
│   └── elementHelper.js     # DOM element utilities
├── modules/                 # Pluggable feature modules
│   ├── download/            # CSV export functionality
│   ├── filter/              # Column filtering system
│   ├── pager/               # Pagination controls
│   ├── refresh/             # Remote data refresh
│   ├── row/                 # Row rendering and counting
│   └── sort/                # Column sorting
└── settings/                # Configuration management
    ├── mergeOptions.js      # Settings merge logic
    ├── settingsDefault.js   # Default configuration values
    └── settingsGrid.js      # Grid settings class
```

## Key Concepts

### Module System
Modules extend grid functionality and follow a consistent pattern:
- Each module is a class with lifecycle methods
- Modules are registered via `addModules()` before calling `init()`
- Modules can interact with the grid context and emit/listen to events

### Grid Context
The `GridContext` object (`components/context/gridContext.js`) serves as the central state manager containing:
- Column definitions and manager
- Data pipeline for transformations
- Table structure and rendering
- Event system for inter-component communication

### Data Pipeline
The data pipeline (`components/data/dataPipeline.js`) processes data through stages:
1. Loading (from array or remote source)
2. Filtering (client-side or remote)
3. Sorting (client-side or remote)
4. Pagination
5. Rendering

### Cell Formatters
Located in `components/cell/formatters/`, formatters transform raw data for display:
- **datetime.js** - Date and datetime formatting
- **numeric.js** - Number formatting with options
- **link.js** - Hyperlink generation
- **star.js** - Star rating display

Custom formatters can be provided as functions in column definitions.

## Usage Patterns

### Creating a Custom Build

To create a custom TableData build with specific modules:

```javascript
import { GridCore } from "./core/gridCore.js";
import { SortModule } from "./modules/sort/sortModule.js";
import { PagerModule } from "./modules/pager/pagerModule.js";

class CustomTable extends GridCore {
    constructor(container, settings) {
        super(container, settings);
        this.addModules(SortModule, PagerModule);
    }
}

export { CustomTable };
```

### Adding Custom Modules

Modules should implement the module interface pattern:

```javascript
class CustomModule {
    constructor(context, settings) {
        this.context = context;
        this.settings = settings;
    }

    init() {
        // Module initialization logic
    }

    // Additional module methods
}

export { CustomModule };
```

### Column Definition

Columns are defined with the following properties:
```javascript
{
    field: "propertyName",      // Data property to display
    label: "Display Label",     // Header text
    type: "string|number|date", // Data type
    formatter: Function,        // Custom formatting function
    sortable: true|false,       // Enable sorting
    filterable: true|false,     // Enable filtering
    width: "100px",            // Column width
    cssClass: "custom-class"   // Custom CSS class
}
```

## Configuration

Default settings are defined in `settings/settingsDefault.js`. Key options include:

### Data Options
- `data` - Initial data array
- `remoteUrl` - AJAX endpoint for remote data
- `remoteParams` - Parameters for remote requests
- `remoteProcessing` - Enable server-side processing

### Pagination
- `enablePaging` - Enable/disable pagination
- `pagerRowsPerPage` - Rows per page (default: 25)
- `pagerPagesToDisplay` - Max pager buttons to show

### Features
- `enableSort` - Enable column sorting
- `enableFilter` - Enable column filtering
- `dateFormat` - Default date format (default: "MM/dd/yyyy")
- `dateTimeFormat` - Default datetime format

### Styling
- `tableCss` - Base table CSS class
- `tableStyleSettings` - Inline style object
- `tableEvenColumnWidths` - Equal column widths

## Development

### Building

The project uses Rollup for building. Build configurations are in `/build` directory.

### Testing

Tests are located in the `/test` directory with the following structure:
- `/test/components/` - Component tests
- `/test/modules/` - Module tests
- `/test/helpers/` - Helper function tests

### Styling

Styles are written in SCSS and located in `css/`. The main stylesheet is `tabledata.scss` which imports component-specific styles.

## API Reference

### GridCore Methods

- `addModules(...modules)` - Register modules before initialization
- `init()` - Initialize and render the grid (async)
- `destroy()` - Clean up and remove grid from DOM
- `refresh()` - Reload data and re-render

### Module Lifecycle

1. Constructor - Module instantiation
2. `init()` - Module initialization
3. Event handlers - Respond to grid events
4. Cleanup (if needed) - On grid destruction

## Events

The grid uses a custom event system (`components/events/gridEvents.js`) for component communication. Common events include:
- Data loading/loaded
- Filter applied
- Sort applied
- Page changed
- Row rendered

Modules can emit and listen to events through the context's event system.