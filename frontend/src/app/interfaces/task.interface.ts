export interface Task {
    id?: number;
    name: string;
    description?: string;
    icon?: string;
    json_data?: any;
    created_at?: string;
    updated_at?: string;
    folders?: any[]; // We use any[] here to avoid circular dependencies if strictness isn't fully required, or we could import Folder
}
