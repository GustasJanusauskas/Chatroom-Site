import { Component, Input, Output, EventEmitter } from '@angular/core';

import { HelperFunctionsService } from "../services/helper-functions.service";
import { Room } from '../classes/room';

@Component({
  selector: 'app-room-card',
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.css']
})
export class RoomCardComponent {
  @Input() room!:Room;
  @Input() noFavouriteOverride: boolean = false;

  @Output() onSelectRoom: EventEmitter<Room> = new EventEmitter<Room>();
  @Output() onSaveRoom: EventEmitter<Room> = new EventEmitter<Room>();
  @Output() onDeleteRoom: EventEmitter<Room> = new EventEmitter<Room>();

  getCookie = HelperFunctionsService.getCookie;

  selectRoom(): void {
    this.onSelectRoom.emit(this.room);
  }

  saveRoom(): void {
    this.onSaveRoom.emit(this.room);
  }

  deleteRoom(): void {
    this.onDeleteRoom.emit(this.room);
  }
}
