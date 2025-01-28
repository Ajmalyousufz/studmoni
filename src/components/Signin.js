import React, { useEffect, useState } from 'react';
import '../components/Signin.css';
import { BsFillShieldLockFill, BsTelephoneFill } from 'react-icons/bs';
import { Label } from '@mui/icons-material';
import OtpInput from "otp-input-react";
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { CgSpinner } from "react-icons/cg";
import { auth } from "../firebase/setup"
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { duration } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import MainContent  from './MainContent';
import TestContent from './TestContent';
import TestContent2 from './TestContent2';

const Signin = () => {

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state


  useEffect(() => {
    const initializeAuth = async () => {
        await setPersistence(auth, browserLocalPersistence); // Ensures persistence is set
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                console.log("Signed in as:", currentUser);
                setIsLoading(false); // Initialization complete
            } else {
                setUser(null);
                console.log("Signed out");
                setIsLoading(false);
            }
        });
    };
    initializeAuth();
}, []);


  function onCaptaVerify() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          // onSignup();
        }
      });
    }
  }

  function onSignup() {
    setLoading(true);

    onCaptaVerify(); // Initialize reCAPTCHA
    const appVerifier = window.recaptchaVerifier;

    const formattedPhone = '+' + phone; // Ensure correct format with country code
    signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      .then((confirmationResult) => {
        console.log("SMS sent", confirmationResult);
        window.confirmationResult = confirmationResult; // Save for verifying OTP
        setShowOTP(true);
        setLoading(false);
        toast.success("OTP Sent Successfully!");
      })
      .catch((error) => {
        console.error("Error sending SMS", error);
        setLoading(false);
        if (error.code === "auth/too-many-requests") {
          toast.error("Too many requests. Please try again later.");
        } else {
          toast.error("Failed to send OTP. Please check your phone number.");
        }
      });
  }

  const handleLogout = ()=>{
    signOut(auth)
     .then(() => {
        setUser(null);
        toast.success("Logged out successfully!");
      })
     .catch((error) => {
        console.error("Sign out error", error);
        toast.error("Failed to log out. Please try again later.");
      });
  }

  function onOTPVerify() {
    setLoading(true);
    window.confirmationResult
      .confirm(otp)
      .then((result) => {
        console.log("User signed in:", result.user);
        setUser(result.user);
        setLoading(false);
        toast.success("Login Successful!");
      })
      .catch((error) => {
        console.error("User signed in error:", error);
        setLoading(false);
        if (error.code === "auth/invalid-verification-code") {
          toast.error("Invalid OTP. Please try again.");
        } else {
          toast.error("Failed to verify OTP. Please check your phone number.");
        }
      });
  }
    // Render loading spinner if still initializing
    if (isLoading) {
      return (
        <section className="bg-emerald-500 flex items-center justify-center h-screen">
          <div className="loader"></div>
        </section>
      );
    }

  return (
    <section className='bg-emerald-500 flex items-center justify-center h-screen'>
      <div style={{display:"flex", width:"100%",justifyContent:"center", height:"100%"}}>
        <Toaster toastOptions={{ duration: 4000 }} />
        <div id="recaptcha-container"></div>
        {user ?
          (
            //  <MainContent/>
            //<TestContent/>
            <TestContent2/>
            // <div>
            //   <MainContent/>
            // <h2 className="text-center text-white font-medium text-2xl">
            //   Login Success
            // </h2>
            // <button onClick={() => handleLogout()} className="bg-white text-emerald-600 py-2.5 my-3 rounded w-full flex gap-1 items-center justify-center">Log out</button>
            // </div>
          )
          :
          (
            <div className="w-80 flex flex-col gap-4 rounded-lg p-4 justify-center" style={{height:"100%"}}>
              <h1 className="text-center leading-normal text-white font-medium text-3xl mb-6">

                Welcome to <br /> STUDMONI

              </h1>
              {showOTP ?
                (
                  <>
                    <div className="bg-white text-emerates-500 w-fit mx-auto p-4 rounded-full">
                      <BsFillShieldLockFill size={30} />
                    </div>
                    <label htmlFor="otp"
                      className='font-bold text-xl text-white text-center'>
                      Enter Your OTP
                    </label>
                    <OtpInput
                      value={otp}
                      onChange={setOtp}
                      OTPLength={6}
                      otpType="number"
                      disabled={false}
                      autofocus
                      className="opt-container"
                    ></OtpInput>
                    <button onClick={onOTPVerify} className="bg-emerald-600 text-white py-2.5 rounded w-full flex gap-1 items-center justify-center">
                      {
                        loading && <CgSpinner size={20}
                          className="mt-1 animate-spin" />
                      }
                      <span>Verify OTP</span>
                    </button>
                  </>
                )
                :
                (
                  <>
                    <div className="bg-white text-emerates-500 w-fit mx-auto p-4 rounded-full">
                      <BsTelephoneFill size={30} />
                    </div>
                    <label htmlFor=""
                      className='font-bold text-xl text-white text-center'>
                      Verify your phone number
                    </label>
                    <PhoneInput country={"in"} value={phone}
                      onChange={setPhone} />
                    <button id='sign-in-button' onClick={onSignup} className="bg-emerald-600 text-white py-2.5 rounded w-full flex gap-1 items-center justify-center">
                      {
                        loading && <CgSpinner size={20}
                          className="mt-1 animate-spin" />
                      }
                      <span>Send Code Via SMS</span>
                    </button>
                  </>
                )}

            </div>

          )}
      </div>
    </section>
  );
}

export default Signin