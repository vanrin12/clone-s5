import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../../assets/images/logo192.png';
import './testlogin.css';
import { RegisterForm } from './RegisterForm';
import { LoginForm } from './LoginForm';
import config from './../../../config';

export default function LoginRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignUpMode, setIsSignUpMode] = useState(location.pathname === '/register');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginUser, setLoginUser] = useState({
    email: '',
    password: ''
  });
  const [registerUser, setRegisterUser] = useState({
    fullname: '',
    username: '',
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Effect theo dõi URL để cập nhật mode
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsSignUpMode(true);
    } else if (location.pathname === '/login') {
      setIsSignUpMode(false);
    }
  }, [location.pathname]);

  // Effect xử lý animation container
  useEffect(() => {
    const container = document.querySelector('.container');
    if (container) {
      if (isSignUpMode) {
        container.classList.add('sign-up-mode');
      } else {
        container.classList.remove('sign-up-mode');
      }
    }
  }, [isSignUpMode]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginUser({
      ...loginUser,
      [name]: value
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterUser({
      ...registerUser,
      [name]: value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.API_HOST}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginUser),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.message);
      } else {
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('_id', data.user._id);
        setLoginError('');
        navigate("/");
      }
    } catch (error) {
      setLoginError('Đã xảy ra lỗi, vui lòng thử lại!');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.API_HOST}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerUser),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.message || 'Đã xảy ra lỗi không xác định');
        setSuccessMessage('');
      } else {
        setSuccessMessage('Đăng ký thành công! Chuyển hướng đến trang đăng nhập.');
        setRegisterUser({ username: '', fullname: '', email: '', password: '' });
        setRegisterError('');
        setTimeout(() => {
          navigate('/login');
          setIsSignUpMode(false);
        }, 500);
      }
    } catch (error) {
      setRegisterError('Đã xảy ra lỗi, vui lòng thử lại!');
      setSuccessMessage('');
    }
  };

  const handleSignUpClick = () => {
    navigate('/register');
    setIsSignUpMode(true);
    setLoginError('');
    setSuccessMessage('');
    setLoginUser({
      email: '',
      password: ''
    });
  };

  const handleSignInClick = () => {
    navigate('/login');
    setIsSignUpMode(false);
    setRegisterError('');
    setSuccessMessage('');
    setRegisterUser({
      fullname: '',
      username: '',
      email: '',
      password: ''
    });
  };

  return (
    <div className={`container ${isSignUpMode ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">
          <LoginForm
            loginUser={loginUser}
            handleLoginChange={handleLoginChange}
            handleLoginSubmit={handleLoginSubmit}
            showLoginPassword={showLoginPassword}
            setShowLoginPassword={setShowLoginPassword}
            loginError={loginError}
          />

          <RegisterForm
            registerUser={registerUser}
            handleRegisterChange={handleRegisterChange}
            handleRegisterSubmit={handleRegisterSubmit}
            showRegisterPassword={showRegisterPassword}
            setShowRegisterPassword={setShowRegisterPassword}
            registerError={registerError}
            successMessage={successMessage}
          />
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <img src={Logo} alt="" />
            <p>
              Đăng ký để xem ảnh và video từ bạn bè.
            </p>
            <button className="btn transparent" id="sign-up-btn" onClick={handleSignUpClick}>
              Đăng ký
            </button>
          </div>
          <img src="img/log.svg" className="image" alt="" />
        </div>
        <div className="panel right-panel">
          <div className="content">
            <img src={Logo} alt="" />
            <p>
              Đăng nhập để tiếp tục với tài khoản của bạn
            </p>
            <button className="btn transparent" id="sign-in-btn" onClick={handleSignInClick}>
              Đăng nhập
            </button>
          </div>
          <img src="img/register.svg" className="image" alt="" />
        </div>
      </div>
    </div>
  );
}