import { Component, OnInit } from '@angular/core';

import { Room } from "../classes/room";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  rooms: Room[] = [];

  constructor() { 

  }

  ngOnInit(): void {
    for (let index = 0; index < 10; index++) {
      this.rooms.push({name:"testRoom" + index,imagePath:""});
    }
  }

}