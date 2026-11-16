import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedViewPortDirective } from "../../../../../shared/directives";
import { CardModule } from "primeng/card";

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
}

@Component({
  selector: 'how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css',
  standalone: true,
  imports: [
    CommonModule,
    SharedViewPortDirective,
    CardModule
  ]
})
export class HowItWorksComponent implements OnInit, OnDestroy {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLDivElement>;

  activeTestimonialIndex = signal(0);
  private autoSlideInterval: any = null;
  private isMouseOver = false;

  testimonials: Testimonial[] = [
    {
      name: 'Milagros Luján',
      role: 'Cliente verificado',
      avatar: '/avatar-milagros.png',
      text: 'Me gustó mucho la rapidez y la claridad del proceso. Pude cambiar Bolivianos y Soles de forma segura y sin complicaciones.',
    },
    {
      name: 'Daisy Cueva',
      role: 'Cliente verificado',
      avatar: '/avatar-daisy.png',
      text: 'La atención por WhatsApp fue excelente. Me ayudaron paso a paso y mi operación llegó rápido. ¡Muy recomendado!',
    },
    {
      name: 'Carlos Rojas',
      role: 'Cliente verificado',
      avatar: '/avatar-carlos.png',
      text: 'Uso Fazilito para mis operaciones frecuentes y siempre encuentro un proceso ordenado, confiable y transparente.',
    },
    {
      name: 'Roberto Mendoza',
      role: 'Cliente verificado',
      avatar: '/avatar-carlos.png',
      text: 'Excelente tasa de cambio y atención personalizada. El dinero llegó a mi cuenta bancaria exactamente en el tiempo prometido.',
    },
    {
      name: 'Valeria Flores',
      role: 'Cliente verificado',
      avatar: '/avatar-milagros.png',
      text: 'Hacer el cambio de divisas online nunca fue tan sencillo. Me dio mucha tranquilidad la confirmación en cada etapa.',
    },
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    if (typeof window !== 'undefined') {
      this.autoSlideInterval = setInterval(() => {
        if (!this.isMouseOver) {
          this.nextTestimonial();
        }
      }, 5000);
    }
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  onMouseEnter() {
    this.isMouseOver = true;
  }

  onMouseLeave() {
    this.isMouseOver = false;
  }

  scrollToIndex(index: number) {
    const len = this.testimonials.length;
    const targetIndex = (index + len) % len;
    this.activeTestimonialIndex.set(targetIndex);

    if (this.carouselContainer?.nativeElement) {
      const container = this.carouselContainer.nativeElement;
      const firstChild = container.firstElementChild as HTMLElement;
      if (firstChild) {
        const itemWidth = firstChild.offsetWidth + 24;
        container.scrollTo({
          left: targetIndex * itemWidth,
          behavior: 'smooth'
        });
      }
    }
  }

  prevTestimonial() {
    this.scrollToIndex(this.activeTestimonialIndex() - 1);
  }

  nextTestimonial() {
    this.scrollToIndex(this.activeTestimonialIndex() + 1);
  }

  onScroll(event: Event) {
    const container = event.target as HTMLDivElement;
    if (!container) return;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 24;
    const index = Math.round(container.scrollLeft / itemWidth);
    if (index >= 0 && index < this.testimonials.length && index !== this.activeTestimonialIndex()) {
      this.activeTestimonialIndex.set(index);
    }
  }
}
