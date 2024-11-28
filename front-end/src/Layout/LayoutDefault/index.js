import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';
import { GoHome, GoHomeFill } from "react-icons/go";
import { LuSearch } from "react-icons/lu";
import { SlCompass } from "react-icons/sl";
import { RiMessengerFill } from "react-icons/ri";
import { PiMessengerLogo } from "react-icons/pi";
import { MdOutlineSlowMotionVideo } from "react-icons/md";
import { FaSquarePlus } from "react-icons/fa6";
import { FiPlusSquare } from "react-icons/fi";
import { BsCompassFill } from "react-icons/bs";
import { MdSlowMotionVideo } from "react-icons/md";
import { CgMenuGridR, CgLogOut } from "react-icons/cg";
import { TfiLayoutGrid3Alt } from "react-icons/tfi";
import { IoSearch } from "react-icons/io5";
import { GoHeartFill } from "react-icons/go";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import './LayoutDefault.scss';
import Footer from '../../Components/Footer';
import UploadModal from './../../Components/UploadModal/index';
import Logo from "../../assets/images/logo192.png";
import { fetchProfileData, uploadProfilePicture } from '../../store/features/profile/profileSlice';
import { GoHeart } from "react-icons/go";
import { useDispatch, useSelector } from 'react-redux';
import Navigation from '../../Components/Responsive/Navigation/index';
import Header from '../../Components/Responsive/Header/index';
import config from './../../config';
const { Sider, Content } = Layout;

