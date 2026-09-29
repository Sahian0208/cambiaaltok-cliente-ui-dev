import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'success', summary, detail, life: 3000 });
  }

  error(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'error', summary, detail, life: 5000 });
  }

  warn(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'warn', summary, detail, life: 4000 });
  }

  info(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'info', summary, detail, life: 3000 });
  }

  simulateEmail(to: string, subject: string, body: string): void {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Asunto: ${subject} | Cuerpo: ${body}`);
  }
}
