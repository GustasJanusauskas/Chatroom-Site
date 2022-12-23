import { Component, OnInit } from '@angular/core';

import { Room } from "../classes/room";
import { Message } from "../classes/message";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentRoom: Room = new Room("testRoom");
  rooms: Room[] = [];
  messages: Message[] = [];

  constructor() { 

  }

  ngOnInit(): void {
    for (let index = 0; index < 10; index++) {
      this.rooms.push({name:"testRoom" + index,imagePath:""});
      this.messages.push({author:"testAuthor",body:"testMessage" + index,date:new Date()});
    }
  }

}