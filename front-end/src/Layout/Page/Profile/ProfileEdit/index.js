import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useMatch } from 'react-router-dom';
import PasswordPanel from './PasswordPanel/PasswordPanel';
import PrivacyPanel from './PrivacyPanel/PrivacyPanel';
import NotificationsPanel from './NotificationsPanel/NotificationsPanel';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../Components/ui/alert-dialog';

import {
  clearProfileData,
  fetchProfileData,
  uploadProfilePicture,
  updateProfile,
  setShowOTPModal,
  changePassword,
  verifyCurrentPassword,
  sendOtp,
} from './../../../../store/features/profile/profileSlice';


import {
  Settings,
  Bell,
  Lock,
  UserPlus,
  XCircle,
  Video,
  User,
  KeyRound
} from 'lucide-react';
import './profileEdit.scss';
import Logo from "../../../../assets/images/logo192.png";

export default function ProfileEdit() {
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();


  const isSettingRoute = useMatch('/account/setting');
  const isNotificationRoute = useMatch('/account/notification');
  const isPrivacyRoute = useMatch('/account/privacy');
  const isPasswordRoute = useMatch('/account/changepassword');


  const determineActivePanel = () => {
    if (isSettingRoute) return 'profile';
    if (isNotificationRoute) return 'notifications';
    if (isPrivacyRoute) return 'privacy';
    if (isPasswordRoute) return 'password';
    return 'profile';
  };

  const {
    profileData,
    loading,
    error,
    avatarUploading,
    showOTPModal,
    passwordChanging
  } = useSelector((state) => state.profile);

  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanel, setActivePanel] = useState(determineActivePanel());
  const [successMessage, setSuccessMessage] = useState('');
  // Thêm state để quản lý message cho PasswordPanel
  const [otpError, setOtpError] = useState('');
  const [passwordPanelMessage, setPasswordPanelMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isBioInitialized, setIsBioInitialized] = useState(false);
  const textareaRef = useRef(null);
  const [otpData, setOtpData] = useState({
    currentPassword: '',
    newPassword: '',
    otp: ['', '', '', '', '', '']
  });

  // Handler for OTP input change
  const handleOTPChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtpError(''); // Clear error when user starts typing

    const newOtp = [...otpData.otp];
    newOtp[index] = element.value;
    setOtpData(prev => ({
      ...prev,
      otp: newOtp
    }));

    // Focus next input
    if (element.value !== '' && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  // Handler for OTP submission
  const handleOTPSubmit = async () => {
    try {
      const otpValue = otpData.otp.join('');
      if (otpValue.length !== 6) {
        setOtpError('Vui lòng nhập đủ 6 số OTP');
        return;
      }
      setOtpError('');

      const result = await dispatch(changePassword({
        currentPassword: otpData.currentPassword,
        newPassword: otpData.newPassword,
        otp: otpValue
      })).unwrap();

      if (result) {
        const successMsg = 'Thay đổi mật khẩu thành công!';
        setSuccessMessage(successMsg);

        if (activePanel === 'password') {
          setPasswordPanelMessage(successMsg);
        }

        setTimeout(() => {
          setSuccessMessage('');
          dispatch(setShowOTPModal(false));
          setPasswordPanelMessage('');
        }, 3000);
      }
    } catch (err) {
      setOtpError('Mã OTP không hợp lệ. Vui lòng kiểm tra lại!');
    }
  };

  // Xử lý dán dữ liệu OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const newOtp = [...otpData.otp];

    // Dán dữ liệu vào từng ô
    pastedData.split('').forEach((char, idx) => {
      if (idx < newOtp.length) {
        newOtp[idx] = char;
      }
    });

    setOtpData({ ...otpData, otp: newOtp });

    // Tự động chuyển focus sang ô tiếp theo sau khi dán dữ liệu
    const nextInput = document.querySelector(`input[name="otp-${pastedData.length - 1}"]`);
    if (nextInput) {
      nextInput.focus();
    }
  };

  // Xử lý khi người dùng xóa ký tự
  const handleBackspace = (e, idx) => {
    if (e.key === "Backspace" && !otpData.otp[idx]) {
      // Nếu ô hiện tại rỗng và nhấn backspace, di chuyển focus sang ô trước
      if (idx > 0) {
        const prevInput = document.querySelector(`input[name="otp-${idx - 1}"]`);
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  };

  // Handler to receive password data from PasswordPanel
  const handlePasswordData = async (passwordData) => {
    if (!passwordData) return;

    try {
      // Reset error message
      setPasswordError('');

      // Verify current password
      await dispatch(verifyCurrentPassword({
        currentPassword: passwordData.currentPassword
      })).unwrap();

      setOtpData(prev => ({
        ...prev,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }));

    } catch (error) {
      setPasswordError('Mật khẩu cũ không chính xác');
      return;
    }

    try {
      await dispatch(sendOtp()).unwrap();
      // Nếu gửi OTP thành công, mở modal OTP
      dispatch(setShowOTPModal(true));
    } catch (error) {
      setPasswordError(error.message || 'Có lỗi xảy ra khi gửi OTP');
    }
  };

  useEffect(() => {
    setActivePanel(determineActivePanel());
  }, [location.pathname]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleNavigation = (path, panel) => {
    navigate(path);
    setActivePanel(panel);
  };

  useEffect(() => {
    const myUserId = localStorage.getItem('_id');
    dispatch(fetchProfileData({ myUserId }));

    return () => {
      dispatch(clearProfileData());
    };
  }, [dispatch]);

  const handleNavigationWithModal = (path, panel) => {
    // Don't automatically close modal when navigating to password route
    if (path === '/account/changepassword') {
      navigate(path);
      setActivePanel(panel);
    } else {
      // Only close modal when navigating away from password route
      if (showOTPModal) {
        dispatch(setShowOTPModal(false));
      }
      navigate(path);
      setActivePanel(panel);
    }
  };

  // Thêm effect để xử lý modal khi route thay đổi
  useEffect(() => {
    // Chỉ reset modal khi chuyển từ route password sang route khác
    if (!isPasswordRoute && showOTPModal) {
      dispatch(setShowOTPModal(false));
    }
  }, [location.pathname, isPasswordRoute, showOTPModal, dispatch, profileData]);

  // Cập nhật bio và gender khi profileData thay đổi lần đầu
  useEffect(() => {
    if (profileData && !isBioInitialized) {
      setBio(profileData.bio || '');
      setGender(profileData.gender === 'female' ? 'Nữ' : 'Nam');
      setIsBioInitialized(true); // Đảm bảo chỉ set 1 lần
    }
  }, [profileData, isBioInitialized]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [bio]);

  const handleChange = (e) => {
    const value = e.target.value;
    setBio(value);
  };


  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const myUserId = localStorage.getItem('_id');
      try {
        const resultAction = await dispatch(uploadProfilePicture({
          file,
          isOwnProfile: true,
          userId: myUserId
        }));

        if (uploadProfilePicture.fulfilled.match(resultAction)) {
          dispatch(fetchProfileData({ myUserId }));
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSuccessMessage(''); // Reset message
    const myUserId = localStorage.getItem('_id');
    try {
      const result = await dispatch(updateProfile({
        bio,
        gender,
        userId: myUserId
      })).unwrap();

      if (result) {
        await dispatch(fetchProfileData({ myUserId }));
        setSuccessMessage('Cập nhật thông tin thành công!');

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const { username, fullname, profilePicture } = profileData || {};
  const characterCount = bio ? bio.length : 0;

  // Main content render based on active panel
  const MainContent = () => {
    switch (activePanel) {
      case 'notifications':
        return <NotificationsPanel />;
      case 'privacy':
        return <PrivacyPanel />;
      case 'password':
        return <PasswordPanel
          onPasswordSubmit={handlePasswordData}
          onSuccess={(message) => setSuccessMessage(message)}
          isInModal={false}
          successMessage={passwordPanelMessage}
          errorMessage={passwordError}
          onError={(error) => setPasswordError(error)}
        />
      case 'profile':
        return (
          <div className="flex justify-center min-h-full">
            <div className="w-full max-w-2xl  px-8 py-8">
              <h3 className="mb-12 text-xl font-bold">Chỉnh sửa trang cá nhân</h3>

              <div className="flex items-center mb-8 background-user">
                <img src={profilePicture} alt="Profile" className="w-10 h-10 rounded-full mr-4" />
                <div>
                  <h2 className="font-semibold">{username}</h2>
                  <p className="text-sm text-gray-400">{fullname}</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                  className="input-edit"
                />
                <button
                  className="ml-auto bg-blue-500 px-4 py-1 rounded-lg"
                  onClick={handleImageClick}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Đang tải...' : 'Đổi ảnh'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3">Trang web</h3>
                  <input
                    defaultChecked={true}
                    type="text"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 input-edit"
                    placeholder="Trang web"
                    disabled
                  />
                  <p className="text-sm text-gray-400 mb-3 mt-3">
                    Bạn chỉ có thể chỉnh sửa liên kết trên di động. Hãy mở ứng dụng Instagram và chỉnh sửa trang cá nhân của bạn để thay đổi trang web trong phần tiểu sử.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3">Tiểu sử</h3>
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 h-24 textarea-edit"
                    placeholder="Tiểu sử"
                    value={bio}
                    onChange={handleChange}
                    maxLength={150}
                  />
                  <div className="text-right text-sm text-gray-400">{characterCount} / 150</div>
                </div>

                <div>
                  <h3 className="mb-3">Giới tính</h3>
                  <select
                    className="w-full rounded-lg p-3"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-3">
                    Thông tin này sẽ không xuất hiện trên trang cá nhân công khai của bạn.
                  </p>
                </div>

                <div>
                  <h3 className="mb-3">Hiển thị gợi ý tài khoản trên trang cá nhân</h3>
                  <div className="flex items-center justify-between rounded-lg p-4 axc">
                    <p className="text-sm text-gray-400">
                      Chọn có cho mọi người thấy các gợi ý tài khoản tương tự trên trang cá nhân của bạn và có cho hệ thống gợi ý tài khoản của bạn trên các trang cá nhân khác hay không.
                    </p>
                    <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </div>
                  </div>
                </div>

                <button
                  className="flex items-center justify-center ml-auto bg-blue-500 px-4 py-1 rounded-lg"
                  style={{ width: '200px', height: '50px' }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || avatarUploading}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>
            </div>
          </div>

        );
      default:
        return null;
    }
  };
  const renderOTPModal = () => {
    if (!showOTPModal || activePanel !== 'password') return null;

    return (
      <AlertDialog
        open={showOTPModal}
        onOpenChange={() => {
          dispatch(setShowOTPModal(false))
          setOtpError('');
        }}
      >
        <AlertDialogContent className="modal-otp">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">
              Xác thực OTP
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-4">
            <p className="text-gray-300 mb-4 text-center">
              Vui lòng nhập mã OTP được gửi đến email của bạn
            </p>

            <div
              className="flex justify-center input-containerOTP"
              onPaste={(e) => handlePaste(e)}
            >
              {otpData.otp.map((data, index) => (
                <input
                  key={index}
                  name={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  className="w-12 h-12 text-center bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 input-OTP"
                  value={data}
                  onKeyDown={(e) => handleBackspace(e, index)}
                  onChange={(e) => handleOTPChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  autoFocus={index === 0}
                />
              ))}
            </div>


            {error && (
              <p className="text-red-500 mt-4 text-center">{error}</p>
            )}
            {otpError && (
              <p className="text-red-500 mt-4 text-center">{otpError}</p>
            )}
            {successMessage && (
              <p className="text-green-500 mt-4 text-center">{successMessage}</p>
            )}

            <div className="flex justify-end  mt-6">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => {
                  dispatch(setShowOTPModal(false));
                  setOtpError('');
                }}
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
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <div className="flex h-screen w-full text-white container-edit rounded-lg">
      {/* Left Sidebar */}
      <div className="w-80 min-w-80 overflow-y-auto left-sidebar">
        <div className="p-4">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6 header-eidt">
              <h2 className="text-xl font-bold">Cài đặt</h2>
              <a onClick={handleLogoClick} href="/" className="flex items-center">
                <img className="w-12 h-12 rounded-full object-cover logo-setting" src={Logo} alt="Logo" />
              </a>
            </div>
            <div className='flex justify-center items-center image-admin'>
              <img className="w-30 h-30 object-cover" src={profilePicture} alt="admin" />
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-4">
              <button
                onClick={() => handleNavigationWithModal('/account/setting', 'profile')}
                className={`flex items-center w-full p-3 rounded-lg ${activePanel === 'profile' ? 'bg-[#3a3344]' : 'hover:bg-[#3a3344]'
                  }`}
              >
                <User className="w-5 h-5 mr-3" />
                <span>Chỉnh sửa trang cá nhân</span>
              </button>

              <button
                onClick={() => {
                  handleNavigation('/account/notification', 'notifications');
                  dispatch(setShowOTPModal(false));
                }}
                className={`flex items-center w-full p-3 rounded-lg ${activePanel === 'notifications' ? 'bg-[#3a3344]' : 'hover:bg-[#3a3344]'
                  }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                <span>Thông báo</span>
              </button>

              <button
                onClick={() => {
                  handleNavigation('/account/privacy', 'privacy');
                  dispatch(setShowOTPModal(false));
                }}
                className={`flex items-center w-full p-3 rounded-lg ${activePanel === 'privacy' ? 'bg-[#3a3344]' : 'hover:bg-[#3a3344]'
                  }`}
              >
                <Lock className="w-5 h-5 mr-3" />
                <span>Quyền riêng tư của tài khoản</span>
              </button>

              <button
                onClick={() => handleNavigation('/account/changepassword', 'password')}
                className={`flex items-center w-full p-3 rounded-lg ${activePanel === 'password' ? 'bg-[#3a3344]' : 'hover:bg-[#3a3344]'
                  }`}
              >
                <KeyRound className="w-5 h-5 mr-3" />
                <span>Mật khẩu và bảo mật</span>
              </button>

              <button className="flex items-center w-full p-3 rounded-lg hover:bg-[#3a3344]">
                <UserPlus className="w-5 h-5 mr-3" />
                <span>Bạn thân</span>
              </button>

              <button className="flex items-center w-full p-3 rounded-lg hover:bg-[#3a3344]">
                <XCircle className="w-5 h-5 mr-3" />
                <span>Đã chặn</span>
              </button>

              <button className="flex items-center w-full p-3 rounded-lg hover:bg-[#3a3344]">
                <Video className="w-5 h-5 mr-3" />
                <span>Ẩn tin và video trực tiếp</span>
              </button>

              <button className="flex items-center w-full p-3 rounded-lg hover:bg-[#3a3344]">
                <Settings className="w-5 h-5 mr-3" />
                <span className="text-sm">Tùy chọn quảng cáo</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MainContent />
      </div>
      {renderOTPModal()}
    </div>
  );
}
