import * as vscode from 'vscode';
import { CommandTreeProvider } from './commandTreeProvider';
import { TreeNode, isCommandItem, isCommandGroup, CommandItem } from './types';

export class CommandHandler {
    private terminal: vscode.Terminal | undefined;

    constructor(private treeProvider: CommandTreeProvider) { }

    /**
     * Execute a command in the integrated terminal
     */
    async executeCommand(node: TreeNode): Promise<void> {
        if (!isCommandItem(node)) {
            vscode.window.showWarningMessage('Only commands can be executed');
            return;
        }

        // Get or create terminal
        if (!this.terminal || this.terminal.exitStatus !== undefined) {
            // Terminal doesn't exist or was closed, create a new one
            this.terminal = vscode.window.createTerminal('Command Notes');
        }

        // Show and execute command
        this.terminal.show();
        this.terminal.sendText(node.command);

        vscode.window.showInformationMessage(`Executed: ${node.label}`);
    }

    /**
     * Copy command to clipboard
     */
    async copyCommand(node: TreeNode): Promise<void> {
        if (!isCommandItem(node)) {
            vscode.window.showWarningMessage('Only commands can be copied');
            return;
        }

        await vscode.env.clipboard.writeText(node.command);
        vscode.window.showInformationMessage(`Copied to clipboard: ${node.command}`);
    }

    /**
     * Add a new command
     */
    async addCommand(parentNode?: TreeNode): Promise<void> {
        // If parent is provided and it is a command item, use its parent instead
        if (parentNode && isCommandItem(parentNode)) {
            parentNode = (this.treeProvider.getParent(parentNode) as TreeNode | null) || undefined;
        }

        // If parent is provided, it must be a group
        if (parentNode && !isCommandGroup(parentNode)) {
            vscode.window.showWarningMessage('Commands can only be added to groups or root level');
            return;
        }

        const command = await vscode.window.showInputBox({
            prompt: 'Enter command to execute',
            placeHolder: 'e.g., docker-compose up -d'
        });

        if (!command) {
            return;
        }

        // Use the command itself as the label
        const label = command;

        await this.treeProvider.addCommand(label, command, undefined, parentNode?.id);
        vscode.window.showInformationMessage(`Command "${label}" added successfully`);
    }

    /**
     * Add a new group
     */
    async addGroup(parentNode?: TreeNode): Promise<void> {
        // If parent is provided and it is a command item, use its parent instead
        if (parentNode && isCommandItem(parentNode)) {
            parentNode = (this.treeProvider.getParent(parentNode) as TreeNode | null) || undefined;
        }

        // If parent is provided, it must be a group
        if (parentNode && !isCommandGroup(parentNode)) {
            vscode.window.showWarningMessage('Groups can only be added to other groups or root level');
            return;
        }

        const label = await vscode.window.showInputBox({
            prompt: 'Enter group name',
            placeHolder: 'e.g., Docker Commands'
        });

        if (!label) {
            return;
        }

        await this.treeProvider.addGroup(label, parentNode?.id);
        vscode.window.showInformationMessage(`Group "${label}" added successfully`);
    }

    /**
     * Edit a command
     */
    async editCommand(node: TreeNode): Promise<void> {
        if (!isCommandItem(node)) {
            vscode.window.showWarningMessage('Only commands can be edited');
            return;
        }

        const label = await vscode.window.showInputBox({
            prompt: 'Enter new label',
            value: node.label
        });

        if (!label) {
            return;
        }

        const command = await vscode.window.showInputBox({
            prompt: 'Enter new command',
            value: node.command
        });

        if (!command) {
            return;
        }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter new description (optional)',
            value: node.description || ''
        });

        await this.treeProvider.updateNode(node.id, { label, command, description });
        vscode.window.showInformationMessage(`Command "${label}" updated successfully`);
    }

    /**
     * Rename a group
     */
    async renameGroup(node: TreeNode): Promise<void> {
        if (!isCommandGroup(node)) {
            vscode.window.showWarningMessage('Only groups can be renamed');
            return;
        }

        const label = await vscode.window.showInputBox({
            prompt: 'Enter new group name',
            value: node.label
        });

        if (!label) {
            return;
        }

        await this.treeProvider.updateNode(node.id, { label });
        vscode.window.showInformationMessage(`Group renamed to "${label}"`);
    }

    /**
     * Delete a node (command or group)
     */
    async deleteNode(node: TreeNode): Promise<void> {
        await this.treeProvider.deleteNode(node.id);
        vscode.window.showInformationMessage(`"${node.label}" deleted successfully`);
    }

    /**
     * Move node up
     */
    async moveUp(node: TreeNode): Promise<void> {
        await this.treeProvider.moveUp(node.id);
    }

    /**
     * Move node down
     */
    async moveDown(node: TreeNode): Promise<void> {
        await this.treeProvider.moveDown(node.id);
    }

    /**
     * Export all commands to a JSON file
     */
    async exportData(): Promise<void> {
        const uri = await vscode.window.showSaveDialog({
            filters: {
                'JSON': ['json']
            },
            defaultUri: vscode.Uri.file('command-notes-export.json')
        });

        if (!uri) {
            return;
        }

        try {
            const data = await this.treeProvider.getData();
            const jsonContent = JSON.stringify({ commands: data }, null, 2);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
            vscode.window.showInformationMessage(`Commands exported to ${uri.fsPath}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export: ${error}`);
        }
    }

    /**
     * Import commands from a JSON file
     */
    async importData(): Promise<void> {
        const uris = await vscode.window.showOpenDialog({
            filters: {
                'JSON': ['json']
            },
            canSelectMany: false
        });

        if (!uris || uris.length === 0) {
            return;
        }

        try {
            const fileContent = await vscode.workspace.fs.readFile(uris[0]);
            const jsonContent = JSON.parse(fileContent.toString());

            if (!jsonContent.commands || !Array.isArray(jsonContent.commands)) {
                vscode.window.showErrorMessage('Invalid file format. Expected { "commands": [...] }');
                return;
            }

            await this.treeProvider.importData(jsonContent.commands);
            vscode.window.showInformationMessage('Commands imported successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import: ${error}`);
        }
    }

    /**
     * Dispose terminal when extension deactivates
     */
    dispose(): void {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
}
