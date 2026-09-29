import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  changePassword(email: any, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<boolean>(
      `${environment.oauth.authority}/api/register/change-password`,
      { username: email,
        currentPwd: currentPassword,
        newPwd: newPassword
      });
  }
}
