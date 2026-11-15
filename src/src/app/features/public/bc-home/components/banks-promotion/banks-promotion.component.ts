import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'banks-promotion',
  templateUrl: './banks-promotion.component.html',
  styleUrl: './banks-promotion.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class BanksPromotionComponent {
  activePromotionIndex = signal(0);
  selectedCountry = signal<'peru' | 'bolivia'>('peru');

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
