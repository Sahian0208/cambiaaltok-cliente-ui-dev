import { Component, signal } from "@angular/core";
import { SharedViewPortDirective } from "../../../../../shared/directives";


@Component({
  selector: 'banks-promotion',
  templateUrl: './banks-promotion.component.html',
  styleUrl: './banks-promotion.component.css',
  standalone: true  
})
export class BanksPromotionComponent {

     activePromotionIndex = signal(0);
     
 constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => {        
        this.nextPromotionSlide();
      }, 5000);
    }
  }

  nextPromotionSlide() {
    this.activePromotionIndex.set((this.activePromotionIndex() + 1) % 2);
  }

}