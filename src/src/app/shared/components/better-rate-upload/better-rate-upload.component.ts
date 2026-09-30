import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface BetterRateFileEvent {
  file: File;
}

@Component({
  selector: 'app-better-rate-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './better-rate-upload.component.html',
  styleUrl: './better-rate-upload.component.scss',
})
export class BetterRateUploadComponent {
  getContactWhatsappMessage(): string {
    return `https://wa.me/${environment.mainWhatsappContact}?text=Hola%20Fazilito,%20tengo%20una%20cotizaci%C3%B3n%20que%20me%20gustar%C3%ADa%20mejorar.`;
  }
}
