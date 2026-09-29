import { Component } from '@angular/core';
import { SharedViewPortDirective } from '../../../../../shared/directives/view-port.directive';

@Component({
  selector: 'about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  standalone: true,
  imports: [SharedViewPortDirective],
})
export class AboutUsComponent {}
