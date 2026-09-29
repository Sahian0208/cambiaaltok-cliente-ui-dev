import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[shared-view-port]',
  standalone: true
})
export class SharedViewPortDirective implements AfterViewInit, OnDestroy {

  @Input('shared-view-port') visibleClasses = '';
  @Input() hiddenClasses = '';
  @Input() delay = 0;
  @Input() exitAfter?: number;

  @Input() once = true;           
  @Input() useVisibility = false;    

  private observer?: IntersectionObserver;
  private entryTimeoutId: any;
  private autoExitTimeoutId: any;
  private hasAnimated = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.prepareHidden();

    // ✅ Fallback (SSR / sin IntersectionObserver)
    if (typeof IntersectionObserver === 'undefined') {
      this.startAnimation();
      return;
    }

    this.setupObserver();
  }

  private classes(v: string) {
    return v.split(/\s+/).map(s => s.trim()).filter(Boolean);
  }

  private prepareHidden() {
    if (this.useVisibility) {
      this.renderer.setStyle(this.el.nativeElement, 'visibility', 'hidden');
    }
    for (const cls of this.classes(this.hiddenClasses)) {
      this.renderer.addClass(this.el.nativeElement, cls);
    }
  }

  private setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (this.once && this.hasAnimated) return;
          this.hasAnimated = true;
          this.scheduleAnimation();
        } else {
          // ✅ opcional: si no es once, puedes permitir re-animación al re-entrar
          if (!this.once) this.hasAnimated = false;
        }
      }
    }, {
      root: null,
      threshold: 0.2,
      rootMargin: '0px 0px -20% 0px'
    });

    this.observer.observe(this.el.nativeElement);
  }

  private scheduleAnimation() {
    this.cancelTimers();

    this.entryTimeoutId = setTimeout(() => {
      this.startAnimation();

      if (this.exitAfter && this.exitAfter > 0) {
        this.autoExitTimeoutId = setTimeout(() => {
          this.triggerExitAnimation();
        }, this.exitAfter);
      }
    }, Math.max(0, this.delay));
  }

  private startAnimation() {
    if (this.useVisibility) {
      this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
    }

    for (const cls of this.classes(this.hiddenClasses)) {
      this.renderer.removeClass(this.el.nativeElement, cls);
    }
    for (const cls of this.classes(this.visibleClasses)) {
      this.renderer.addClass(this.el.nativeElement, cls);
    }
  }

  private triggerExitAnimation() {
    this.cancelTimers();

    for (const cls of this.classes(this.visibleClasses)) {
      this.renderer.removeClass(this.el.nativeElement, cls);
    }
    for (const cls of this.classes(this.hiddenClasses)) {
      this.renderer.addClass(this.el.nativeElement, cls);
    }

    if (this.useVisibility) {
      this.renderer.setStyle(this.el.nativeElement, 'visibility', 'hidden');
    }
  }

  private cancelTimers() {
    if (this.entryTimeoutId) {
      clearTimeout(this.entryTimeoutId);
      this.entryTimeoutId = null;
    }
    if (this.autoExitTimeoutId) {
      clearTimeout(this.autoExitTimeoutId);
      this.autoExitTimeoutId = null;
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.cancelTimers();
  }
}