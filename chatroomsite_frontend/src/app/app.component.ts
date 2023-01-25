import { Component } from '@angular/core';
import { HelperFunctionsService } from "./services/helper-functions.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chatroomsite_frontend';

  //For navbar
  getCookie = HelperFunctionsService.getCookie;
  deleteCookie = HelperFunctionsService.deleteCookie;
}
