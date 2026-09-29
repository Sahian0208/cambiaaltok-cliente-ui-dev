import { Component } from '@angular/core';
import { SharedViewPortDirective } from '../../../shared/directives';

@Component({
  selector: 'start-transaction',
  templateUrl: './start-transaction.component.html',
  
  standalone: true,
  imports: [SharedViewPortDirective],
})
export class StartTransactionComponent {}
