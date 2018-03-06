import { Component, OnInit } from '@angular/core';
import {
    FormGroup,
    FormBuilder,
    FormArray,
    Validators,
    AbstractControl,
    ValidatorFn
} from '@angular/forms';



import { Customer } from './customer';
import 'rxjs/add/operator/debounceTime';

function ratingRange(min: number, max: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
        if (c.value !== undefined && (isNaN(c.value) || c.value < min || c.value > max)) {
            return { 'range': true };
        }
        return null;
    }
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
    const emailControl = c.get('email');
    const confirmControl = c.get('confirmEmail');
    if (emailControl.pristine || confirmControl.pristine) {
        return null;
    }
    if (emailControl.value === confirmControl.value) {
        return null;
    }

    return { 'match': true };
}

@Component({
    selector: 'my-signup',
    templateUrl: './app/customers/customer.component.html'
})
export class CustomerComponent implements OnInit {

    customerForm: FormGroup;
    customer: Customer = new Customer();

    minRating: number = 1;
    maxRating: number = 10;

    emailMessage: string;

    private validationMessages = {
        required: 'Please enter your email address.',
        pattern: 'Please enter a valid email address.'
    }

    get addresses(): FormArray {
        return <FormArray>this.customerForm.get('addresses');
    }

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.customerForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(3)]],
            lastName: ['', [Validators.required, Validators.maxLength(50)]],
            emailGroup: this.fb.group({
                email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+')]],
                confirmEmail: ['', Validators.required]
            }, { validator: emailMatcher }),
            sendCatalog: true,
            phone: '',
            notification: 'email',
            rating: ['', ratingRange(this.minRating, this.maxRating)],
            addresses: this.fb.array([this.buildAddresses()])
        });
        this.customerForm.get('notification').valueChanges
            .subscribe(value => this.setNotification(value), error => console.log(error));

        const emailControl = this.customerForm.get('emailGroup.email');
        emailControl.valueChanges.debounceTime(1000).subscribe(value => {
            this.emailMessage = this.getMessage(emailControl, this.validationMessages);
        });
    }

    save(): void {
        console.log(this.customerForm);
        console.log('Saved: ' + JSON.stringify(this.customerForm.value));
    }

    populateTestData(): void {
        const customer = new Customer('John', 'Smith', 'jonny@mail.ru', true);
        this.customerForm.patchValue(customer);
    }

    setNotification(notifyVia: string): void {
        const phoneControl = this.customerForm.get('phone');
        if (notifyVia === 'text') {
            phoneControl.setValidators(Validators.required);
        } else {
            phoneControl.clearValidators();
        }
        phoneControl.updateValueAndValidity();
    }

    getMessage(c: AbstractControl, messages: { [key: string]: string }): string {
        let message = '';
        if ((c.touched || c.dirty) && c.errors) {
            message = Object.keys(c.errors).map(key =>
                messages[key]).join(' ');
        }
        return message;
    }

    addAddress(): void {
        this.addresses.push(this.buildAddresses());
    }

    buildAddresses(): FormGroup {
        return this.fb.group({
            addressType: 'home',
            street1: '',
            street2: '',
            city: '',
            state: '',
            zip: ''
        })
    }
}
