# Command Notes

A VSCode extension that helps you manage and execute frequently used commands from a convenient side panel.

![alt text](<recording 2025-12-09 181256.gif>)


## Features

### 📋 Command Management
- **Store frequently used commands** with labels and descriptions
- **Organize commands in groups** (folder-like structure)
- **Quick execution** with one-click terminal integration
- **Copy to clipboard** for manual editing before execution

### 🎯 Easy Organization
- **Drag-and-drop** to reorder commands and groups
- **Move up/down** with context menu
- **Nested groups** for better organization
- **Visual icons** to distinguish commands from groups

### 💾 Persistent Storage
- Commands stored in **global storage** (available across all workspaces)
- **Auto-save** on every change
- Data persists across VSCode sessions

### ⚡ Smart Terminal Integration
- **Reuses existing terminal** when available
- **Creates new terminal** only when needed
- **Named terminal** ("Command Notes") for easy identification

## Usage

### Getting Started

1. Click the **terminal icon** in the Activity Bar to open Command Notes
2. Click the **"+"** button to add your first command
3. Enter a label, command, and optional description

### Adding Commands

**To add a command at root level:**
- Click the "+" icon in the panel header

**To add a command to a group:**
- Right-click on a group → "Add Command"

### Creating Groups

- Click the folder icon in the panel header
- Or right-click on an existing group → "Add Group"

### Executing Commands

- Click the **▶️ play button** next to any command
- Or right-click → "Execute Command"
- Command runs in the integrated terminal

### Copying Commands

- Click the **📋 copy button** next to any command
- Or right-click → "Copy Command"
- Command text is copied to clipboard

### Organizing Commands

**Drag and Drop:**
- Drag commands to reorder within a group
- Drag commands between groups
- Drag groups to reorder them

**Move Up/Down:**
- Right-click → "Move Up" or "Move Down"

### Editing and Deleting

**Edit a command:**
- Right-click → "Edit Command"

**Rename a group:**
- Right-click → "Rename Group"

**Delete:**
- Right-click → "Delete"
- Confirms before deleting groups with children

## Development

### Building
```bash
npm run compile
```

### Testing
Press **F5** to launch the Extension Development Host

### Watching
```bash
npm run watch
```

## Storage Location

Commands are stored in VSCode's global storage:
- **Linux**: `~/.config/Code/User/globalStorage/state.vscdb`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/state.vscdb`
- **Windows**: `%APPDATA%\Code\User\globalStorage\state.vscdb`

## License

See LICENSE file for details.
