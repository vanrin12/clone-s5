import React from 'react';
import { BiLogoGmail } from "react-icons/bi";
import { BsKey } from "react-icons/bs";
import { VscEye } from "react-icons/vsc";
import { PiEyeClosedThin } from "react-icons/pi";
import { FaFacebook } from "react-icons/fa";
import { FaStaylinked } from "react-icons/fa6";
import { VscTwitter } from "react-icons/vsc";
import { GoogleOutlined } from '@ant-design/icons';

export const LoginForm = ({
  loginUser,
  handleLoginChange,
  handleLoginSubmit,
  showLoginPassword,
  setShowLoginPassword,
  loginError
}) => {
  return (
    <form onSubmit={handleLoginSubmit} className="sign-in-form">
      <h2 className="title">Đăng nhập</h2>
      {loginError && <p className="error-message">{loginError}</p>}
      <div className="input-field">
        <BiLogoGmail className="fas fa-user" />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={loginUser.email}
          onChange={handleLoginChange}
          required
        />
      </div>
      <div className="input-field">
        <BsKey className="fas fa-lock" />
        <input
          type={showLoginPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={loginUser.password}
          onChange={handleLoginChange}
          required
        />
        <button
          type="button"
          onClick={() => setShowLoginPassword(!showLoginPassword)}
          className="password-toggle"
          style={{
            background: 'none',
            border: 'none',
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: '#aaa'
          }}
        >
          {showLoginPassword ? <VscEye style={{ fontSize: '1.3rem' }} /> : <PiEyeClosedThin style={{ fontSize: '1.3rem' }} />}
        </button>
      </div>
      <input type="submit" value="Đăng nhập" className="btn solid" />
      <p className="social-text">Or Đăng nhập with social platforms</p>
      <div className="social-media">
        <button className="social-icon">
          <FaFacebook className="fab fa-facebook-f" />
        </button>
        <button className="social-icon">
          <VscTwitter className="fab fa-twitter" />
        </button>
        <button className="social-icon">
          <GoogleOutlined className="fab fa-google" />
        </button>
        <button className="social-icon">
          <FaStaylinked className="fab fa-linkedin-in" />
        </button>
      </div>
    </form>
  );
};


