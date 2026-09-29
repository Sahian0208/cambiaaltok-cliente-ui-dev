import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepperComponent } from './stepper.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

describe('StepperComponent', () => {
  let component: StepperComponent;
  let fixture: ComponentFixture<StepperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperComponent],
      providers: [provideAnimationsAsync(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StepperComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with 5 steps', () => {
    fixture.detectChanges();
    expect(component.steps.length).toBe(5);
  });

  it('should set activeIndex to 0 when currentStep is 1', () => {
    component.currentStep = 1;
    fixture.detectChanges();
    expect(component.activeIndex).toBe(0);
  });

  it('should set activeIndex to 4 when currentStep is 5', () => {
    component.currentStep = 5;
    fixture.detectChanges();
    expect(component.activeIndex).toBe(4);
  });

  it('should mark steps before currentStep as completed', () => {
    component.currentStep = 3;
    fixture.detectChanges();

    expect(component.steps[0].icon).toBe('pi pi-check-circle');
    expect(component.steps[1].icon).toBe('pi pi-check-circle');
    expect(component.steps[2].icon).toBe('pi pi-circle-fill');
    expect(component.steps[3].icon).toBe('pi pi-circle');
    expect(component.steps[4].icon).toBe('pi pi-circle');
  });

  it('should mark all steps as denied when currentStep is -1', () => {
    component.currentStep = -1;
    fixture.detectChanges();

    expect(component.isDenied).toBeTrue();
    component.steps.forEach((step) => {
      expect(step.icon).toBe('pi pi-times-circle');
    });
  });

  it('should not be denied for valid steps', () => {
    component.currentStep = 2;
    fixture.detectChanges();
    expect(component.isDenied).toBeFalse();
  });

  it('should have correct step labels', () => {
    fixture.detectChanges();

    const expectedLabels = [
      'Registro de operación',
      'Depósito del cliente',
      'Verificación',
      'Transferencia',
      'Finalizado',
    ];

    component.steps.forEach((step, index) => {
      expect(step.label).toBe(expectedLabels[index]);
    });
  });

  it('should update steps when currentStep changes', () => {
    component.currentStep = 1;
    fixture.detectChanges();
    expect(component.activeIndex).toBe(0);

    component.currentStep = 4;
    component.ngOnChanges({
      currentStep: {
        currentValue: 4,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.activeIndex).toBe(3);
    expect(component.steps[0].icon).toBe('pi pi-check-circle');
    expect(component.steps[1].icon).toBe('pi pi-check-circle');
    expect(component.steps[2].icon).toBe('pi pi-check-circle');
    expect(component.steps[3].icon).toBe('pi pi-circle-fill');
    expect(component.steps[4].icon).toBe('pi pi-circle');
  });

  it('should clamp currentStep to valid range (min 1)', () => {
    component.currentStep = 0;
    component.ngOnChanges({
      currentStep: {
        currentValue: 0,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.activeIndex).toBe(0);
  });

  it('should clamp currentStep to valid range (max 5)', () => {
    component.currentStep = 10;
    component.ngOnChanges({
      currentStep: {
        currentValue: 10,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.activeIndex).toBe(4);
  });
});
