import React, { useState } from 'react';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
import  {app, auth}  from './firebase'; // Import your Firebase configuration
import {RecaptchaVerifier} from 'firebase/auth';
import App from '../App';

function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  const createRecaptchaVerifier = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, proceed with phone number verification
        },
      }, {auth});
    }
    setRecaptchaVerifier(window.recaptchaVerifier);
  };

  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
  };

  const sendVerificationCode = async () => {
    createRecaptchaVerifier();

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      // Handle confirmation object (e.g., store it for later use)
    } catch (error) {
      // Handle errors (e.g., invalid phone number, network issues)
    }
  };

  return (
    <div>
      <h1>Phone Authenticationn</h1>
      <div id="recaptcha-container"></div> {/* Container for reCAPTCHA */}
      <input
        type="tel"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
      />
      <button onClick={sendVerificationCode}>Send Verification Code</button>
    </div>
  );
}

export default PhoneAuth;
