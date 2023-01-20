import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from "@angular/forms";
import {Router} from "@angular/router"
import {MatSnackBar} from '@angular/material/snack-bar';

import { UserdataService } from "../services/userdata.service";
import { HelperFunctionsService } from "../services/helper-functions.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = new FormControl("", [Validators.minLength(8),Validators.required] );
  password = new FormControl("", [Validators.minLength(8),Validators.required] );


  constructor(private userdataservice: UserdataService, private router: Router, private snackBar: MatSnackBar) { 

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

    this.userdataservice.loginUser(this.username.value!,this.password.value!).subscribe( data => {
      if (data.error) return;

      HelperFunctionsService.setCookie('session',data.session);

      //on success
      this.username.markAsUntouched();
      this.password.markAsUntouched();
      this.username.setValue('');
      this.password.setValue('');

      this.snackBar.open('Logged in successfully.','OK');
      //redirect back to main page
      this.router.navigate(['/']);
    });
  }
}