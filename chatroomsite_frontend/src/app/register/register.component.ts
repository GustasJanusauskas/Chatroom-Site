import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from "@angular/forms";
import {MatSnackBar} from '@angular/material/snack-bar';

import { UserdataService } from "../services/userdata.service";
import { HelperFunctionsService } from "../services/helper-functions.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  email = new FormControl("", [Validators.email,Validators.required] );
  username = new FormControl("", [Validators.minLength(8),Validators.required] );
  password = new FormControl("", [Validators.minLength(8),Validators.required] );


  constructor(private userdataservice: UserdataService, private snackBar: MatSnackBar) { 

  }

  ngOnInit(): void {

  }

  getErrorMsg(form: FormControl): string {
    if (form.hasError('required')) return 'You must enter a value.';
    else if (form.hasError('minlength')) return 'Value must be atleast 8 characters long.';
    else if (form.hasError('email')) return 'Email must be valid.';

    return '';
  }

  register(): void {
    if (this.username.invalid || this.password.invalid || this.email.invalid) return;

    this.userdataservice.registerUser(this.username.value!,this.password.value!,this.email.value!).subscribe( data => {
      if (data.error) {
        this.snackBar.open(data.error,'OK');
        return;
      }

      //on success
      this.email.markAsUntouched();
      this.username.markAsUntouched();
      this.password.markAsUntouched();
      this.email.setValue('');
      this.username.setValue('');
      this.password.setValue('');

      this.snackBar.open('Account created successfully! You can now log in.','OK');
    });
  }
}
