// Login.js
import React, { useState } from "react";
import PhoneInput from "react-phone-number-input/input";
import 'react-phone-number-input/style.css';
import { TextField, Button, Input } from '@mui/material';
import '../components/RegisterPage.css';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import  "../components/firebase";
import { auth } from "../components/firebase";


const RegisterPage = () => {

    const [value, setValue] = useState()
    const [phone, setPhone] = useState("");
    const [user, setUser] = useState(null);
    const [otp, setOtp] = useState("");
    



    const sendOtp = async () => {
        console.log("expired : l")
        try {

            window.RecaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    console.log("response : "+response)
                  // reCAPTCHA solved, allow signInWithPhoneNumber.
                  // ...
                },
                'expired-callback': () => {
                    console.log("expired : ")
                  // Response expired. Ask user to solve reCAPTCHA again.
                  // ...
                }
              });
        } catch (error) {
            console.log(error);
        }
    }

    const verifyOtp = async () => {
        try {
            const data = await user.confirm(otp);
            console.log("otp varified otp data : " + data.toString());
        } catch (err) {
            console.error("Otp error : " + err);
        }
    }

    return (
        <div>
            <div className="phone-signin">
                <div className="phone-container">

                    <h1 style={{ color: '#fff' }}>StudMoni</h1>
                    <div className="phone-input">
                        <PhoneInput className="phone-input"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={setPhone} />
                    </div>
                    <div className="sent-otp-btn">

                        <Button onClick={sendOtp} sx={{ marginTop: "10px" }} variant="contained">Send Otp</Button>
                        <div id="recaptcha-container"></div>
                    </div>

                    <div className="verify-otp-div" style={{ marginTop: '30px' }}>

                        <TextField onChange={(e) => setOtp(e.target.value)} className="otp-tf" variant="outlined" size="small" label="Enter Otp" />

                        <Button onClick={verifyOtp} sx={{ marginTop: "10px" }} variant="contained" color="success">Verify Otp</Button>
                    </div>



                </div>

            </div>
        </div>
    );
};

export default RegisterPage;
