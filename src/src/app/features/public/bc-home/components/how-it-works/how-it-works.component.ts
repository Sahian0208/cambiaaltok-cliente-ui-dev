import { Component, signal } from "@angular/core";
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
export class HowItWorksComponent {
  activeTestimonialIndex = signal(0);

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
      text: 'Uso fazilito para mis operaciones frecuentes y siempre encuentro un proceso ordenado, confiable y transparente.',
    },
  ];

  prevTestimonial() {
    const len = this.testimonials.length;
    this.activeTestimonialIndex.set((this.activeTestimonialIndex() - 1 + len) % len);
  }

  nextTestimonial() {
    const len = this.testimonials.length;
    this.activeTestimonialIndex.set((this.activeTestimonialIndex() + 1) % len);
  }
}