// SPDX-License-Identifier: GPL-3.0-or-later
//
// Copyright (C) 2026  krrr
//

export function sleep(timeout: number) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}