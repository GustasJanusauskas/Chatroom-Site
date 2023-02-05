import { Component } from '@angular/core';

import { HelperFunctionsService } from "./services/helper-functions.service";
import { MessagingService } from "./services/messaging.service";

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

  constructor(private messagingService: MessagingService) {

  }

  logout(): void {
    var request = {type: 'disconnect', session:HelperFunctionsService.getCookie('session')};
    this.messagingService.messages.next(request);

    HelperFunctionsService.deleteCookie('session');
  }
}
