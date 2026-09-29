import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import BCFooter from "./footer/bc-footer.component";
import BCNavBar from "./navbar/bc-navbar.component";
import { environment } from "../../../environments/environment";

@Component({
  selector: 'bc-public-layout',
  templateUrl: './bc-public-layout.component.html',  
  standalone: true,
  imports: [
    RouterOutlet,
    BCFooter,
    BCNavBar
]
})
export default class BCPublicLayout{


  getContactWhatsappMessage() : string
  {
    return `https://wa.me/${environment.mainWhatsappContact}?text=Hola CambiaAltok, requiero mas informacion sobre el servicio.`;
  }

  // scrollToSection(sectionId: string) {
  //   document.getElementById(sectionId)?.scrollIntoView({
  //     behavior: 'smooth',
  //     block: 'start'
  //   });
  // }
}