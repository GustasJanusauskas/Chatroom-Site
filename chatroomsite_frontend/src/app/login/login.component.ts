import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from "@angular/forms";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = new FormControl("", [Validators.minLength(8),Validators.required] );
  password = new FormControl("", [Validators.minLength(8),Validators.required] );


  constructor() { 

  }

  ngOnInit(): void {

  }

  getErrorMsg(form: FormControl): string {
    if (form.hasError('required')) return 'You must enter a value.';
    else if (form.hasError('minlength')) return 'Value must be atleast 8 characters long.';
    else if (form.hasError('email')) return 'Email must be valid.';

    return '';
  }

  login(): void {
    if (this.username.invalid || this.password.invalid) return;

    //on success
    this.username.markAsUntouched();
    this.password.markAsUntouched();
    this.username.setValue('');
    this.password.setValue('');
  }
}