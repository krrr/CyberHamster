with open('frontend/src/app/editor/properties/props-call-task.component.ts', 'r') as f:
    content = f.read()

# I used [ngModel]="config()['task_id']" but if config() is undefined, this throws error.
# Also PropsBase initializes config as signal<any>({}), so it shouldn't be undefined.
# But just in case, I should use `config()?.['task_id']` and update `updateConfig`.

content = content.replace("[ngModel]=\"config()['task_id']\"", "[ngModel]=\"config()?.['task_id']\"")

with open('frontend/src/app/editor/properties/props-call-task.component.ts', 'w') as f:
    f.write(content)
