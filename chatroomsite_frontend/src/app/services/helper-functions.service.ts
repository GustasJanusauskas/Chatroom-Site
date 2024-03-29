import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {

  constructor() { }

  static randomString(length:number) {
    var pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var result = "";
    for (var x = 0; x < length;x++) {
    result += pool.charAt(Math.random() * pool.length - 1);
    }
    return result;
  }

  static formatToPSQLTime(time: Date) {
    var amPM = 'am';
    if (time.getHours() > 12) {
      time.setHours(time.getHours() - 12);
      amPM = 'pm';
    }

    var result = `${time.getFullYear()}-${time.getMonth() > 8 ? time.getMonth() + 1 : '0' + (time.getMonth() + 1)}-${time.getUTCDate() > 9 ? time.getUTCDate() : '0' + time.getUTCDate()} at ${time.getHours() > 9 ? time.getHours() : '0' + time.getHours()}:${time.getMinutes() > 9 ? time.getMinutes() : '0' + time.getMinutes()}${amPM}`;
    return result;
  }

  static lettersOnly(event: KeyboardEvent, extended: boolean = false) {
    if (extended) return `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.;"'()`.includes(event.key);
    return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(event.key);
  }

  static noJsonSymbols(event: KeyboardEvent) {
    return !`"{}`.includes(event.key);
  }

  static createFakeArray(l:number) {
    var res = new Array(l);
    for (let x = 0; x < l; x++) {
      res[x] = x;
    }
    return res;
  }

  static toTitleCase(str: String) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  static setCookie(cname: string, cvalue: string, exdays: number = -1) {
    var expires;
    if (exdays != -1) {
      const d = new Date();
      d.setTime(d.getTime() + (exdays*24*60*60*1000));
      expires = 'expires='+ d.toUTCString();
    }
    else expires = 'expires=Session';

    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/;SameSite=Strict;';
  }

  static getCookie(name: string) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }

  static deleteCookie( name: string ) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Strict;';
  }
}
