import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassicPreset } from 'rete';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-custom-connection',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  template: `
    <svg data-testid="connection">
      <path
        class="connection-path"
        [class.selected]="data.selected"
        [attr.d]="path"
        (click)="onClick($event)"
      ></path>

      <!-- Hover delete button -->
      <g
        *ngIf="data.selected"
        class="delete-btn"
        [attr.transform]="'translate(' + (center.x - 10) + ',' + (center.y - 10) + ')'"
        (click)="onDelete($event)"
      >
        <circle cx="10" cy="10" r="12" fill="#ff4d4f"></circle>
        <path d="M 6 6 L 14 14 M 14 6 L 6 14" stroke="white" stroke-width="2" stroke-linecap="round"></path>
      </g>
    </svg>
  `,
  styleUrls: ['./custom-connection.css']
})
export class CustomConnectionComponent {
  @Input() data!: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node> & { selected?: boolean, isPseudo?: boolean };
  @Input() start!: { x: number, y: number };
  @Input() end!: { x: number, y: number };
  @Input() path!: string;

  // We need to pass the rete editor / area down or have a way to emit the delete event.
  // The rete-angular-plugin handles this internally, but to trigger delete from the UI,
  // we usually rely on the area plugin or node picked event.
  // For now, let's just make it selectable. We will handle deletion via a custom event or picking.

  get center() {
    return {
      x: (this.start.x + this.end.x) / 2,
      y: (this.start.y + this.end.y) / 2
    };
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();
    // Mark as selected. We will need a way to notify the editor.
    // However, area-plugin has an AreaExtensions.selectableNodes which usually only works for nodes.
    // For connections, we need to handle it in the addPipe of the editor.

    // We can dispatch a custom event on the document to let the editor know.
    const e = new CustomEvent('connectionpicked', { detail: { id: this.data.id }});
    document.dispatchEvent(e);
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    const e = new CustomEvent('connectiondeleted', { detail: { id: this.data.id }});
    document.dispatchEvent(e);
  }
}
