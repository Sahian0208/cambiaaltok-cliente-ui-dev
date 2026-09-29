import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { NaturalPerson, NaturalPersonClientDto, NaturalAttachmentFieldDto } from "../models/natural-person.model";
import { map } from "rxjs/internal/operators/map";
import { ApiResponse } from "bc-primeng-ui";
import { Observable } from "rxjs/internal/Observable";



@Injectable({ providedIn: 'root' })
export class NaturalPersonService {
  private readonly http = inject(HttpClient);
  private readonly naturalPersonApiUrl = `${environment.apiBaseUrl}/v1/natural-person`;

  getNaturalPersonById(authUserId: string) {
    return this.http.get<ApiResponse<NaturalPerson>>(`${this.naturalPersonApiUrl}/${authUserId}/client`).pipe(
      map((response) => this.normalizeNaturalPerson(response.data)),
    );
  }

  private normalizeNaturalPerson(person: NaturalPerson): NaturalPerson {
    const personData = person as NaturalPerson & {
      name?: string;
      person?: { firstName?: string; name?: string };
    };

    return {
      ...person,
      firstName: person.firstName || personData.name || personData.person?.firstName || personData.person?.name || '',
    };
  }

  /**
  * Updates an existing natural person by id.
  */
  updateNaturalPerson(id: number, data: Partial<NaturalPersonClientDto>): Observable<NaturalPerson> {
    return this.http
      .put<ApiResponse<NaturalPerson>>(`${this.naturalPersonApiUrl}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  updateNaturalPersonAttachmentFieldByAuthUserId(authUserId: string, data: Partial<NaturalAttachmentFieldDto>): Observable<number> {
    return this.http
      .put<ApiResponse<number>>(`${this.naturalPersonApiUrl}/${authUserId}/attachment-field`, data)
      .pipe(map((response) => response.data));
  }
}
