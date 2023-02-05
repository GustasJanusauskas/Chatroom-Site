import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

const VERBOSE_DEBUG = true;
const WEBSOCK_PORT = 4001;

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private websock!: WebSocket;
  private subject!: AnonymousSubject<MessageEvent>;
  public messages: Subject<any>;

  constructor(private router: Router) {
    const baseUrl = window.location.href.replace(String.raw`https:`,``).replace(String.raw`http:`,``).replace(`:${window.location.port}`,``).replace(/\//g,'');
    var msgUrl = `ws://${baseUrl}:${WEBSOCK_PORT}`;

    this.messages = <Subject<any>>this.connect(msgUrl).pipe(
        map(
            (response: MessageEvent): any => {
              if (VERBOSE_DEBUG) console.log('Message received from websocket: ', response.data);
                let data = JSON.parse(response.data);
                return data;
            }
        )
    );
  }

  public connect(url: string): AnonymousSubject<MessageEvent> {
      if (!this.subject) {
          this.subject = this.create(url);
          if (VERBOSE_DEBUG) console.log("Successfully connected: " + url);
      }
      return this.subject;
  }

  public disconnect() {
    if (this.subject && this.websock) {
        this.websock.close();
        if (VERBOSE_DEBUG) console.log("Disconnected websocket");
    }
  }

  private create(url: string): AnonymousSubject<MessageEvent> {
    let ws = new WebSocket(url);
    let observable = new Observable((obs: Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
    });
    let observer = {
        error: () => {},
        complete: () => {},
        next: (data: Object) => {
          if (VERBOSE_DEBUG) console.log('Message sent to websocket: ', data);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        }
    };
    this.websock = ws;
    return new AnonymousSubject<MessageEvent>(observer, observable);
  }
}
