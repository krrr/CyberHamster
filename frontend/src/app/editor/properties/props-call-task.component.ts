import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { PropsBase } from './props-base';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-props-call-task',
    standalone: true,
    imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzSelectModule],
    template: `
    <div *ngIf="config()">
      <nz-form-item>
        <nz-form-label [nzSm]="24" [nzXs]="24">Task ID</nz-form-label>
        <nz-form-control [nzSm]="24" [nzXs]="24">
          <nz-select [ngModel]="config()?.['task_id']" (ngModelChange)="updateConfig('task_id', $event)" nzPlaceHolder="Select Task">
            <nz-option *ngFor="let task of availableTasks" [nzValue]="task.id" [nzLabel]="task.name"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>
    </div>
  `,
    styles: [],
})
export class PropsCallTaskComponent extends PropsBase implements OnInit {
    availableTasks: any[] = [];

    constructor(
        private apiService: ApiService
    ) {
        super();
    }

    ngOnInit() {
        this.apiService.getTasks().subscribe(tasks => {
            this.availableTasks = tasks;
        });
    }
}
