import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { NaturalPerson, LegalPersonClientDto, NaturalAttachmentFieldDto } from "../models/natural-person.model";
import { map } from "rxjs/internal/operators/map";
import { ApiResponse } from "bc-primeng-ui";
import { Observable } from "rxjs/internal/Observable";



@Injectable({ providedIn: 'root' })
export class LegalPersonService {
  private readonly http = inject(HttpClient);
  private readonly legalPersonApiUrl = `${environment.apiBaseUrl}/v1/legal-person`;


  /**
  * Updates an existing natural person by id.
  */
  updateLegalPerson(id: number, data: Partial<LegalPersonClientDto>): Observable<NaturalPerson> {
    return this.http
      .put<ApiResponse<NaturalPerson>>(`${this.legalPersonApiUrl}/${id}/client`, data)
      .pipe(map((response) => response.data));
  }

  updateLegalPersonAttachmentFieldByAuthUserId(authUserId: string, data: Partial<NaturalAttachmentFieldDto>): Observable<number> {
    return this.http
      .put<ApiResponse<number>>(`${this.legalPersonApiUrl}/${authUserId}/attachment-field`, data)
      .pipe(map((response) => response.data));
  }
}
