import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Steps } from 'primeng/steps';
import { MenuItem } from 'primeng/api';

/**
 * StepperComponent — Visual 5-step progress indicator for transactions.
 *
 * Receives the current step (1–5) or -1 for denied transactions.
 * Uses PrimeNG p-steps in readonly mode with differentiated icons
 * for completed, active, and pending steps.
 *
 * Steps:
 * 1. Registro de operación
 * 2. Depósito del cliente
 * 3. Verificación
 * 4. Transferencia
 * 5. Finalizado
 */
@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, Steps],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent implements OnChanges {
  /**
   * Current step of the transaction (1-5).
   * Use -1 to indicate a denied/rejected transaction.
   */
  @Input() currentStep: number = 1;

  /** Menu items for PrimeNG p-steps */
  steps: MenuItem[] = [];

  /** Active index for p-steps (0-based) */
  activeIndex: number = 0;

  /** Whether the transaction is denied */
  isDenied: boolean = false;

  private readonly stepLabels: string[] = [
    'Registro de operación',
    'Depósito del cliente',
    'Verificación',
    'Transferencia',
    'Finalizado',
  ];

  private readonly stepIcons = {
    completed: 'pi pi-check-circle',
    active: 'pi pi-circle-fill',
    pending: 'pi pi-circle',
    denied: 'pi pi-times-circle',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStep']) {
      this.updateSteps();
    }
  }

  private updateSteps(): void {
    this.isDenied = this.currentStep === -1;

    if (this.isDenied) {
      this.activeIndex = 0;
      this.steps = this.stepLabels.map((label) => ({
        label,
        icon: this.stepIcons.denied,
      }));
      return;
    }

    // Clamp currentStep to valid range
    const step = Math.max(1, Math.min(5, this.currentStep));
    this.activeIndex = step - 1;

    this.steps = this.stepLabels.map((label, index) => {
      const stepNumber = index + 1;
      let icon: string;

      if (stepNumber < step) {
        icon = this.stepIcons.completed;
      } else if (stepNumber === step) {
        icon = this.stepIcons.active;
      } else {
        icon = this.stepIcons.pending;
      }

      return { label, icon };
    });
  }
}
