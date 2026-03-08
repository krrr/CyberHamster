import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

export const COMMON_IMPORTS = [
    CommonModule,

    NzMenuModule,
    NzIconModule,
    NzButtonModule
] as const;