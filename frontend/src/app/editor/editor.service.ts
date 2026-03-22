import { inject, Injectable, signal } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClassicPreset, NodeEditor } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';


export interface VariableInfo {
    value: string; // "node_id:var_name"
    label: string; // "Node Name > var_name"
}

@Injectable({
    providedIn: 'root'
})
export class EditorService {
    editor!: NodeEditor<any>;
    area!: AreaPlugin<any, any>;
    nodeConfigs = signal<{ [id: string]: any }>({});
    message = inject(NzMessageService);

    patchNodeData(node: any, name: string, config: any) {
        node.label = name;
        (node as any).customConfig = config;
    }

    getNodeConfig(nodeId: string) {
        return this.nodeConfigs()[nodeId].config;
    }

    updateNodeConfig(nodeId: string, field: string, value: any) {
        this.nodeConfigs.update((configs) => ({
            ...configs,
            [nodeId]: {
                ...configs[nodeId],
                config: { ...configs[nodeId].config, [field]: value },
            },
        }));

        const node = this.editor.getNode(nodeId);
        if (node) {
            this.patchNodeData(node, this.nodeConfigs()[nodeId].name, this.nodeConfigs()[nodeId].config);
            this.area.update('node', nodeId);
        }
    }

    getAvailableVariables(nodeId: string): VariableInfo[] {
        const variables: VariableInfo[] = [];
        const visited = new Set<string>();
        const queue = [nodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const connections = this.editor.getConnections().filter(c => c.target === currentId);
            for (const conn of connections) {
                const sourceId = conn.source;
                queue.push(sourceId);

                const sourceNode = this.editor.getNode(sourceId) as any;
                const sourceConfig = this.nodeConfigs()[sourceId];
                const nodeName = sourceConfig?.name || sourceNode?.label || sourceId;

                const addVar = (varName: string) => {
                    variables.push({
                        value: `${sourceId}:${varName}`,
                        label: `${nodeName} > ${varName}`
                    });
                };

                if (sourceNode?.type === 'StartNode') {
                    addVar('file');
                } else if (sourceNode?.type === 'CodeEvalNode') {
                    addVar(sourceConfig?.config?.output_var || 'eval_result');
                } else if (sourceNode?.type === 'MetadataReadNode') {
                    addVar('metadata');
                } else if (sourceNode?.type === 'ConvertNode' || sourceNode?.type === 'FFmpegActionNode' || sourceNode?.type === 'FileOperationNode' || sourceNode?.type === 'MetadataWriteNode') {
                    addVar('file');
                } else {
                    if (sourceConfig?.config?.output_var) {
                        addVar(sourceConfig.config.output_var);
                    }
                }
            }
        }
        return variables;
    }

    // Call this after a connection is added to automatically link input_file_var
    autoLinkVariable(connection: any) {
        const sourceId = connection.source;
        const targetId = connection.target;
        const targetNode = this.editor.getNode(targetId) as any;
        const sourceNode = this.editor.getNode(sourceId) as any;

        // If target node is a node that usually takes a file input
        const fileInputNodes = ['ConvertNode', 'FFmpegActionNode', 'MetadataReadNode', 'FileOperationNode'];
        const targetConfig = this.nodeConfigs()[targetId]?.config;

        if (fileInputNodes.includes(targetNode?.type)) {
            // Only auto-link if not already set or if it's the first connection
            if (!targetConfig?.input_file_var) {
                this.updateNodeConfig(targetId, 'input_file_var', `${sourceId}:file`);
            }
        } else if (targetNode?.type === 'MetadataWriteNode') {
            if (!targetConfig?.target_file_var) {
                this.updateNodeConfig(targetId, 'target_file_var', `${sourceId}:file`);
            }
        }
    }

    async addNode(nodeType: string) {
        if (nodeType === 'StartNode' && this.editor.getNodes().some((n: any) => n.type === 'StartNode')) {
            console.error('Only one Start node is allowed');
            return;
        }

        const node = new TaskNode(nodeType, NODE_INFO[nodeType].label);

        if (nodeType !== 'StartNode') {
            node.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('Data')));
        }

        if (nodeType === 'ConditionNode') {
            node.addOutput('true_branch', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
            node.addOutput('false_branch', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
        } else if (nodeType !== 'FinishNode') {
            node.addOutput('default', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
        }

        await this.editor.addNode(node);

        this.nodeConfigs.update((configs) => ({
            ...configs,
            [node.id]: { name: NODE_INFO[nodeType].label, config: {} },
        }));
        this.patchNodeData(node, NODE_INFO[nodeType].label, {});

        const center = this.area.area.pointer;
        await this.area.translate(node.id, { x: center.x, y: center.y });
    }
}


export const NODE_INFO: Record<string, { icon: string; color: string, label: string }> = {
    StartNode: { icon: 'home', color: '#1890ff', label: 'Start' },
    FinishNode: { icon: 'check-circle', color: '#52c41a', label: 'Finish / Output' },
    MetadataReadNode: { icon: 'folder-open', color: '#c655df', label: 'Read Media Metadata' },
    ConvertNode: { icon: 'sync', color: '#f04951', label: 'Convert Format' },
    CodeEvalNode: { icon: 'code', color: '#945de1', label: 'Code Eval' },
    ConditionNode: { icon: 'branches', color: '#faad14', label: 'Condition Branch' },
    FileOperationNode: { icon: 'file-text', color: '#e1449b', label: 'File Operation' },
    MetadataWriteNode: { icon: 'edit', color: '#13c2c2', label: 'Write Media Metadata' },
    FFmpegActionNode: { icon: 'video-camera', color: '#c2dd2f', label: 'FFmpeg Action' },
};

export class TaskNode extends ClassicPreset.Node {
    type: string

    constructor(type: string, label: string) {
        super(label);
        this.type = type;
    }
}

export class TaskConnection<N extends TaskNode> extends ClassicPreset.Connection<N, N> {}