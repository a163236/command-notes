import * as vscode from 'vscode';
import { CommandData, TreeNode, CommandItem, CommandGroup, isCommandGroup } from './types';

const STORAGE_KEY = 'commandNotes.data';

export class StorageService {
    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Load commands from global storage
     */
    async load(): Promise<TreeNode[]> {
        const data = this.context.globalState.get<CommandData>(STORAGE_KEY);
        return data?.commands || [];
    }

    /**
     * Save commands to global storage
     */
    async save(commands: TreeNode[]): Promise<void> {
        const data: CommandData = { commands };
        await this.context.globalState.update(STORAGE_KEY, data);
    }

    /**
     * Generate a unique ID for new items
     */
    generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Find a node by ID in the tree
     */
    findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            if (isCommandGroup(node)) {
                const found = this.findNodeById(node.children, id);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    /**
     * Find the parent group of a node
     */
    findParent(nodes: TreeNode[], targetId: string, parent: CommandGroup | null = null): CommandGroup | null {
        for (const node of nodes) {
            if (node.id === targetId) {
                return parent;
            }
            if (isCommandGroup(node)) {
                const found = this.findParent(node.children, targetId, node);
                if (found !== null) {
                    return found;
                }
            }
        }
        return null;
    }

    /**
     * Delete a node from the tree
     */
    deleteNode(nodes: TreeNode[], id: string): TreeNode[] {
        return nodes.filter(node => {
            if (node.id === id) {
                return false;
            }
            if (isCommandGroup(node)) {
                node.children = this.deleteNode(node.children, id);
            }
            return true;
        });
    }

    /**
     * Update a node in the tree
     */
    updateNode(nodes: TreeNode[], id: string, updates: Partial<CommandItem | CommandGroup>): TreeNode[] {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, ...updates } as TreeNode;
            }
            if (isCommandGroup(node)) {
                return {
                    ...node,
                    children: this.updateNode(node.children, id, updates)
                } as CommandGroup;
            }
            return node;
        });
    }

    /**
     * Move a node within the tree (for drag-and-drop)
     */
    moveNode(nodes: TreeNode[], sourceId: string, targetId: string, position: 'before' | 'after' | 'inside'): TreeNode[] {
        // Find the source node
        const sourceNode = this.findNodeById(nodes, sourceId);
        if (!sourceNode) {
            return nodes;
        }

        // Remove source node from tree
        let newNodes = this.deleteNode(nodes, sourceId);

        // Find target and insert source
        if (position === 'inside') {
            // Insert into target group
            newNodes = this.insertIntoGroup(newNodes, targetId, sourceNode);
        } else {
            // Insert before or after target
            newNodes = this.insertNearNode(newNodes, targetId, sourceNode, position);
        }

        return newNodes;
    }

    private insertIntoGroup(nodes: TreeNode[], groupId: string, nodeToInsert: TreeNode): TreeNode[] {
        return nodes.map(node => {
            if (node.id === groupId && isCommandGroup(node)) {
                return {
                    ...node,
                    children: [...node.children, nodeToInsert]
                };
            }
            if (isCommandGroup(node)) {
                return {
                    ...node,
                    children: this.insertIntoGroup(node.children, groupId, nodeToInsert)
                };
            }
            return node;
        });
    }

    private insertNearNode(nodes: TreeNode[], targetId: string, nodeToInsert: TreeNode, position: 'before' | 'after'): TreeNode[] {
        const result: TreeNode[] = [];

        for (const node of nodes) {
            if (node.id === targetId) {
                if (position === 'before') {
                    result.push(nodeToInsert, node);
                } else {
                    result.push(node, nodeToInsert);
                }
            } else {
                if (isCommandGroup(node)) {
                    result.push({
                        ...node,
                        children: this.insertNearNode(node.children, targetId, nodeToInsert, position)
                    });
                } else {
                    result.push(node);
                }
            }
        }

        return result;
    }
}
