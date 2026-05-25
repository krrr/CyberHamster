import { Component, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { PropsBase } from './props-base';
import { COMMON_IMPORTS } from '../../../../shared-imports';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Task } from '../../../../interfaces/task.interface';

@Component({
    selector: 'app-props-start',
    standalone: true,
    imports: [CommonModule, NzAlertModule, NzFormModule, NzSelectModule,  ...COMMON_IMPORTS],
    template: `
        <ng-container *transloco="let t">
            <div class="divider-title">{{ t('props.input_parameters') }}</div>
            
            <div class="system-var">
                <strong>{{ t('props.builtin_file') }}</strong> (file)
                <div style="font-size: 12px; color: #888;">[System / Optional]</div>
            </div>

            @for (param of getParameters(); track $index) {
            <div class="cond-div">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>{{ t('props.custom_param') }} {{ $index + 1 }}</strong>
                    <button nz-button nzType="text" nzDanger nzSize="small" (click)="removeParameter($index)"><span nz-icon nzType="delete"></span></button>
                </div>
                <div class="ant-form">
                    <nz-form-item>
                        <nz-form-label>{{ t('props.param_name') }}</nz-form-label>
                        <nz-form-control>
                            <input nz-input nzSize="small"
                                [ngModel]="param.name"
                                (ngModelChange)="updateParameter($index, 'name', $event)" />
                        </nz-form-control>
                    </nz-form-item>
                    <nz-form-item style="margin-bottom: 0;">
                        <nz-form-label>{{ t('common.data_type') }}</nz-form-label>
                        <nz-form-control>
                            <nz-select nzSize="small"
                                [ngModel]="param.type || 'any'"
                                (ngModelChange)="updateParameter($index, 'type', $event)">
                                <nz-option nzValue="int" nzLabel="int"/>
                                <nz-option nzValue="float" nzLabel="float"/>
                                <nz-option nzValue="str" nzLabel="str"/>
                                <nz-option nzValue="any" nzLabel="any"/>
                            </nz-select>
                        </nz-form-control>
                    </nz-form-item>
                </div>
            </div>
            }

            <button nz-button nzType="dashed" nzBlock (click)="addParameter()" class="add-btn">
                <span nz-icon nzType="plus"></span> {{ t('props.add_param') }}
            </button>
        </ng-container>
    `,
    styles: [`
        :host {
            display: block;
            margin-top: 10px;
        }

        .property-editor {
            position: absolute;
            top: 66px;
            right: 16px;
            width: 380px;
            max-height: calc(100% - 82px);
            background: var(--popover-background);
            border-radius: 2px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10;
            border: 1px solid var(--border-color-split);
            display: flex;
            flex-direction: column;

            .props-area {
                flex: 1;
                overflow-y: auto;
                scrollbar-width: thin;
                padding: 0 16px;
                padding-bottom: 12px;

                ::ng-deep .ant-form-item {
                    margin-bottom: 8px;
                }

                .divider-title {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 8px;
                }
            }
        }
        
        .add-btn {
            margin-bottom: 12px;
        }
        .system-var {
            padding: 10px;
            margin-bottom: 10px;
            background-color: var(--highlight-color);
            border-radius: 4px;
            border: 1px solid var(--border-color-split);
        }
        .cond-div {
            border: 1px solid var(--border-color-split);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            .ant-form-item {
                margin-bottom: 2px;
            }
        }
    `]
})
export class PropsStartComponent extends PropsBase implements OnInit {
    task!: Task;

    ngOnInit(): void {
        this.task = this.editorService.currentTask();
        console.assert(!!this.task);
        if (!this.task.input_schema) {
            this.task.input_schema = { parameters: [] };
        }
    }

    getParameters(): any[] {
        if (!this.task || !this.task.input_schema) {
            return [];
        }
        return this.task.input_schema.parameters || [];
    }

    addParameter() {
        const schema = this.task.input_schema || { parameters: [] };
        const parameters = schema.parameters ? [...schema.parameters] : [];
        parameters.push({ name: '', type: 'any' });
        this.task.input_schema = { ...schema, parameters };
    }

    removeParameter(index: number) {
        const schema = this.task.input_schema;
        if (schema && schema.parameters) {
            const parameters = [...schema.parameters];
            parameters.splice(index, 1);
            this.task.input_schema = { ...schema, parameters };
        }
    }

    updateParameter(index: number, field: string, value: any) {
        const schema = this.task.input_schema;
        if (schema && schema.parameters && schema.parameters[index]) {
            const parameters = [...schema.parameters];
            parameters[index] = { ...parameters[index], [field]: value };
            this.task.input_schema = { ...schema, parameters };
        }
    }
}
