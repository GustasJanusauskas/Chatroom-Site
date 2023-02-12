import { SafeUrl } from "@angular/platform-browser";

export class Message {
    id: number = -1;

    author: string = '';
    body: string = '';
    date: Date = Date.prototype;

    displaybody: string = '';
    displaydate: string = '';

    displayembedlink: SafeUrl = '';
    displayimglink: SafeUrl = '';
    
    displaymorebtn: boolean = false;
}