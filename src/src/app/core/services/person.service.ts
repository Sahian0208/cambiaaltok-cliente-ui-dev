import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";


@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly transactionsUrl = `${environment.apiBaseUrl}/v1/person`;
}


