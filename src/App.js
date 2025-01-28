import { useState } from 'react';
// import './App.css';
import Header from './components/Header';
import FloatingButton from './components/FloatingButton';
import MyCounter from './MyCounter';
import Employee from './Employee';
import React from 'react';
import MainContent from './components/MainContent';
import RegisterPage from './components/RegisterPage';
// import { app } from "./components/firebase"; 
import Signin from './components/Signin';
import Signintwo from './components/Signintwo';
function App() {

  const [isLogin, setIsLogin] = useState(false);

  if (!isLogin) {

    return (

      <div >

        {/* <RegisterPage/> */}
        <Signin/>
        {/* <Signintwo/> */}
        
      </div>

    )

  } else {

    return (
      <div className='App'>

        <Header data='ajmal' />

        <MainContent />

        <FloatingButton />

      </div>
    );
  }
}

export default App;

function Hello() {
  return (
    <h1 className='hello' style={{ backgroundColor: 'cyan', color: 'GrayText' }}>This is an Inline Function</h1>
  );
}