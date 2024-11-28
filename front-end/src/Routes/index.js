import ProtectedRoute from './../Layout/LayoutAuth/ProtectedRoute/index';
import Home from './../Layout/Page/Home/index';
import LayoutDefault from './../Layout/LayoutDefault/index';
import Error from './../Layout/Page/Error/index';
import Discover from './../Layout/Page/Discover/index';
import Reel from './../Layout/Page/Reels/index';
import Messenger from './../Layout/Page/Messenger/index';
// import Notification from './../Layout/Page/Notification/index';
import Profile from './../Layout/Page/Profile/index';
import SeeMore from './../Layout/Page/See_More/index';
import ProfilePost from '../Layout/Page/Profile/AllPostProfile/ProfilePost';
import Error404 from './../Layout/Page/Error404/index';
import ProfileEdit from './../Layout/Page/Profile/ProfileEdit/index';
import PasswordPanel from './../Layout/Page/Profile/ProfileEdit/PasswordPanel/PasswordPanel';
import PrivacyPanel from './../Layout/Page/Profile/ProfileEdit/PrivacyPanel/PrivacyPanel';
import LoginRegister from '../Layout/LayoutAuth/Login-Register';
import NotificationsPanel from './../Layout/Page/Profile/ProfileEdit/NotificationsPanel/NotificationsPanel';
import Call from './../Layout/Page/Call/index';

const protectedRoutes = [
  { path: "/", element: <Home /> },
  { path: "/home", element: <Home /> },
  { path: "/discover", element: <Discover /> },
  { path: "/reel", element: <Reel /> },
  { path: "/messenger", element: <Messenger /> },
  // { path: "/notification", element: <Notification /> },
  {
    path: "/profile",
    element: <Profile />,
    children: [
      { path: ":userId", element: <Profile /> },
      { path: ":userId/post/:postId", element: <ProfilePost /> },
    ],
  },
  {
    path: "/account",
    element: <ProfileEdit />,
    children: [
      { path: "/account/setting", element: <ProfileEdit /> },
      { path: "/account/notification", element: <NotificationsPanel /> },
      { path: "/account/changepassword", element: <PasswordPanel /> },
      { path: "/account/privacy", element: <PrivacyPanel /> },
    ],
  },
  // { path: "/account/setting", element: <ProfileEdit /> },
  { path: "/see_more", element: <SeeMore /> },
  { path: "/error404", element: <Error404 /> },
  {
    path: "*",
    element: <Error />,
  },
];

export const routes = [
  {
    path: "/",
    element: <LayoutDefault />,
    children: protectedRoutes.map(route => {
      const { children, ...rest } = route;
      return {
        ...rest,
        element: <ProtectedRoute>{rest.element}</ProtectedRoute>,
        children: children?.map(child => ({
          ...child,
          element: <ProtectedRoute>{child.element}</ProtectedRoute>,
        })),
      };
    }),
  },
  { path: "/call", element: <Call /> },
  {
    path: "login",
    element: <LoginRegister />
  },
  {
    path: "register",
    element: <LoginRegister />
  },

];
