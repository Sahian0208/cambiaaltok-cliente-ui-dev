import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

import { RateService } from './core/services/rate.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  title = 'CambiaAltok';

  private readonly rateService = inject(RateService);

  ngOnInit(): void {
    // Start rate polling when the application initializes
    this.rateService.startPolling();
  }

  ngOnDestroy(): void {
    // Stop polling when the app is destroyed
    this.rateService.stopPolling();
  }
}
