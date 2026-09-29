import { Component, computed, input } from '@angular/core';

type FlagType = 'horizontal' | 'vertical';

interface FlagConfig {
  code: string;
  type: FlagType;
  colors: string[];
}

@Component({
  selector: 'app-national-flag',
  standalone: true,
  templateUrl: './national-flag.component.html',
  
})
export class NationalFlagComponent {

  country = input.required<string>();

  size = input<string>('w-5');

  private readonly countries: Record<string, FlagConfig> = {
    bolivia: {
      code: 'BO',
      type: 'horizontal',
      colors: ['#d52b1e', '#fcd116', '#007a33']
    },

    peru: {
      code: 'PE',
      type: 'vertical',
      colors: ['#d52b1e', '#ffffff', '#d52b1e']
    },

    bob: {
      code: 'BO',
      type: 'horizontal',
      colors: ['#d52b1e', '#fcd116', '#007a33']
    },

    pen: {
      code: 'PE',
      type: 'vertical',
      colors: ['#d52b1e', '#ffffff', '#d52b1e']
    },

    poland: {
      code: 'PL',
      type: 'horizontal',
      colors: ['#ffffff', '#dc143c']
    },

    ukraine: {
      code: 'UA',
      type: 'horizontal',
      colors: ['#0057b7', '#ffd700']
    }
  };

  flag = computed(() => {
    const country = this.country()?.trim().toLowerCase();

    return country
      ? this.countries[country] ?? null
      : null;
  });
}