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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { COMMON_IMPORTS } from '../shared-imports';
import { FileDialogComponent } from '../components/file-dialog/file-dialog.component';

@Component({
    selector: 'app-folders',
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
        NzSelectModule,
        NzCheckboxModule,
        NzTabsModule,
        NzEmptyModule,
        FileDialogComponent,
        ...COMMON_IMPORTS,
    ],
    templateUrl: './folders.component.html',
    styleUrls: ['./folders.component.scss'],
})
export class FoldersComponent implements OnInit {
    folders = signal<any[]>([]);
    tasks = signal<any[]>([]);

    isModalVisible = signal(false);
    isEditing = signal(false);
    editingFolderId = signal<number | null>(null);

    isFileDialogVisible = false;

    folderForm = signal({
        name: '',
        watch_folder: '',
        status: 'active',
        task_ids: [] as number[],
        scan_interval: 60,
        real_time_watch: true,
        filename_regex: '',
    });

    constructor(
        private apiService: ApiService,
        private router: Router,
        private message: NzMessageService,
    ) {}

    ngOnInit() {
        this.loadFolders();
        this.loadTasks();
    }

    loadFolders() {
        this.apiService.getFolders().subscribe((folders) => {
            this.folders.set(folders);
        });
    }

    loadTasks() {
        this.apiService.getTasks().subscribe((tasks) => {
            this.tasks.set(tasks);
        });
    }

    showModal(folder?: any) {
        if (folder) {
            this.isEditing.set(true);
            this.editingFolderId.set(folder.id);
            this.folderForm.set({
                name: folder.name,
                watch_folder: folder.watch_folder,
                status: folder.status,
                task_ids: folder.tasks ? folder.tasks.map((t: any) => t.id) : [],
                scan_interval: folder.scan_interval !== undefined ? folder.scan_interval : 60,
                real_time_watch: folder.real_time_watch !== undefined ? folder.real_time_watch : true,
                filename_regex: folder.filename_regex || '',
            });
        } else {
            this.isEditing.set(false);
            this.editingFolderId.set(null);
            this.folderForm.set({
                name: '',
                watch_folder: '',
                status: 'active',
                task_ids: [],
                scan_interval: 60,
                real_time_watch: true,
                filename_regex: '',
            });
        }
        this.isModalVisible.set(true);
    }

    handleCancel() {
        this.isModalVisible.set(false);
    }

    handleOk() {
        const currentForm = this.folderForm();
        if (!currentForm.name || !currentForm.watch_folder || !currentForm.task_ids.length) {
            this.message.warning('Please fill all required fields (Name, Watch Folder, Task)');
            return;
        }

        const payload = {
            folder: {
                name: currentForm.name,
                watch_folder: currentForm.watch_folder,
                status: currentForm.status,
                scan_interval: currentForm.scan_interval,
                real_time_watch: currentForm.real_time_watch,
                filename_regex: currentForm.filename_regex,
            },
            task_ids: currentForm.task_ids
        };

        if (this.isEditing() && this.editingFolderId()) {
            this.apiService.updateFolder(this.editingFolderId()!, payload).subscribe(() => {
                this.message.success('Folder updated');
                this.loadFolders();
                this.isModalVisible.set(false);
            });
        } else {
            this.apiService.createFolder(payload).subscribe(() => {
                this.message.success('Folder created');
                this.loadFolders();
                this.isModalVisible.set(false);
            });
        }
    }

    deleteFolder(id: number) {
        this.apiService.deleteFolder(id).subscribe(() => {
            this.message.success('Folder deleted');
            this.loadFolders();
        });
    }

    toggleFolderStatus(folder: any) {
        const newStatus = folder.status === 'active' ? 'paused' : 'active';
        const payload = {
            folder: {
                name: folder.name,
                watch_folder: folder.watch_folder,
                status: newStatus,
                scan_interval: folder.scan_interval,
                real_time_watch: folder.real_time_watch,
                filename_regex: folder.filename_regex,
            },
            task_ids: folder.tasks ? folder.tasks.map((t: any) => t.id) : []
        };
        this.apiService.updateFolder(folder.id, payload).subscribe(() => {
            this.message.success(`Folder ${newStatus === 'active' ? 'resumed' : 'paused'}`);
            this.loadFolders();
        });
    }

    updateForm(field: string, value: any) {
        this.folderForm.update((prev) => ({ ...prev, [field]: value }));
    }

    openFileDialog() {
        this.isFileDialogVisible = true;
    }

    onFolderSelected(path: string) {
        this.updateForm('watch_folder', path);
    }

    getTaskName(taskId: number): string {
        const task = this.tasks().find((t) => t.id === taskId);
        return task ? task.name : 'Unknown Task';
    }

    getTaskIcon(taskId: number): string {
        const task = this.tasks().find((t) => t.id === taskId);
        return task ? task.icon || '🐹' : '❓';
    }
}
