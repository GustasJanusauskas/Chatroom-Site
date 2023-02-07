import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatSnackBar } from "@angular/material/snack-bar";

import { Room } from '../classes/room';
import { Message } from '../classes/message';

import { HelperFunctionsService } from "../services/helper-functions.service";
import { UserdataService } from "../services/userdata.service";
import { MessagingService } from "../services/messaging.service";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  currentRoom: Room = new Room('Loading..');
  rooms: Room[] = [];
  messages: Message[] = [];

  messageInput: string = '';
  searchInput: string = '';

  lastSearchCharacterInput: number = Number.NaN;
  showCreateNewRoomCard: boolean = false;

  getCookie = HelperFunctionsService.getCookie;
  deleteCookie = HelperFunctionsService.deleteCookie;

  constructor(private userdataService: UserdataService, private messagingService: MessagingService, private snackbar: MatSnackBar, private sanitizer: DomSanitizer) { 
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

    //Setup websocket message handler
    messagingService.messages.subscribe( (msg: Message) => {
      this.messages.push(this.processMessage(msg));
    });
  }

  ngOnInit(): void {
    //Must wait for websock service to initialise
    setTimeout(() => {
      //Connect to default general room, must set ID correctly here!
      this.selectRoom(new Room('general',5));
    },250);
  }

  //MESSAGING//
  sendMessage(): void {
    //Send session and message body, room and sending date get added serverside
    var msg = {type:'message',session:HelperFunctionsService.getCookie('session'),body:this.messageInput};

    this.messagingService.messages.next(msg);
    this.messageInput = '';
  }

  processMessage(msg: Message): Message {
    //Format date
    msg.displaydate = new Date(msg.date).toLocaleString();

    //Detect and embed yt videos
    var ytmatch = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/g.exec(msg.body);
    if (ytmatch) msg.displayembedlink = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${ytmatch[1]}`);

    //Trim message if long, set flag for show more button
    if (msg.body.length > 128 || (msg.body.match(/\n/g) || []).length >= 4) {
      msg.displaybody = msg.body.substring(0,128).replaceAll('\n','') + '...';
      msg.displaymorebtn = true;
    }
    else {
      msg.displaybody = msg.body;
    }

    return msg;
  }

  //ROOMS//
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

    //Get messages for new room
    this.userdataService.getRoomInfo(room.id).subscribe( data => {
      //Format dates
      data.forEach((msg: Message) => {
        msg = this.processMessage(msg); //TODO test this, may need a for loop instead
      });

      this.messages = data;
    });

    //Update serverside current room info
    var msg = {type:'roomswitch',room:room.id};

    this.messagingService.messages.next(msg);
  }


  //MISC//
  searchUpdate(): void {
    this.lastSearchCharacterInput = Date.now();
  }

  reply(username: string): void {
    this.messageInput += `@${username}`;
  }

  showFullMessage(msg: Message): void {
    msg.displaybody = msg.body;
    msg.displaymorebtn = false;
  }
}