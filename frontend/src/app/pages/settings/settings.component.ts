import { Component, OnInit, signal, inject, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { COMMON_IMPORTS } from '../../shared-imports';
import { LanguageService } from '../../services/language.service';
import { ThemeService, ThemeType } from '../../services/theme.service';
import { TranslocoService } from '@jsverse/transloco';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerComponent } from "ng-zorro-antd/divider";
import { NzAnchorModule } from 'ng-zorro-antd/anchor';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { SystemConfig } from '../../interfaces/app-info.interface';


@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSwitchModule,
    NzAlertModule,
    NzAnchorModule,
    NzGridModule,
    ...COMMON_IMPORTS,
    NzDividerComponent
],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
    settings = signal({ } as SystemConfig);
    allowRemoteAccess = signal(false);
    
    private message = inject(NzMessageService);
    apiService = inject(ApiService);
    langService = inject(LanguageService);
    themeService = inject(ThemeService);
    translocoService = inject(TranslocoService);


    ngOnInit() {
        this.loadSettings();
    }

    async loadSettings() {
        const info = await this.apiService.getAppInfo();
        this.applySettings(info.settings);
    }

    applySettings(s: SystemConfig) {
        let settings = { ...s };

        if (settings.host && settings.host !== LOCALHOST) {
            this.allowRemoteAccess.set(true);
        } else {
            this.allowRemoteAccess.set(false);
            settings.host = LOCALHOST;
        }
        this.settings.set(settings);
    }

    saveSettings() {
        const oldLang = this.langService.currentLang;
        let settings = { ...this.settings() };
        if (settings.host == LOCALHOST) {
            settings.host = null;
        }

        this.apiService.updateSettings(settings).subscribe((updated) => {
            this.message.success(this.translocoService.translate('settings.saved'));
            this.themeService.setTheme(updated.theme as any, true);
            this.langService.setLanguage(updated.language);
            
            this.apiService.getAppInfo().then(info => {
                info.settings = updated;
            });
            this.applySettings(updated);

            if (oldLang !== updated.language) {
                window.location.reload();
            }
        });
    }

    updateField(field: string, value: any) {
        this.settings.update((s: any) => ({ ...s, [field]: value }));
    }

    toggleRemoteAccess(enabled: boolean) {
        this.settings.update((s: any) => ({
            ...s,
            host: enabled ? ('0.0.0.0') : LOCALHOST
        }));
    }
}

const LOCALHOST = '127.0.0.1';