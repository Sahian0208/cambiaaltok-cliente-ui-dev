import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, mapTo } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly http = inject(HttpClient);
  private readonly attachmentUrl = `${environment.apiBaseUrl}/v1/attachment`;

  getAttachmentPreviewUrl(attachmentId: string): string {
    return `${this.attachmentUrl}/${attachmentId}/preview`;
  }

  createAttachment(file: File, description?: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    let params = new HttpParams();
    if (description && description.trim().length > 0) {
      params = params.set('description', description.trim());
    }

    return this.http
      .post<ApiResponse<string> | { data?: string; id?: string; externalId?: string } | string>(
        this.attachmentUrl,
        formData,
        { params },
      )
      .pipe(map((response) => this.extractExternalId(response)));
  }

  updateAttachment(attachmentId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .put<void>(`${this.attachmentUrl}/${attachmentId}/by-external-id`, formData)
      .pipe(mapTo(attachmentId));
  }

  private extractExternalId(response: ApiResponse<string> | { data?: string; id?: string; externalId?: string } | string): string {
    if (typeof response === 'string' && response.trim().length > 0) {
      return response;
    }

    if (response && typeof response === 'object') {
      const typedResponse = response as { data?: string; id?: string; externalId?: string };
      const externalId = typedResponse.data || typedResponse.externalId || typedResponse.id;
      if (externalId && externalId.trim().length > 0) {
        return externalId;
      }
    }

    throw new Error('No se pudo obtener el externalId desde la respuesta del servidor.');
  }
}