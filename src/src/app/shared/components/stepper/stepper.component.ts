import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent implements OnChanges {
  @Input() currentStep: number = 1;
  @Input() status?: string;
  @Input() variant: 'compact' | 'full' = 'compact';

  isDenied: boolean = false;

  readonly stepLabels: string[] = [
    'Registro',
    'Depósito',
    'Verificación',
    'Transferencia',
    'Finalizado',
  ];

  readonly stepIcons: string[] = [
    'pi pi-file-edit',
    'pi pi-wallet',
    'pi pi-shield',
    'pi pi-arrows-h',
    'pi pi-check-circle',
  ];

  get progressPercentage(): number {
    if (this.isDenied) return 0;
    const step = Math.min(Math.max(this.currentStep, 1), 5);
    return step * 20;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStep']) {
      this.isDenied = this.currentStep === -1;
    }
  }
}
