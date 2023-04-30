import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComponent } from './chat.component';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { Message } from "../classes/message";
import { HelperFunctionsService } from "../services/helper-functions.service";

function genTestMsg(length: number = 50): Message {
  var testMsgContent = HelperFunctionsService.randomString(length);
  var testMsg = new Message();

  testMsg.body = testMsgContent;
  testMsg.date = new Date();

  return testMsg;
}

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatTabsModule,
        MatIconModule,
        FormsModule,
        MatInputModule
      ],
      declarations: [ ChatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect and process long messages correctly', () => {
    var testMsg = genTestMsg(150);

    expect(component.processMessage(testMsg).displaybody).toContain('...');
    expect(component.processMessage(testMsg).displaymorebtn).toBeTrue();
  });

  it('should not crash when processing messages with no date', () => {
    var testMsg = new Message();
    testMsg.body = 'nodatemsg';

    expect(component.processMessage(testMsg)).toBeTruthy();
  });

  it('should detect yt videos when processing messages', () => {
    var testMsg = genTestMsg(50);
    testMsg.body = 'https://youtu.be/jNQXAC9IVRw';

    expect(component.processMessage(testMsg).displayembedlink).toBeTruthy();
  });

  it('should detect images when processing messages', () => {
    var testMsg = genTestMsg(50);
    testMsg.body = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/TwibrightLinksTestCard.png';

    expect(component.processMessage(testMsg).displayimglink).toBeTruthy();
  });

  it('should detect links when processing messages', () => {
    var testMsg = genTestMsg(50);
    testMsg.body += ' https://www.google.com/';

    expect(component.processMessage(testMsg).body).toContain('<a href=');
  });
});
