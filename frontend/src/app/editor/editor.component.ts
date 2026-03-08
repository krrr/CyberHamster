import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditor, GetSchemes, ClassicPreset } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { AngularPlugin, Presets, AngularArea2D } from 'rete-angular-plugin/18';
import { ApiService } from '../api.service';
import { Subscription } from 'rxjs';

type Schemes = GetSchemes<
  ClassicPreset.Node,
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;
type AreaExtra = AngularArea2D<Schemes>;

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements AfterViewInit, OnInit {
  @ViewChild('rete') container!: ElementRef<HTMLElement>;
  logs: string[] = [];
  private logSubscription: Subscription | undefined;
  
  editor = new NodeEditor<Schemes>();

  constructor(private apiService: ApiService, private injector: Injector) {}

  ngOnInit() {
    this.apiService.connectLogsWebSocket();
    this.logSubscription = this.apiService.logs$.subscribe(log => {
      this.logs.push(log);
    });
  }

  ngOnDestroy() {
    if (this.logSubscription) {
      this.logSubscription.unsubscribe();
    }
  }

  async ngAfterViewInit() {
    const area = new AreaPlugin<Schemes, AreaExtra>(this.container.nativeElement);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const render = new AngularPlugin<Schemes, AreaExtra>({ injector: this.injector });

    AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
      accumulating: AreaExtensions.accumulateOnCtrl()
    });

    render.addPreset(Presets.classic.setup());
    connection.addPreset(ConnectionPresets.classic.setup());

    this.editor.use(area);
    area.use(connection);
    area.use(render);

    AreaExtensions.simpleNodesOrder(area);

    const n1 = new ClassicPreset.Node('ReadInputNode');
    n1.addOutput('default', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
    await this.editor.addNode(n1);

    const n2 = new ClassicPreset.Node('ConvertNode');
    n2.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('Data')));
    n2.addOutput('default', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
    await this.editor.addNode(n2);

    const n3 = new ClassicPreset.Node('CalculateCompressionNode');
    n3.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('Data')));
    n3.addOutput('default', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
    await this.editor.addNode(n3);

    const n4 = new ClassicPreset.Node('ConditionNode');
    n4.addInput('input', new ClassicPreset.Input(new ClassicPreset.Socket('Data')));
    n4.addOutput('true_branch', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
    n4.addOutput('false_branch', new ClassicPreset.Output(new ClassicPreset.Socket('Data')));
    await this.editor.addNode(n4);

    await this.editor.addConnection(new ClassicPreset.Connection(n1, 'default', n2, 'input'));
    await this.editor.addConnection(new ClassicPreset.Connection(n2, 'default', n3, 'input'));
    await this.editor.addConnection(new ClassicPreset.Connection(n3, 'default', n4, 'input'));

    await area.translate(n1.id, { x: 0, y: 0 });
    await area.translate(n2.id, { x: 250, y: 0 });
    await area.translate(n3.id, { x: 500, y: 0 });
    await area.translate(n4.id, { x: 750, y: 0 });

    setTimeout(() => {
      AreaExtensions.zoomAt(area, this.editor.getNodes());
    }, 100);
  }

  executeDag() {
    // Scenario 1 DAG definition from test_scenario_1.py
    const dag = {
      "start_node": "node_1",
      "nodes": {
          "node_1": {"type": "ReadInputNode", "name": "Read JPG", "config": {}},
          "node_2": {"type": "ConvertNode", "name": "Convert AVIF", "config": {"tool": "imagemagick", "target_extension": ".avif"}},
          "node_3": {"type": "CalculateCompressionNode", "name": "Calc Comp", "config": {}},
          "node_4": {"type": "ConditionNode", "name": "Check Threshold", "config": {"variable": "compression_ratio", "operator": "<", "threshold": 0.8}},
          "node_5": {"type": "FileOperationNode", "name": "Replace", "config": {"action": "overwrite", "target_extension": ".avif"}},
          "node_6": {"type": "FileOperationNode", "name": "Cleanup", "config": {"action": "cleanup"}},
          "node_7": {"type": "MetadataWriteNode", "name": "Write Meta", "config": {"tags": {"XMP:ProcessingStatus": "LowCompression_Skipped"}, "write_to_original": true}}
      },
      "edges": [
          {"source": "node_1", "target": "node_2", "branch": "default"},
          {"source": "node_2", "target": "node_3", "branch": "default"},
          {"source": "node_3", "target": "node_4", "branch": "default"},
          {"source": "node_4", "target": "node_5", "branch": "true_branch"},
          {"source": "node_4", "target": "node_6", "branch": "false_branch"},
          {"source": "node_6", "target": "node_7", "branch": "default"}
      ]
    };
    
    const mockFilePath = "tests/test.jpg"; // Path relative to backend root
    this.apiService.executeDag(dag, mockFilePath).subscribe({
      next: (res) => console.log('Execution response:', res),
      error: (err) => console.error('Execution error:', err)
    });
  }
}
