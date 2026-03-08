import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { COMMON_IMPORTS } from '../shared-imports';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    FormsModule,
    NzTableModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTagModule,
    NzDividerModule,
    ...COMMON_IMPORTS
  ],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class TasksComponent implements OnInit {
  tasks = signal<any[]>([]);

  isModalVisible = signal(false);
  isEditing = signal(false);
  editingTaskId = signal<number | null>(null);

  taskForm = signal({
    name: '',
    watch_folder: '',
    status: 'active'
  });

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
      this.tasks.set(tasks);
    });
  }

  showModal(task?: any) {
    if (task) {
      this.isEditing.set(true);
      this.editingTaskId.set(task.id);
      this.taskForm.set({
        name: task.name,
        watch_folder: task.watch_folder,
        status: task.status
      });
    } else {
      this.isEditing.set(false);
      this.editingTaskId.set(null);
      this.taskForm.set({ name: '', watch_folder: '', status: 'active' });
    }
    this.isModalVisible.set(true);
  }

  handleCancel() {
    this.isModalVisible.set(false);
  }

  handleOk() {
    const currentForm = this.taskForm();
    if (!currentForm.name || !currentForm.watch_folder) {
      this.message.warning("Please fill all required fields");
      return;
    }

    if (this.isEditing() && this.editingTaskId()) {
      this.apiService.updateTask(this.editingTaskId()!, currentForm).subscribe(() => {
        this.message.success('Task updated');
        this.loadTasks();
        this.isModalVisible.set(false);
      });
    } else {
      // Create empty DAG first
      const dagPayload = {
        name: `${currentForm.name} DAG`,
        description: `DAG for task ${currentForm.name}`,
        json_data: { nodes: {}, edges: [], start_node: null }
      };

      this.apiService.createDag(dagPayload).subscribe(newDag => {
        const newTask = {
          ...currentForm,
          dag_id: newDag.id
        };
        this.apiService.createTask(newTask).subscribe(() => {
          this.message.success('Task created');
          this.loadTasks();
          this.isModalVisible.set(false);
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
    this.router.navigate(['/tasks', taskId, 'editor']);
  }

  updateForm(field: string, value: any) {
    this.taskForm.update(prev => ({ ...prev, [field]: value }));
  }
}