export default function LayoutDefault() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const loadingBarRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profileData } = useSelector((state) => state.profile);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // đóng siderbar khi chuyển
  useEffect(() => {
    const collapsedPaths = ["/messenger", "/account/setting", "/account/changepassword", "/account/privacy", "/account/notification", "/error404"];
    if (collapsedPaths.includes(location.pathname)) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [location.pathname]);

  // Thêm useEffect để theo dõi thay đổi của profileData
  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username);
      setFullname(profileData.fullname);
    }
  }, [profileData]);

  // Fetch profile data khi component mount
  useEffect(() => {
    const myUserId = localStorage.getItem('_id');
    if (myUserId) {
      dispatch(fetchProfileData({ myUserId }));
    }
  }, [dispatch]);

  // Theo dõi thay đổi của location để fetch lại data nếu cần
  useEffect(() => {
    const myUserId = localStorage.getItem('_id');
    if (myUserId) {
      dispatch(fetchProfileData({ myUserId }));
    }
  }, [location.pathname, dispatch]);

  const profilePicture = profileData?.profilePicture;

  // Hàm tiện ích để điều khiển LoadingBar
  const startLoading = () => {
    setIsLoading(true);
    if (loadingBarRef.current) {
      loadingBarRef.current.continuousStart();
    }
  };

  const stopLoading = () => {
    setIsLoading(false);
    if (loadingBarRef.current) {
      loadingBarRef.current.complete();
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      startLoading();
      const id = localStorage.getItem('_id');
      if (!id) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`${config.API_HOST}/api/user/${id}/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Could not fetch profile data.');
      }

      const data = await response.json();
      if (data.success) {
        setUsername(data.user.username);
        setFullname(data.user.fullname);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      stopLoading();
    }
  }, []);


  useEffect(() => {
    const savedKey = localStorage.getItem('selectedMenuKey');
    if (savedKey) {
      setSelectedKey(savedKey);
    }

    fetchUserData();

    const handleProfilePictureUpdate = () => {
      setTimeout(() => {
        fetchUserData();
      }, 500);
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    const pathToKeyMap = {
      '/': '1',
      '/search': '2',
      '/discover': '3',
      '/reel': '4',
      '/messenger': '5',
      '/notification': '6',
      '/see_more': '10'
    };
    const key = pathToKeyMap[location.pathname];
    if (key) {
      setSelectedKey(key);
      localStorage.setItem('selectedMenuKey', key);
    }

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, [location.pathname, fetchUserData]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    localStorage.setItem('selectedMenuKey', key);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/logout`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        localStorage.removeItem('selectedMenuKey');
        navigate('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Đăng xuất thất bại');
      }
    } catch (error) {
      alert('Lỗi khi đăng xuất: ' + error.message);
    }
  };

  // đây là của LayoutDefault
  const handleProfileClick = () => {
    const userId = localStorage.getItem('_id');
    if (userId) {
      setSelectedKey('8');
      localStorage.setItem('selectedMenuKey', '8');
      navigate(`/profile/${userId}`, { replace: true });
      setRefreshKey(prevKey => prevKey + 1);
    } else {
      console.error('User ID not found in localStorage');
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setSelectedKey('1');
    localStorage.setItem('selectedMenuKey', '1');
    navigate('/');
  };

  useEffect(() => {
    const handleResize = () => {
      // Automatically collapse below 1140px
      if (window.innerWidth < 1140) {
        setCollapsed(true);
      } else {
        setCollapsed(false); // Reset when the screen is large again
      }

      // Detect when the screen is small (< 775px)
      setIsSmallScreen(window.innerWidth <= 775);
    };

    // Run on initial render and on resize
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    startLoading();
    const myUserId = localStorage.getItem('_id');
    if (myUserId) {
      dispatch(fetchProfileData({ myUserId })).then(() => {
        stopLoading();

        if (profileData) {
          dispatch(uploadProfilePicture(profileData.profilePicture));
        }
      });
    }
  }, [dispatch, profileData]);

  const ActiveIcons = {
    home: collapsed ? <GoHomeFill className="icon-custom active" /> : <GoHomeFill className="icon-custom active" />,
    search: <IoSearch className="icon-custom active" />,
    compass: <BsCompassFill className="icon-custom active" />,
    reel: <MdSlowMotionVideo className="icon-custom active" />,
    messenger: <RiMessengerFill className="icon-custom active" />,
    heart: <GoHeartFill className="icon-custom active" />,
    plus: <FaSquarePlus className="icon-custom active" />,
    menu: <TfiLayoutGrid3Alt className="icon-custom active" />,
  };
  const menuItems = useMemo(() => [
    {
      key: '1',
      icon: selectedKey === '1' ? ActiveIcons.home : <GoHome className="icon-custom" />,
      label: <Link to="/">Trang chủ</Link>
    },
    {
      key: '2',
      icon: selectedKey === '2' ? ActiveIcons.search : <LuSearch className="icon-custom" />,
      label: <Link>Tìm kiếm</Link>
    },
    {
      key: '3',
      icon: selectedKey === '3' ? ActiveIcons.compass : <SlCompass className="icon-custom" />,
      label: <Link to="/discover">Khám phá</Link>
    },
    {
      key: '4',
      icon: selectedKey === '4' ? ActiveIcons.reel : <MdOutlineSlowMotionVideo className="icon-custom" />,
      label: <Link to="/reel">Reels</Link>
    },
    {
      key: '5',
      icon: selectedKey === '5' ? ActiveIcons.messenger : <PiMessengerLogo className="icon-custom" />,
      label: <Link to="/messenger">Tin nhắn</Link>
    },
    {
      key: '6',
      icon: selectedKey === '6' ? ActiveIcons.heart : <GoHeart className="icon-custom" />,
      label: <Link >Thông báo</Link>
    },
    {
      key: '7',
      icon: selectedKey === '7' ? ActiveIcons.plus : <FiPlusSquare className="icon-custom" />,
      label: <span>Tạo</span>,
      onClick: () => setIsModalOpen(true)
    },
    {
      key: '8',
      icon: profileData?.profilePicture ? (
        <img
          key={profileData.profilePicture}
          src={profileData.profilePicture}
          alt="Profile"
          className="icon-custom"
          onError={(e) => {
            e.target.src = Logo;
          }}
        />
      ) : <div className="icon-custom profile-placeholder" />,
      label: 'Trang cá nhân',
      onClick: handleProfileClick,
    },
    {
      key: '10',
      icon: selectedKey === '10' ? ActiveIcons.menu : <CgMenuGridR className="icon-custom" />,
      label: <Link to="/see_more">Xem thêm</Link>
    },
    {
      key: '11',
      icon: selectedKey === '11' ? ActiveIcons.logout : <CgLogOut className="icon-custom" />,
      label: 'Đăng xuất',
      onClick: handleLogout
    },
  ], [selectedKey, handleLogout, handleProfileClick, profileData]);

  return (
    <Layout className="LayoutDefault">
      <LoadingBar
        color="#ff0096"
        ref={loadingBarRef}
        shadow={true}
        className="loading-bar"
        height={2}
      />
      {isLoading && <div className="loading-spinner"></div>}
      <Sider
        key={profileData?.profilePicture}
        className="LayoutDefault__sider"
        collapsible={isSmallScreen}
        collapsed={isSmallScreen || collapsed}
        // onCollapse={setCollapsed}
        onCollapse={setCollapsed}
        trigger={isSmallScreen ? null : undefined}
        width={240}
        collapsedWidth={80}
        theme="dark"
      >
        <div className="logo">
          <a href="/" onClick={handleLogoClick}>
            <img src={Logo} alt="Logo Icon" className="logo-icon" />
            <span className="logo-text">Logo</span>
          </a>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          theme="dark"
          items={menuItems}
          className="Menu"
        />
        <div className="collapse-trigger" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </Sider>
      <Layout className="LayoutDefault__center">
        <Content className="LayoutDefault__main">
          <Outlet key={refreshKey} />

          <Header />
          <Navigation />
        </Content>
        <Footer className="LayoutDefault__footer" />
      </Layout>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        profilePicture={profilePicture}
        username={username}
        fullname={fullname}
        isProfilePicture={true}
      />
    </Layout>
  );
}