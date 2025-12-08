import * as vscode from 'vscode';
import { StorageService } from './storageService';
import { CommandTreeProvider } from './commandTreeProvider';
import { CommandHandler } from './commands';

export function activate(context: vscode.ExtensionContext) {
	console.log('Command Notes extension is now active!');

	// Initialize services
	const storageService = new StorageService(context);
	const treeProvider = new CommandTreeProvider(storageService);
	const commandHandler = new CommandHandler(treeProvider);

	// Initialize tree provider with stored data
	treeProvider.initialize();

	// Register TreeView
	const treeView = vscode.window.createTreeView('commandNotes', {
		treeDataProvider: treeProvider,
		showCollapseAll: true,
		canSelectMany: false,
		dragAndDropController: treeProvider
	});

	// Register commands
	context.subscriptions.push(
		// TreeView
		treeView,

		// Execute and Copy commands
		vscode.commands.registerCommand('command-notes.executeCommand', (node) => {
			commandHandler.executeCommand(node);
		}),
		vscode.commands.registerCommand('command-notes.copyCommand', (node) => {
			commandHandler.copyCommand(node);
		}),

		// Add commands
		vscode.commands.registerCommand('command-notes.addCommand', (node) => {
			commandHandler.addCommand(node);
		}),
		vscode.commands.registerCommand('command-notes.addGroup', (node) => {
			commandHandler.addGroup(node);
		}),

		// Edit commands
		vscode.commands.registerCommand('command-notes.editCommand', (node) => {
			commandHandler.editCommand(node);
		}),
		vscode.commands.registerCommand('command-notes.renameGroup', (node) => {
			commandHandler.renameGroup(node);
		}),

		// Delete command
		vscode.commands.registerCommand('command-notes.deleteNode', (node) => {
			commandHandler.deleteNode(node);
		}),

		// Move commands
		vscode.commands.registerCommand('command-notes.moveUp', (node) => {
			commandHandler.moveUp(node);
		}),
		vscode.commands.registerCommand('command-notes.moveDown', (node) => {
			commandHandler.moveDown(node);
		}),

		// Refresh command
		vscode.commands.registerCommand('command-notes.refresh', () => {
			treeProvider.refresh();
		}),

		// Export/Import commands
		vscode.commands.registerCommand('command-notes.export', () => {
			commandHandler.exportData();
		}),
		vscode.commands.registerCommand('command-notes.import', () => {
			commandHandler.importData();
		})
	);
}

export function deactivate() { }

