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

  isDenied: boolean = false;

  readonly stepLabels: string[] = [
    'Registro',
    'Depósito',
    'Verificación',
    'Transferencia',
    'Finalizado',
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStep']) {
      this.isDenied = this.currentStep === -1;
    }
  }
}
