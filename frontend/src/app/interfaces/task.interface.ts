// SPDX-License-Identifier: GPL-3.0-or-later
//
// Copyright (C) 2026  krrr
//
export interface Task {
    id?: number;
    name: string;
    description?: string;
    input_schema?: any;
    icon?: string;
    json_data?: any;
    created_at?: string;
    updated_at?: string;
    folders?: any[]; // We use any[] here to avoid circular dependencies if strictness isn't fully required, or we could import Folder
}
