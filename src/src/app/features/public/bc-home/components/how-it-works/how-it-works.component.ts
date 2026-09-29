import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedViewPortDirective } from "../../../../../shared/directives";
import { CardModule } from "primeng/card";

interface Testimonial {
  name: string;
  text: string;
  gender: 'male' | 'female';
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
      name: 'María Fernanda Ríos',
      text: 'Cambié mis bolivianos a soles en minutos. La tasa fue mejor que en el banco y la atención por WhatsApp fue inmediata.',
      gender: 'female',
    },
    {
      name: 'Carlos Medina',
      text: 'Uso Cambia Altok para mis operaciones mensuales. El proceso es transparente y siempre recibo mi dinero rápido.',
      gender: 'male',
    },
    {
      name: 'Lucía Paredes',
      text: 'Me encantó lo fácil que fue registrarme y hacer mi primer cambio. Recomiendo la plataforma a mi familia en Bolivia.',
      gender: 'female',
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