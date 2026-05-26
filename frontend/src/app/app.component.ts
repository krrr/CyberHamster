// SPDX-License-Identifier: GPL-3.0-or-later
//
// Copyright (C) 2026  krrr
//
import { Component, inject, OnInit, signal, effect, computed, ViewChild, TemplateRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { COMMON_IMPORTS } from './shared-imports';
import { ApiService } from './api.service';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';
import { MatRippleModule } from './components/mat-ripple';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, NzLayoutModule, NzModalModule, MatRippleModule, ...COMMON_IMPORTS],
    template: `
        <nz-layout class="app-layout" *transloco="let t">
                <nz-sider nzCollapsible [nzCollapsed]="isCollapsed()" [nzTrigger]="null" nzWidth="200px"
                [nzTheme]="themeService.isDark() ? 'dark' : 'light'" [style.background-image]="sidebarBg()">
                <div class="logo-div" [class.collapsed]="isCollapsed()">
                    <div class="logo-content">
                        <img src="favicon.svg" alt="Logo" style="height: 32px; margin-right: 8px;" />
                        <h2>Graphlux</h2>
                    </div>
                    <div class="flex1">
                    </div>
                    <button nz-button nzType="text" nzSize="small" class="collapse-trigger" (click)="isCollapsed.set(!isCollapsed())">
                        <nz-icon [nzType]="isCollapsed() ? 'icon:sidebar-show' : 'icon:sidebar-hide'" />
                    </button>
                </div>
                <ul nz-menu nzMode="inline" [nzTheme]="themeService.isDark() ? 'dark' : 'light'">
                    <li nz-menu-item nzMatchRouter routerLink="/tasks" matRipple>
                        <nz-icon nzType="icon:task" />
                        <span> {{ t('menu.tasks') }}</span>
                    </li>
                    <li nz-menu-item nzMatchRouter routerLink="/folders" matRipple>
                        <nz-icon nzType="folder-open" />
                        <span> {{ t('menu.folders') }}</span>
                    </li>
                    <li nz-menu-item nzMatchRouter routerLink="/history" matRipple>
                        <nz-icon nzType="history" />
                        <span> {{ t('menu.history') }}</span>
                    </li>
                    <li nz-menu-item nzMatchRouter routerLink="/settings" matRipple>
                        <nz-icon nzType="setting" />
                        <span > {{ t('menu.settings') }}</span>
                    </li>
                </ul>
            </nz-sider>
            <nz-layout>
                <nz-content>
                    <div class="inner-content">
                        <router-outlet></router-outlet>
                    </div>
                </nz-content>
            </nz-layout>
        </nz-layout>
    `,
    styles: [`
        .app-layout {
            height: 100vh;
            width: 100vw;
        }
        nz-sider {
            border-right: 1px solid var(--border-color-split);
            box-shadow: 2px 0px 4px rgba(0, 0, 0, 0.02);
            ::ng-deep .ant-menu-root {
                border-right: none;
            }
            background-size: contain;
            background-repeat: no-repeat;
            background-position: bottom;
        }
        .logo-div {
            margin-left: 24px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color-split);
            margin-bottom: 8px;
            transition: padding 0.3s;

            &.collapsed {
                h2 {
                    display: none;
                }
                .collapse-trigger {
                    margin-right: 2px;
                }
                .collapse-trigger nz-icon {
                    opacity: 0.2;
                    margin-right: 0;
                    transition: opacity 0.3s;
                }
                .collapse-trigger:hover nz-icon {
                    opacity: 0.8;
                }
            }

            .logo-content {
                display: flex;
                align-items: center;
                overflow: hidden;
                white-space: nowrap;
                h2 {
                    margin: 0;
                    margin-left: 4px;
                    font-size: 18px;
                }
            }

            .collapse-trigger {
                margin-right: 6px;
                nz-icon {
                    opacity: 0.7;
                }
            }
        }
        .inner-content {
            height: 100%;
            overflow: hidden;
        }
        nz-layout {
            background: transparent;
        }
        nz-content {
        }
    `],
})
export class AppComponent implements OnInit {
    apiService = inject(ApiService);
    langService = inject(LanguageService);
    themeService = inject(ThemeService);
    modalService = inject(NzModalService);

    isCollapsed = signal(localStorage.getItem('siderCollapsed') === 'true');
    sidebarBg = computed(() => {
        if (this.isCollapsed()) {
            return 'none';
        }
        const info = this.apiService.appInfoSignal();
        const bg = info?.settings?.sidebar_bg;
        if (bg === 'kanban') {
            return "url('kanban.svg')";
        }
        return 'none';
    });

    constructor() {
        effect(() => {
            localStorage.setItem('siderCollapsed', String(this.isCollapsed()));
        });
    }

    ngOnInit() {
        this.langService.init();
        this.themeService.loadTheme(true);
        this.apiService.getAppInfo().then((info) => {
            const settings = info.settings;
            if (settings?.theme) {
                this.themeService.setTheme(settings.theme, true);
            }
            if (settings?.language) {
                this.langService.setLanguage(settings.language);
            }

        }).catch((err) => {
            console.error('Failed to get app info:', err);
            
            const errStr = err?.message || String(err);
            
            this.modalService.error({
                nzTitle: 'Unable to connect to server',
                nzContent: errStr,
                nzWidth: 600,
                nzOkText: 'Refresh',
                nzOnOk: () => { window.location.reload(); },
                nzMaskClosable: false,
                nzClosable: false
            });
        });
    }


}
