// SPDX-License-Identifier: GPL-3.0-or-later
//
// Copyright (C) 2026  krrr
//
export interface LogMessage {
    time: string;
    level: string;
    message: string;
    name?: string;
    record_id?: number | null;
}
