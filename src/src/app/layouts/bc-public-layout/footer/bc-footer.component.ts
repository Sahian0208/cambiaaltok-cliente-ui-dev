import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'bc-footer',
  templateUrl: './bc-footer.component.html',  
  standalone: true,
  
})
export default class BCFooter{

  scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}