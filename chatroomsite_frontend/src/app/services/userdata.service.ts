import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class UserdataService {

  constructor(private http: HttpClient) {}

  loginUser(user: string, pass: string): Observable<any> {
    var data = {username: user, password: pass};
    return this.http.post<any>('/login',data,httpOptions);
  }

  registerUser(user: string, pass: string, email: string): Observable<any> {
    var data = {username: user, password: pass, email: email};
    return this.http.post<any>('/register',data,httpOptions);
  }
}