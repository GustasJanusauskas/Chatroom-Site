import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";

import { Room } from '../classes/room';
import { Message } from '../classes/message';

import { HelperFunctionsService } from "../services/helper-functions.service";
import { UserdataService } from "../services/userdata.service";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentRoom: Room = new Room('testRoom');
  rooms: Room[] = [];
  messages: Message[] = [];

  messageInput: string = '';
  searchInput: string = '';

  lastSearchCharacterInput: number = Number.NaN;
  showCreateNewRoomCard: boolean = false;

  getCookie = HelperFunctionsService.getCookie;
  deleteCookie = HelperFunctionsService.deleteCookie;

  constructor(private userdataService: UserdataService, private snackbar: MatSnackBar) { 
    //Setup search input checking
    setInterval(() => {
      if (this.lastSearchCharacterInput + 250 < Date.now() && this.searchInput.length > 2) {
        this.userdataService.searchRooms(this.searchInput.toLowerCase()).subscribe(data => {
          this.rooms = data;

          //if exact searchInput is not returned (not present in db), show the 'create new room' card.
          this.showCreateNewRoomCard = !this.rooms.find( (value) => {
            return value.name === this.searchInput;
          });
        });
        this.lastSearchCharacterInput = Number.NaN;
      }
    },125);
  }

  ngOnInit(): void {
    this.rooms.find( (value) => {
      return value.name === this.searchInput;
    });
    //debug
    for (let index = 0; index < 10; index++) {
      this.rooms.push({name:'testRoom' + index,id:index});
      this.messages.push({author:'testAuthor',body:'testMessage' + index,date:new Date(), id:index});
    }
  }

  createRoom(): void {
    this.userdataService.createRoom(HelperFunctionsService.getCookie('session') || '',this.searchInput).subscribe( data => {
      if (data.error) {
        this.snackbar.open(data.error,'OK');
        return;
      }

      this.selectRoom(new Room(this.searchInput,data.id));

      this.showCreateNewRoomCard = false;
      this.searchInput = '';
      this.snackbar.open('Room created successfully!','OK');
    });
  }

  selectRoom(room: Room): void {
    this.currentRoom = room;
    this.userdataService.getRoomInfo(room.id).subscribe( data => {
      this.messages = data;
    });
  }

  searchUpdate(): void {
    this.lastSearchCharacterInput = Date.now();
  }

  reply(username: string): void {
    this.messageInput += `@${username}`;
  }
}