import { 
  Component, 
  ElementRef, 
  Input, 
  OnChanges, 
  OnDestroy, 
  OnInit, 
  SimpleChanges, 
  ViewChild 
} from '@angular/core';

// Declaración para que TypeScript reconozca el objeto global de qrcodejs
declare var QRCode: any;

@Component({
  selector: 'bc-qr-code',
  standalone: true,
  template: `<div #contenedorQr></div>`,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class QrCodeComponent implements OnInit, OnChanges, OnDestroy {
  /** Texto o URL a codificar en el QR */
  @Input({ required: true }) text: string = '';
  
  /** Tamaño opcional en píxeles (por defecto 200) */
  @Input() width: number = 200;
  @Input() height: number = 200;

  @ViewChild('contenedorQr', { static: true }) contenedorQr!: ElementRef<HTMLDivElement>;

  private qrInstance: any = null;

  ngOnInit(): void {
    this.initQrInstance();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia el texto dinámicamente desde el padre, actualizamos el QR
    if (changes['text'] && !changes['text'].isFirstChange()) {
      this.updateQr();
    }
  }

  private initQrInstance(): void {
    if (typeof QRCode === 'undefined') {
      console.error('qrcodejs no está cargado correctamente.');
      return;
    }

    // Instancia inicial utilizando el elemento capturado con ViewChild
    this.qrInstance = new QRCode(this.contenedorQr.nativeElement, {
      text: this.text,
      width: this.width,
      height: this.height
    });
  }

  private updateQr(): void {
    if (this.qrInstance && this.text) {
      this.qrInstance.makeCode(this.text);
    }
  }

  ngOnDestroy(): void {
    // Limpieza al destruir el componente
    if (this.contenedorQr?.nativeElement) {
      this.contenedorQr.nativeElement.innerHTML = '';
    }
  }
}