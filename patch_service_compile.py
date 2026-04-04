with open('frontend/src/app/editor/editor.component.html', 'r') as f:
    html = f.read()

search_node = '''<app-props-call-task *ngSwitchCase="'CallTaskNode'" [nodeId]="selectedNode().id"></app-props-call-task>'''

if search_node in html:
    print("HTML looks correct.")
else:
    print("HTML NOT CORRECT")
