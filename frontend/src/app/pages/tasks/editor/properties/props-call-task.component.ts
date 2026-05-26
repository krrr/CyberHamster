// SPDX-License-Identifier: GPL-3.0-or-later
//
// Copyright (C) 2026  krrr
//
import { Component, inject, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PropsBase } from './props-base';
import { ApiService } from '../../../../api.service';
import { COMMON_IMPORTS } from '../../../../shared-imports';
import { VariableSelectorComponent } from './variable-selector.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { VAR_TYPE_INFO } from '../editor.service';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
    selector: 'app-props-call-task',
    standalone: true,
    imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzSelectModule, NzTagModule, VariableSelectorComponent, NzRadioModule, ...COMMON_IMPORTS],
    template: `
      <ng-container *transloco="let t">
      <nz-form-item>
        <nz-form-label>{{ t('props.task') }}</nz-form-label>
        <nz-form-control>
          <nz-select [ngModel]="config()?.['task_id']" (ngModelChange)="onTaskChange($event)">
            @for (i of availableTasks(); track i.id) {
                <nz-option [nzValue]="i.id" [nzLabel]="i.name"/>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>{{ t('props.builtin_file') }}</nz-form-label>
        <nz-form-control>
          <app-variable-selector
            [nodeId]="nodeId"
            [value]="config()?.['input_file_var']"
            (valueChange)="updateConfig('input_file_var', $event)"
          />
        </nz-form-control>
      </nz-form-item>

      @if (subTaskParameters.length > 0) {
        <nz-form-label>{{ t('props.parameter_mapping') }}</nz-form-label>
        @for (param of subTaskParameters; track param.name) {
          <div class="param-mapping-box">
            <div style="margin-bottom: 4px;"><strong>{{ param.name }}</strong> 
                <nz-tag [nzColor]="getTypeColor(param.type)" class="type-tag">{{ param.type || 'any' }}</nz-tag>
                <nz-radio-group [ngModel]="getMappingType(param.name)" (ngModelChange)="updateMappingType(param.name, $event)" nzButtonStyle="solid" nzSize="small">
                    <label nz-radio-button nzValue="variable" [title]="t('props.type_variable')"><nz-icon nzType="icon:variable" /></label>
                    <label nz-radio-button nzValue="literal" [title]="t('props.type_literal')"><nz-icon nzType="icon:numeric" /></label>
                </nz-radio-group>
            </div>
            
            <nz-form-item style="margin-bottom: 0;">
              <nz-form-label>{{ t('props.target') }}</nz-form-label>
              <nz-form-control>
                @if (getMappingType(param.name) === 'variable') {
                  <app-variable-selector
                    [nodeId]="nodeId"
                    [value]="getMappingValue(param.name)"
                    size="small"
                    (valueChange)="updateMappingValue(param.name, $event)"
                  />
                } @else {
                  <input
                    nz-input nzSize="small"
                    [ngModel]="getMappingValue(param.name)"
                    (ngModelChange)="updateMappingValue(param.name, $event)"
                  />
                }
              </nz-form-control>
            </nz-form-item>
          </div>
        }
      }
      </ng-container>
  `,
    styles: [`
        .param-mapping-box {
            border: 1px solid var(--border-color-split);
            padding: 6px 8px;
            margin-bottom: 8px;
            border-radius: var(--border-radius-base);
            .type-tag {
                margin-left: 8px;
            }
            nz-radio-group {
                float: right;
            }
        }
    `],
})
export class PropsCallTaskComponent extends PropsBase implements OnInit {
    availableTasks = signal<any[]>([]);
    subTaskParameters: any[] = [];
    apiService = inject(ApiService);

    constructor() {
        super();
        effect(() => {
            const taskId = this.config()?.task_id;
            if (taskId) {
                this.loadSubTaskParameters(taskId);
            } else {
                this.subTaskParameters = [];
            }
        });
    }

    ngOnInit() {
        this.apiService.getTasks().subscribe(tasks => {
            this.availableTasks.set(tasks);
        });
    }

    onTaskChange(taskId: number) {
        this.updateConfig('task_id', taskId);
    }

    loadSubTaskParameters(taskId: number) {
        this.apiService.getTask(taskId).subscribe(task => {
            if (task && task.input_schema && task.input_schema.parameters) {
                this.subTaskParameters = task.input_schema.parameters;
            } else {
                this.subTaskParameters = [];
            }
        });
    }

    getMappingType(paramName: string): string {
        const mapping = this.config()?.parameter_mapping || {};
        return mapping[paramName]?.type || 'variable';
    }

    updateMappingType(paramName: string, type: string) {
        const mapping = { ...(this.config()?.parameter_mapping || {}) };
        mapping[paramName] = { value: '' };
        mapping[paramName].type = type;
        this.updateConfig('parameter_mapping', mapping);
    }

    getMappingValue(paramName: string): string {
        const mapping = this.config()?.parameter_mapping || {};
        return mapping[paramName]?.value || '';
    }

    updateMappingValue(paramName: string, value: string) {
        const mapping = { ...(this.config()?.parameter_mapping || {}) };
        if (!mapping[paramName]) {
            mapping[paramName] = { type: 'variable' };
        }
        mapping[paramName].value = value;
        this.updateConfig('parameter_mapping', mapping);
    }

    getTypeColor(type: string): string {
        return VAR_TYPE_INFO[type]?.color || 'default';
    }
}