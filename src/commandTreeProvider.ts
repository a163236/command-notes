import * as vscode from 'vscode';
import { TreeNode, CommandItem, CommandGroup, isCommandGroup, isCommandItem } from './types';
import { StorageService } from './storageService';

export class CommandTreeItem extends vscode.TreeItem {
    constructor(
        public readonly node: TreeNode,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        // For command items, show the command itself as the main label
        // For groups, show the label
        const displayText = isCommandItem(node) ? node.command : node.label;
        super(displayText, collapsibleState);

        if (isCommandItem(node)) {
            this.tooltip = node.command;
            // Don't set description to avoid duplicate display
            this.iconPath = new vscode.ThemeIcon('terminal');
            this.contextValue = 'commandItem';

            // Add inline action buttons for execute and copy
            this.command = undefined; // We'll use context menu instead
        } else {
            this.tooltip = node.label;
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'commandGroup';
        }
    }
}

export class CommandTreeProvider implements vscode.TreeDataProvider<TreeNode>, vscode.TreeDragAndDropController<TreeNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | null | void> = new vscode.EventEmitter<TreeNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

    dropMimeTypes = ['application/vnd.code.tree.commandNotes'];
    dragMimeTypes = ['application/vnd.code.tree.commandNotes'];

    private data: TreeNode[] = [];

    constructor(private storageService: StorageService) { }

    async initialize(): Promise<void> {
        this.data = await this.storageService.load();
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        const isGroup = isCommandGroup(element);
        const collapsibleState = isGroup
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;

        return new CommandTreeItem(element, collapsibleState);
    }

    getChildren(element?: TreeNode): Thenable<TreeNode[]> {
        if (!element) {
            // Root level
            return Promise.resolve(this.data);
        }

        if (isCommandGroup(element)) {
            return Promise.resolve(element.children);
        }

        return Promise.resolve([]);
    }

    getParent(element: TreeNode): vscode.ProviderResult<TreeNode> {
        const parent = this.storageService.findParent(this.data, element.id);
        return parent;
    }

    // Drag and Drop implementation
    async handleDrag(source: TreeNode[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        dataTransfer.set('application/vnd.code.tree.commandNotes', new vscode.DataTransferItem(source));
    }

    async handleDrop(target: TreeNode | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = dataTransfer.get('application/vnd.code.tree.commandNotes');
        if (!transferItem) {
            return;
        }

        const source: TreeNode[] = transferItem.value;
        if (source.length === 0) {
            return;
        }

        const sourceNode = source[0];

        if (!target) {
            // Dropped at root level
            this.data = this.storageService.deleteNode(this.data, sourceNode.id);
            this.data.push(sourceNode);
        } else if (isCommandGroup(target)) {
            // Dropped into a group
            this.data = this.storageService.moveNode(this.data, sourceNode.id, target.id, 'inside');
        } else {
            // Dropped near another item (we'll add it after)
            this.data = this.storageService.moveNode(this.data, sourceNode.id, target.id, 'after');
        }

        await this.storageService.save(this.data);
        this.refresh();
    }

    // Data manipulation methods
    async addCommand(label: string, command: string, description: string | undefined, parentId?: string): Promise<void> {
        const newCommand: CommandItem = {
            id: this.storageService.generateId(),
            type: 'command',
            label,
            command,
            description
        };

        if (parentId) {
            // Add to specific group
            this.data = this.addToGroup(this.data, parentId, newCommand);
        } else {
            // Add to root
            this.data.push(newCommand);
        }

        await this.storageService.save(this.data);
        this.refresh();
    }

    async addGroup(label: string, parentId?: string): Promise<void> {
        const newGroup: CommandGroup = {
            id: this.storageService.generateId(),
            type: 'group',
            label,
            children: []
        };

        if (parentId) {
            this.data = this.addToGroup(this.data, parentId, newGroup);
        } else {
            this.data.push(newGroup);
        }

        await this.storageService.save(this.data);
        this.refresh();
    }

    async deleteNode(id: string): Promise<void> {
        this.data = this.storageService.deleteNode(this.data, id);
        await this.storageService.save(this.data);
        this.refresh();
    }

    async updateNode(id: string, updates: Partial<CommandItem | CommandGroup>): Promise<void> {
        this.data = this.storageService.updateNode(this.data, id, updates);
        await this.storageService.save(this.data);
        this.refresh();
    }

    async moveUp(id: string): Promise<void> {
        const parent = this.storageService.findParent(this.data, id);
        const siblings = parent ? parent.children : this.data;
        const index = siblings.findIndex(node => node.id === id);

        if (index > 0) {
            [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
            await this.storageService.save(this.data);
            this.refresh();
        }
    }

    async moveDown(id: string): Promise<void> {
        const parent = this.storageService.findParent(this.data, id);
        const siblings = parent ? parent.children : this.data;
        const index = siblings.findIndex(node => node.id === id);

        if (index >= 0 && index < siblings.length - 1) {
            [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
            await this.storageService.save(this.data);
            this.refresh();
        }
    }

    findNodeById(id: string): TreeNode | null {
        return this.storageService.findNodeById(this.data, id);
    }

    /**
     * Get all data for export
     */
    getData(): TreeNode[] {
        return this.data;
    }

    /**
     * Import data from external source
     */
    async importData(nodes: TreeNode[]): Promise<void> {
        this.data = nodes;
        await this.storageService.save(this.data);
        this.refresh();
    }

    private addToGroup(nodes: TreeNode[], groupId: string, nodeToAdd: TreeNode): TreeNode[] {
        return nodes.map(node => {
            if (node.id === groupId && isCommandGroup(node)) {
                return {
                    ...node,
                    children: [...node.children, nodeToAdd]
                };
            }
            if (isCommandGroup(node)) {
                return {
                    ...node,
                    children: this.addToGroup(node.children, groupId, nodeToAdd)
                };
            }
            return node;
        });
    }
}
