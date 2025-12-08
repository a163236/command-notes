/**
 * Represents a single command that can be executed
 */
export interface CommandItem {
    id: string;
    type: 'command';
    label: string;
    command: string;
    description?: string;
}

/**
 * Represents a group/folder that contains commands or other groups
 */
export interface CommandGroup {
    id: string;
    type: 'group';
    label: string;
    children: TreeNode[];
}

/**
 * Union type for tree nodes
 */
export type TreeNode = CommandItem | CommandGroup;

/**
 * Type guard to check if a node is a command item
 */
export function isCommandItem(node: TreeNode): node is CommandItem {
    return node.type === 'command';
}

/**
 * Type guard to check if a node is a command group
 */
export function isCommandGroup(node: TreeNode): node is CommandGroup {
    return node.type === 'group';
}

/**
 * Root data structure for storage
 */
export interface CommandData {
    commands: TreeNode[];
}
