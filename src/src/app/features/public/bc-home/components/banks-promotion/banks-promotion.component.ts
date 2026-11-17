import { Component, signal, OnDestroy } from "@angular/core";

@Component({
  selector: 'banks-promotion',
  templateUrl: './banks-promotion.component.html',
  styleUrl: './banks-promotion.component.css',
  standalone: true  
})
export class BanksPromotionComponent implements OnDestroy {
  activePromotionIndex = signal(0);
  copiedCoupon = signal(false);
  private timer: any;
  private touchStartX = 0;

  constructor() {
    this.startAutoSlide();
  }

  startAutoSlide() {
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {        
        this.nextPromotionSlide();
      }, 5500);
    }
  }

  nextPromotionSlide() {
    this.activePromotionIndex.update((i) => (i + 1) % 4);
  }

  prevPromotionSlide() {
    this.activePromotionIndex.update((i) => (i - 1 + 4) % 4);
  }

  setSlide(index: number) {
    this.activePromotionIndex.set(index);
    this.resetTimer();
  }

  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.startAutoSlide();
    }
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const diff = this.touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.nextPromotionSlide();
      } else {
        this.prevPromotionSlide();
      }
      this.resetTimer();
    }
  }

  copyCoupon(code: string = 'ALTOK100') {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      this.copiedCoupon.set(true);
      setTimeout(() => this.copiedCoupon.set(false), 2200);
    }
  }

  scrollToCalculator() {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('calculadora') || document.querySelector('app-calculator');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openWhatsApp(message: string = 'Hola,%20deseo%20solicitar%20una%20cotizaci%C3%B3n%20para%20un%20monto%20mayor') {
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/59172237251?text=${message}`, '_blank');
    }
  }

  shareCode(code: string = 'FAZILITO15') {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: 'Fazilito - Casa de Cambio',
        text: `¡Usa mi código ${code} en Fazilito para obtener el mejor tipo de cambio entre Bolivia y Perú!`,
        url: 'https://fazilito.pe'
      }).catch(() => {});
    } else {
      this.copyCoupon(code);
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
