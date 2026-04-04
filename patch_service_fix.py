with open('frontend/src/app/editor/editor.component.html', 'r') as f:
    html = f.read()

# Make sure it's valid: <app-props-call-task *ngSwitchCase="'CallTaskNode'" [nodeId]="selectedNode().id"></app-props-call-task>
