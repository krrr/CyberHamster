import { Task } from './task.interface';

export interface Folder {
    id?: number;
    name: string;
    watch_folder: string;
    status: 'active' | 'paused';
    scan_interval: number;
    real_time_watch: boolean;
    filename_regex?: string;
    created_at?: string;
    tasks?: Task[];
}

export interface FolderForm extends Omit<Folder, 'id' | 'created_at' | 'tasks'> {
    task_ids: number[];
}

export function createDefaultFolder(): Folder {
    return {
        name: '',
        watch_folder: '',
        status: 'active',
        scan_interval: 60,
        real_time_watch: true,
        filename_regex: '',
    };
}

export function createDefaultFolderForm(): FolderForm {
    return {
        ...createDefaultFolder() as FolderForm,
        task_ids: [],
    };
}
