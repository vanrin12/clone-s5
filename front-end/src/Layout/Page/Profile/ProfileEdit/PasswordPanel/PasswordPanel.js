import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  // sendOtp,
  changePassword,
  clearMessages,
  // verifyCurrentPassword,
} from './../../../../../store/features/profile/profileSlice';

const PasswordPanel = ({
  isInModal = false,
  onCloseModal,
  onPasswordSubmit = () => { },
  onSuccess = () => { },
  onError = () => { },
  successMessage: externalSuccessMessage,
  errorMessage: externalErrorMessage
}) => {
  const dispatch = useDispatch();
  const {
    error,
    otpSending,
    passwordChanging,
    otpMessage,
    passwordMessage,
  } = useSelector((state) => state.profile);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verifyCurrentPasswordErr, setVerifyCurrentPasswordErr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const displayMessage = successMessage || externalSuccessMessage || passwordMessage;


  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setSuccessMessage('');
      setIsSubmitting(false);

      if (error.toLowerCase().includes('otp')) {
        setOtp(['', '', '', '', '', '']);
      }
    }

    if (otpMessage) {
      setSuccessMessage(otpMessage);
      onSuccess(otpMessage);
      setErrorMessage('');
      setVerifyCurrentPasswordErr('');
      setIsSubmitting(false);
    }

    if (passwordMessage) {
      setSuccessMessage(passwordMessage);
      onSuccess(passwordMessage);
      setErrorMessage('');
      setVerifyCurrentPasswordErr('');
      setIsSubmitting(false);

      setOtp(['', '', '', '', '', '']);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const timer = setTimeout(() => {
        setSuccessMessage('');
        dispatch(clearMessages());
        if (isInModal && onCloseModal) {
          onCloseModal();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, otpMessage, passwordMessage, dispatch, isInModal, onCloseModal, onSuccess]);

  const handleChangePassword = async () => {
    try {
      setIsSubmitting(true);

      // Validation checks
      if (!currentPassword || !newPassword || !confirmPassword) {
        onError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      if (newPassword !== confirmPassword) {
        onError('Mật khẩu mới không khớp');
        return;
      }

      if (newPassword.length < 6) {
        onError('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      if (currentPassword === newPassword) {
        onError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
        return;
      }

      // Call parent's onPasswordSubmit
      onPasswordSubmit({
        currentPassword,
        newPassword
      });

    } catch (err) {
      onError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.value !== '') {
      if (element.nextSibling) {
        element.nextSibling.focus();
      }
    }
  };

  const handleOTPSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      dispatch(clearMessages());

      const otpValue = otp.join('');
      if (otpValue.length !== 6) {
        setErrorMessage('Vui lòng nhập đủ mã OTP');
        setIsSubmitting(false);
        return;
      }

      await dispatch(changePassword({
        currentPassword,
        newPassword,
        otp: otpValue
      })).unwrap();

      // Set success message directly
      setSuccessMessage('Thay đổi mật khẩu thành công!');

    } catch (err) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInModal) {
    return (
      <div className="mt-4">
        <p className="text-gray-300 mb-4">
          Vui lòng nhập mã OTP được gửi đến email của bạn
        </p>

        <div className="flex justify-center gap-2">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              className="w-12 h-12 text-center bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 input-edit"
              value={data}
              onChange={(e) => handleOTPChange(e.target, index)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-red-500 mt-4 text-center">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            onClick={onCloseModal}
          >
            Hủy
          </button>
          <button
            className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleOTPSubmit}
            disabled={passwordChanging}
          >
            {passwordChanging ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-full">
      <div className="w-full max-w-2xl px-8 py-8">
        <h3 className="mb-12 text-xl font-bold">Đổi mật khẩu</h3>

        <div className="space-y-6">
          <div>
            <label className="block mb-3">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 input-edit"
              placeholder="Nhập mật khẩu hiện tại"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </div>

          <div>
            <label className="block mb-3">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 input-edit"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </div>

          <div>
            <label className="block mb-3">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 input-edit"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
            />
          </div>

          <div className="pt-4">
            <button
              className="bg-blue-500 px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleChangePassword}
              disabled={isSubmitting || otpSending || passwordChanging}
            >
              {isSubmitting ? 'Đang xử lý...' : otpSending ? 'Đang gửi OTP...' : 'Đổi mật khẩu'}
            </button>

            {/* Hiển thị thông báo lỗi */}
            {errorMessage && (
              <p className="text-red-500 mt-2">{errorMessage}</p>
            )}
            {externalErrorMessage && (
              <p className="text-red-500 mt-2">{externalErrorMessage}</p>
            )}
            {/* Hiển thị thông báo thành công */}
            {successMessage && (
              <p className="text-green-500 mt-2">{successMessage}</p>
            )}
            {displayMessage && (
              <p className="text-green-500 mt-2">{displayMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPanel;