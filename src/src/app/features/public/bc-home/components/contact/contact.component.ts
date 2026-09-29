import { Component } from "@angular/core";
import { SharedViewPortDirective } from "../../../../../shared/directives";


@Component({
  selector: 'contact',
  templateUrl: './contact.component.html',  
  standalone: true,
  imports: [
    SharedViewPortDirective
  ]
})
export class ContactComponent {

}