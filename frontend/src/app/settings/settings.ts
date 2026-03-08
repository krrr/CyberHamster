import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  settings: any = {
    ffmpeg_path: 'ffmpeg',
    imagemagick_path: 'magick',
    exiftool_path: 'exiftool'
  };

  constructor(private apiService: ApiService, private message: NzMessageService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.apiService.getSettings().subscribe(s => {
      if (s) {
        this.settings = s;
      }
    });
  }

  saveSettings() {
    this.apiService.updateSettings(this.settings).subscribe(() => {
      this.message.success('Settings saved successfully!');
    });
  }
}
