import { inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';
import { IntermediaryShouldVerifyNotification } from '../models/live-notification-message.model';

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private readonly notificationService = inject(NotificationService);

  readonly liveIntermediaryShouldVerifyNotification =
    signal<IntermediaryShouldVerifyNotification | null>(null);

  constructor(private authService: AuthService) {}

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiBaseUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.authService.getToken()!,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().then(() => console.log('SignalR conectado'));
  }

  receiveNotification() {
    this.hubConnection.on(
      'IntermediaryShouldVerifyNotification',
      (message: any) => {
        console.log(message);
        this.notificationService.info(
          'Info',
          message.message || 'Nueva transaccion para verificar',
        );

        //trigger signal to update the notification state
        let notificationMessage: IntermediaryShouldVerifyNotification = {
          message: message.message || 'Nueva transaccion para verificar',
        };
        this.liveIntermediaryShouldVerifyNotification.set(notificationMessage);

        // Mostrar Toast PrimeNG
      },
    );
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => console.log('SignalR desconectado'))
        .catch((err) => console.error('Error al desconectar SignalR:', err));
    }
  }
}
