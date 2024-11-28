import React, { useState, useEffect, useRef } from "react";
import "./Navigation.scss";
import { GoHome, GoHomeFill } from "react-icons/go";
import { IoSearch } from "react-icons/io5";
import { FiPlusSquare } from "react-icons/fi";
import { RiMessengerFill } from "react-icons/ri";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "../../../assets/images/logo192.png";

const Navigation = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { profileData } = useSelector((state) => state.profile);
  const profilePicture = profileData?.profilePicture || Logo;

  const pathToIndex = {
    "/": 0,
    "/search": 1,
    "/create": 2,
    "/messenger": 3,
  };

  // Add dynamic profile handling
  useEffect(() => {
    const index = pathToIndex[location.pathname] || (location.pathname.startsWith("/profile") ? 4 : 0);
    setActiveIndex(index);
  }, [location.pathname]);

  useEffect(() => {
    const updateIndicatorPosition = () => {
      const nav = navRef.current;
      if (nav) {
        const activeLi = nav.querySelectorAll("li")[activeIndex];
        if (activeLi) {
          const { offsetLeft, offsetWidth } = activeLi;
          setIndicatorStyle({
            left: `${offsetLeft + offsetWidth / 2 - 30}px`,
          });
        }
      }
    };

    updateIndicatorPosition();
    window.addEventListener("resize", updateIndicatorPosition);
    return () => window.removeEventListener("resize", updateIndicatorPosition);
  }, [activeIndex]);

  const navigationItems = [
    {
      path: "/",
      icon: activeIndex === 0 ? <GoHomeFill className="icon active" /> : <GoHome className="icon" />,
    },
    {
      path: null, // No routing
      icon: <IoSearch className={activeIndex === 1 ? "icon active" : "icon"} />,
      onClick: () => setActiveIndex(1),
    },
    {
      path: null, // No routing
      icon: <FiPlusSquare className={activeIndex === 2 ? "icon active" : "icon"} />,
      onClick: () => setActiveIndex(2),
    },
    {
      path: "/messenger",
      icon: <RiMessengerFill className={activeIndex === 3 ? "icon active" : "icon"} />,
    },
    {
      path: "/profile",
      icon: (
        <img
          src={profilePicture}
          alt="Profile"
          className={`profile-icon ${activeIndex === 4 ? "active" : ""}`}
          onError={(e) => {
            e.target.src = Logo;
          }}
        />
      ),
    },
  ];

  return (
    <div className="navigation">
      <ul ref={navRef}>
        {navigationItems.map((item, index) => (
          <li
            key={index}
            className={activeIndex === index ? "active" : ""}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              } else if (item.onClick) {
                item.onClick();
              }
              setActiveIndex(index); // Ensure activeIndex is always updated
            }}
          >
            <Link to={item.path || "#"}>
              <span>{item.icon}</span>
            </Link>
          </li>
        ))}
        <div className="indicators" style={indicatorStyle}>
          <span></span>
        </div>
      </ul>
    </div>
  );
};

export default Navigation;
