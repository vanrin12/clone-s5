import React from 'react';
import { RiAccountCircleFill } from "react-icons/ri";
import { MdOutlineAccountCircle } from "react-icons/md";
import { BiLogoGmail } from "react-icons/bi";
import { BsKey } from "react-icons/bs";
import { VscEye } from "react-icons/vsc";
import { PiEyeClosedThin } from "react-icons/pi";
import { FaFacebook } from "react-icons/fa";
import { FaStaylinked } from "react-icons/fa6";
import { VscTwitter } from "react-icons/vsc";
import { GoogleOutlined } from '@ant-design/icons';


export const RegisterForm = ({
  registerUser,
  handleRegisterChange,
  handleRegisterSubmit,
  showRegisterPassword,
  setShowRegisterPassword,
  registerError,
  successMessage
}) => {
  return (
    <form onSubmit={handleRegisterSubmit} className="sign-up-form">
      <h2 className="title">Đăng ký</h2>
      {registerError && <p className="error-message">{registerError}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      <div className="input-field">
        <RiAccountCircleFill className="fas fa-user" />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={registerUser.username}
          onChange={handleRegisterChange}
          required
        />
      </div>
      <div className="input-field">
        <MdOutlineAccountCircle className="fas fa-user" />
        <input
          type="text"
          name="fullname"
          placeholder="Full Name"
          value={registerUser.fullname}
          onChange={handleRegisterChange}
          required
        />
      </div>
      <div className="input-field">
        <BiLogoGmail className="fas fa-envelope" />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={registerUser.email}
          onChange={handleRegisterChange}
          required
        />
      </div>
      <div className="input-field">
        <BsKey className="fas fa-lock" />
        <input
          type={showRegisterPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={registerUser.password}
          onChange={handleRegisterChange}
          required
        />
        <button
          type="button"
          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
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

          {showRegisterPassword ? <VscEye style={{ fontSize: '1.3rem' }} /> : <PiEyeClosedThin style={{ fontSize: '1.3rem' }} />}
        </button>
      </div>
      <span className="terms">
        Bằng cách đăng ký, bạn đồng ý với Điều khoản, Chính sách quyền riêng tư và Chính sách cookie của chúng tôi.
      </span>
      <input type="submit" className="btn" value="Đăng ký" />
      <p className="social-text">Or Đăng ký with social platforms</p>
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


