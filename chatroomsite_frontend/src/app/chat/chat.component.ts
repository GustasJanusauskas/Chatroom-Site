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
  rooms: Room[] = []; //Search room list
  favourites: Room[] = []; //Favourite room list
  messages: Message[] = [];

  messageInput: string = '';
  searchInput: string = '';

  //UI
  lastSearchCharacterInput: number = Number.NaN;
  showCreateNewRoomCard: boolean = false;

  getCookie = HelperFunctionsService.getCookie;
  deleteCookie = HelperFunctionsService.deleteCookie;

  constructor(private userdataService: UserdataService, private messagingService: MessagingService, private snackbar: MatSnackBar, private sanitizer: DomSanitizer) { 
    //Setup search input checking
    setInterval(() => {
      if (this.lastSearchCharacterInput + 250 < Date.now() && this.searchInput.length > 2) {
        this.userdataService.searchRooms(this.searchInput.toLowerCase()).subscribe(data => {
          this.rooms = this.processRooms(data);

          //if exact searchInput is not returned (not present in db), show the 'create new room' card.
          this.showCreateNewRoomCard = !this.rooms.find( (value) => {
            return value.name.toLowerCase() === this.searchInput.toLowerCase();
          });
        });
        this.lastSearchCharacterInput = Number.NaN;
      }
      else if (this.lastSearchCharacterInput + 250 < Date.now() && this.searchInput.length <= 2) {
        //Default rooms, shown when search field is empty
        this.rooms = this.processRooms([
          new Room('General',1),
          new Room('Feedback',2),
          new Room('Help',3)
        ]);
        this.lastSearchCharacterInput = Number.NaN;
      }
    },125);

    //Setup websocket message handler
    messagingService.messages.subscribe( (msg: Message) => {
      this.messages.push(this.processMessage(msg));
    });
  }

  ngOnInit(): void {
    //Update favourites
    this.getFavouritesList( () => {
      //Then set default rooms
      this.rooms = this.processRooms([
        new Room('General',1),
        new Room('Feedback',2),
        new Room('Help',3)
      ]);
    });

    //Must wait for websock service to initialise
    setTimeout(() => {
      //Connect to default general room, must set ID correctly here!
      this.selectRoom(new Room('General',1));
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
    //If no date exists, assume current date
    if (msg.date === Date.prototype) msg.date = new Date();

    //Format date
    msg.displaydate = new Date(msg.date).toLocaleString();

    //Detect and embed yt videos
    const ytmatch = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/g.exec(msg.body);
    if (ytmatch) msg.displayembedlink = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${ytmatch[1]}`);

    //Detect and embed images
    const imgmatch = /(https?:\/\/.*\.(?:png|jpg))/g.exec(msg.body);
    if (imgmatch) msg.displayimglink = this.sanitizer.bypassSecurityTrustResourceUrl(imgmatch[1]);

    //Detect links
    msg.body = msg.body.replace(/(https?:\/\/[^\s]+)/g, function(url) {
      return `<a href="${url}">${url}</a>`;
    });
    
    //Detect uploads (this might get false positives in edge cases)
    const uploadmatch = /uploads\\[^\s]+\..*/g.exec(msg.body);
    if (uploadmatch) {
      const filename = uploadmatch[0];
      const fileext = (uploadmatch[0].split('.').pop() || '').toLowerCase();
      //If image, embed
      if (fileext == 'jpg') {
        msg.body = `<a href="${filename}" download="image.jpg">Uploaded image</a>`;
        msg.displayimglink = this.sanitizer.bypassSecurityTrustResourceUrl(uploadmatch[0]);
      }
      else {
        msg.body = `<a href="${filename}" download="file.${fileext}">Uploaded file</a>`;
      }
    }

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

  uploadFile(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.files) {
      const reader = new FileReader();
      reader.readAsDataURL(target.files[0]);
      reader.onload = () => {
        const fileBase64str = reader.result?.toString().substring(reader.result?.toString().indexOf(',') + 1);
        const fileExtension = (target.files![0].name.split('.').pop() || '').toLowerCase();

        const msg = {type:'upload',session:HelperFunctionsService.getCookie('session'),body:fileBase64str,extension:fileExtension};

        this.messagingService.messages.next(msg);
      }
    }
  }

  //ROOMS//
  createRoom(): void {
    this.userdataService.createRoom(HelperFunctionsService.getCookie('session') || '',this.searchInput).subscribe( data => {
      if (data.error) {
        this.snackbar.open(data.error,'OK');
        return;
      }

      this.selectRoom(new Room(this.initcap(this.searchInput),data.id));

      this.showCreateNewRoomCard = false;
      this.searchInput = '';
      this.lastSearchCharacterInput = Date.now();
      this.snackbar.open('Room created successfully!','OK');
    });
  }

  selectRoom(room: Room): void {
    this.currentRoom = room;

    //Get messages for new room
    this.userdataService.getRoomInfo(room.id).subscribe( data => {
      //Format dates
      data.forEach((msg: Message) => {
        msg = this.processMessage(msg);
      });

      this.messages = data;
    });

    //Update serverside current room info
    var msg = {type:'roomswitch',room:room.id};

    this.messagingService.messages.next(msg);
  }

  saveRoom(room:Room, save:boolean = true): void {
    this.userdataService.changeFavourite(HelperFunctionsService.getCookie('session') || '',room.id,save).subscribe( data => {
      if (data.error) {
        this.snackbar.open(data.error,'OK');
      }
      else {
        //Update clientside lists
        room.favourited = save;
        if (save) this.favourites.push(room);
        else this.favourites.splice(this.favourites.findIndex( (value) => {value.id === room.id}),1);

        this.snackbar.open(save ? 'Room favourited!' : 'Room removed from favourites.','OK');
      }
    });
  }

  processRooms(rooms:Room[]): Room[] {
    if (!this.getCookie('session')) return rooms;

    //Set each room's favourite status, make sure id is not string here
    for (let i = 0; i < rooms.length; i++) {
      rooms[i].favourited = this.favourites.find( (value) => { return value.id === rooms[i].id;} ) !== undefined;
    }

    return rooms;
  }

  getFavouritesList(callback?: Function): void {
    this.userdataService.getFavourites(HelperFunctionsService.getCookie('session') || '').subscribe( data => {
      this.favourites = data;

      if (callback) callback();
    });
  }

  //MISC//
  tabChange(newTabIndex: number): void {
    if (newTabIndex === 1) {
      //Get users' favourites list
      this.getFavouritesList();
    }
  }

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

  initcap(input: string): string {
    return input.toLowerCase().replace(/(?:^|\s)[a-z]/g, (m) => {
      return m.toUpperCase();
   });
  }
}