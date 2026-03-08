import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTagModule,
    NzDividerModule
  ],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];

  isModalVisible = false;
  isEditing = false;
  editingTaskId: number | null = null;

  taskForm: any = {
    name: '',
    watch_folder: '',
    status: 'active'
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.apiService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  showModal(task?: any) {
    if (task) {
      this.isEditing = true;
      this.editingTaskId = task.id;
      this.taskForm = {
        name: task.name,
        watch_folder: task.watch_folder,
        status: task.status
      };
    } else {
      this.isEditing = false;
      this.editingTaskId = null;
      this.taskForm = { name: '', watch_folder: '', status: 'active' };
    }
    this.isModalVisible = true;
  }

  handleCancel() {
    this.isModalVisible = false;
  }

  handleOk() {
    if (!this.taskForm.name || !this.taskForm.watch_folder) {
      this.message.warning("Please fill all required fields");
      return;
    }

    if (this.isEditing && this.editingTaskId) {
      this.apiService.updateTask(this.editingTaskId, this.taskForm).subscribe(() => {
        this.message.success('Task updated');
        this.loadTasks();
        this.isModalVisible = false;
      });
    } else {
      // Create empty DAG first
      const dagPayload = {
        name: `${this.taskForm.name} DAG`,
        description: `DAG for task ${this.taskForm.name}`,
        json_data: { nodes: {}, edges: [], start_node: null }
      };

      this.apiService.createDag(dagPayload).subscribe(newDag => {
        const newTask = {
          ...this.taskForm,
          dag_id: newDag.id
        };
        this.apiService.createTask(newTask).subscribe(() => {
          this.message.success('Task created');
          this.loadTasks();
          this.isModalVisible = false;
        });
      });
    }
  }

  deleteTask(id: number) {
    this.apiService.deleteTask(id).subscribe(() => {
      this.message.success('Task deleted');
      this.loadTasks();
    });
  }

  toggleTaskStatus(task: any) {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    this.apiService.updateTask(task.id, { status: newStatus }).subscribe(() => {
      this.message.success(`Task ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      this.loadTasks();
    });
  }

  openEditor(taskId: number) {
    this.router.navigate(['/editor', taskId]);
  }
}
