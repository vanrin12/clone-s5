import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Profile.scss';
import './Note.scss';
import './Note/PreviewNote/PreviewNote.scss';
import { IoCameraOutline, IoAppsOutline, IoPersonCircleOutline, IoStar } from "react-icons/io5";
import NoteModal from './Note/NoteModal';
import ProfilePost from './AllPostProfile/ProfilePost';
import PreviewNote from './Note/PreviewNote/index';
import UploadModal from '../../../Components/UploadModal';
import FollowingModal from './watchlistFollowing/index';
import FollowerModal from './watchlistFollower/index';
import AddToNew from './AddToNew/index';
import UserProfile from './UserProfile/index';
import config from './../../../config';

const Profile = () => {
  const { userId, postId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followMessage, setFollowMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowerModal, setShowFollowerModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [followUsers, setFollowUsers] = useState([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [featuredNote, setFeaturedNote] = useState('');
  const [bio, setBio] = useState('');
  const [featuredNoteUpdateMessage, setFeaturedNoteUpdateMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [posts, setPosts] = useState([]);
  const [followStats, setFollowStats] = useState({
    followers: [],
    following: []
  });
  const [userIdFollowing, setUserIdFollowing] = useState('');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const hasFetchedProfile = useRef(false);
  const [myUserId, setMyUserId] = useState(null);
  const [youUserId, setYouUserId] = useState(null);


  const [indicatorStyle, setIndicatorStyle] = useState(null);
  const tabsRef = useRef({});

  // Thêm function để validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  useEffect(() => {
    const postsTab = tabsRef.current.posts;
    if (postsTab) {
      const rect = postsTab.getBoundingClientRect();
      const parentRect = postsTab.parentElement.getBoundingClientRect();
      setIndicatorStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        opacity: 1
      });
    }
  }, []);

  // đây là mã profile component cha
  useEffect(() => {
    const validateAndSetUserId = () => {
      const myUserId = localStorage.getItem('_id');
      const targetUserId = userId || myUserId;

      // Kiểm tra nếu ID không hợp lệ
      if (targetUserId && !isValidObjectId(targetUserId)) {
        navigate('/error404', { replace: true });
        return false;
      }

      setMyUserId(myUserId);
      setYouUserId(targetUserId);
      setIsOwnProfile(targetUserId === myUserId);
      return true;
    };

    validateAndSetUserId();
  }, [userId, navigate]);

  //  useEffect fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const myUserId = localStorage.getItem('_id');
        const youUserId = userId || myUserId;

        // Kiểm tra ID hợp lệ trước khi fetch
        if (!isValidObjectId(youUserId)) {
          throw new Error('Invalid User ID');
        }

        if (!youUserId) {
          throw new Error('User ID not found');
        }

        // Nếu postId không tồn tại trong params URL, điều hướng đến /p/{postId}
        if (!userId && postId) {
          navigate(`/error404`, { replace: true });
          return;
        }

        if (!hasFetchedProfile.current && (userId || youUserId !== myUserId)) {
          const response = await fetch(`${config.API_HOST}/api/user/${youUserId}/profile`, {
            method: 'GET',
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message.includes('không hợp lệ')) {
              navigate('/error404', { replace: true });
              return;
            }
            throw new Error('Could not fetch profile data.');
          }

          const data = await response.json();
          // console.log(data);
          if (data.success) {
            setProfileData(data.user);
            setFollowStats({
              followers: data.user.followers || [],
              following: data.user.following || []
            });
            setPosts(data.user.posts || []);
            setFeaturedNote(data.user.featuredNote?.content || data.user.featuredNote || '');

            setBio(data.user.bio || '');

            const isCurrentlyFollowing = data.user.followers.includes(myUserId);
            setIsFollowing(isCurrentlyFollowing);
            setUserIdFollowing(data.user.following);
            hasFetchedProfile.current = true;
          } else {
            setError(data.message || 'Failed to fetch profile data.');
            navigate('/error', { replace: true });
          }
        }
      } catch (error) {
        setError(error.message);
        if (postId) {
          navigate(`/error404`, { replace: true });
          return;
        }
        navigate('/error404', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    if ((userId || myUserId)) {
      fetchProfile();
    }
  }, [userId, postId, navigate, myUserId]);

  // Giữ nguyên useEffect kiểm tra URL `/profile`
  useEffect(() => {
    const currentPath = window.location.pathname;
    const myUserId = localStorage.getItem('_id');

    if (!isValidObjectId(myUserId)) {
      navigate('/error404', { replace: true });
      return;
    }

    if (currentPath === '/profile' || currentPath === '/profile/') {
      // Nếu đang xem profile của chính mình thì giữ nguyên
      if (userId !== myUserId) {
        navigate(`/profile/${myUserId}`, { replace: true });
      }
      // Nếu đang ở profile của người khác và profile đó là của youUserId, điều hướng đến nó
      if (userId === youUserId) {
        navigate(`/profile/${youUserId}`, { replace: true });
      }
    }
  }, [navigate, userId, youUserId]);

  // Cập nhật useEffect giữ nguyên URL khi ở trang profile và không có postId
  useEffect(() => {
    const myUserId = localStorage.getItem('_id');

    if (!isValidObjectId(myUserId)) {
      navigate('/error404', { replace: true });
      return;
    }

    // Nếu đang ở profile của chính mình và không có postId, không cần điều hướng lại
    if (profileData && !postId && userId === profileData._id && isOwnProfile) {
      if (userId !== myUserId) {
        navigate(`/profile/${myUserId}`, { replace: true });
      } else if (userId === youUserId) {
        navigate(`/profile/${youUserId}`, { replace: true });
      }
    }
  }, [profileData, userId, postId, isOwnProfile, youUserId, navigate]);

  // Cập nhật useEffect điều hướng về profile
  useEffect(() => {
    if (profileData && !postId && userId === profileData._id && isOwnProfile) {
      if (!isValidObjectId(myUserId)) {
        navigate('/error404', { replace: true });
        return;
      }
      navigate(`/profile/${myUserId}`, { replace: true });
    }
  }, [isOwnProfile, profileData, userId, postId, myUserId, navigate]);

  useEffect(() => {
    if (tabsRef.current[selectedTab]) {
      const activeTab = tabsRef.current[selectedTab];
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        opacity: 1
      });
    }
  }, [selectedTab]);


  useEffect(() => {
    // Đặt indicatorStyle khi component load
    const updateIndicator = (tab) => {
      if (tabsRef.current[tab]) {
        const tabElement = tabsRef.current[tab];
        setIndicatorStyle({
          width: tabElement.offsetWidth,
          left: tabElement.offsetLeft,
        });
      }
    };

    updateIndicator('posts');
  }, []);

  const Loading = () => (
    <div style={{ color: "#fff" }}></div>
  );

  const ErrorMessage = ({ message }) => (
    <div>Error: {message}</div>
  );

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleFollowingModalOpen = async (type) => {
    setModalType(type);
    setShowFollowingModal(true);
  };

  const handleFollowerModalOpen = async (type) => {
    setModalType(type);
    setShowFollowerModal(true);
  };

  const handleFollowToggle = async (targetUserId) => {
    try {
      const response = await fetch(
        `${config.API_HOST}/api/user/followorunfollow/${targetUserId}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to toggle follow status');

      const data = await response.json();
      if (data.success) {
        setFollowUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === targetUserId
              ? { ...user, isFollowing: !user.isFollowing }
              : user
          )
        );

        setProfileData(prev => ({
          ...prev,
          followers: !data.isFollowing
            ? [...prev.followers, targetUserId]
            : prev.followers.filter(id => id !== targetUserId),
        }));
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    if (!isOwnProfile) return;
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setIsAvatarUploading(true);
      setShowModal(false);

      const response = await fetch(`${config.API_HOST}/api/user/profile/edit`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        console.log(data.success)
        setProfileData(prev => ({
          ...prev,
          profilePicture: data.user.profilePicture,
        }));
        window.location.reload();
        const event = new CustomEvent('profilePictureUpdated', {
          detail: data.user.profilePicture
        });
        window.dispatchEvent(event);
      } else {
        setError(data.message || 'Failed to upload profile picture.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/deleteAvatar`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        const profileResponse = await fetch(`${config.API_HOST}/api/user/${userId}/profile`, {
          method: 'GET',
          credentials: 'include',
        });

        const profileData = await profileResponse.json();
        if (profileData.success) {
          setProfileData(prev => ({
            ...prev,
            profilePicture: profileData.user.profilePicture,
          }));
          const event = new CustomEvent('profilePictureUpdated', {
            detail: profileData.user.profilePicture
          });
          window.dispatchEvent(event);
          setShowModal(false);
        }
        window.location.reload();
      } else {
        setError(data.message || 'Failed to remove profile picture.');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFollowUnfollow = async () => {
    if (isOwnProfile) return;

    const targetUserId = userId;
    const currentUserId = localStorage.getItem('_id');
    const previousFollowState = isFollowing;

    try {
      setIsFollowing(prevState => !prevState);

      setFollowStats(prevStats => {
        const newStats = { ...prevStats };
        if (!previousFollowState) {
          newStats.followers = [...new Set([...newStats.followers, currentUserId])];
        } else {
          newStats.followers = newStats.followers.filter(id => id !== currentUserId);
        }
        return newStats;
      });

      const response = await fetch(
        `${config.API_HOST}/api/user/followorunfollow/${targetUserId}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsFollowing(previousFollowState);
        setFollowStats(prevStats => {
          const newStats = { ...prevStats };
          if (!previousFollowState) {
            newStats.followers = newStats.followers.filter(id => id !== currentUserId);
          } else {
            newStats.followers = [...new Set([...newStats.followers, currentUserId])];
          }
          return newStats;
        });
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setProfileData(prev => ({
        ...prev,
        followers: data.isFollowing
          ? [...new Set([...prev.followers, currentUserId])]
          : prev.followers.filter(id => id !== currentUserId)
      }));

      if (data.success) {
        localStorage.setItem(`following_${targetUserId}`, data.isFollowing);
      }

    } catch (error) {
      setFollowMessage('Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  const handleProfilePictureClick = () => {
    if (isOwnProfile) {
      setShowModal(true);
    }
  };

  const handleUpdateFeaturedNote = async (newFeaturedNote) => {
    try {
      setFeaturedNoteUpdateMessage('Đang cập nhật...');

      const noteContent = typeof newFeaturedNote === 'object' ?
        newFeaturedNote.content || '' :
        newFeaturedNote || '';

      const response = await fetch(`${config.API_HOST}/api/user/featuredNote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ featuredNote: noteContent })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.success) {
        setFeaturedNote(noteContent);
        setProfileData(prev => ({
          ...prev,
          featuredNote: noteContent
        }));
        setShowNoteModal(false);
        setFeaturedNoteUpdateMessage('Cập nhật thành công!');
      } else {
        throw new Error(data.message || 'Failed to update featured note');
      }
    } catch (error) {
      console.error('Error updating featured note:', error);
      setFeaturedNoteUpdateMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      alert(error.message);
    }
  };

  const handleNoteClick = () => {
    if (isOwnProfile) {
      if (!featuredNote || featuredNote === '') {
        setShowNoteModal(true);
        setShowPreview(false);
      } else {
        setShowPreview(true);
        setShowNoteModal(false);
      }
    }
  };


  const handleMouseEnter = (tab) => {
    const element = tabsRef.current[tab];
    if (element) {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement.getBoundingClientRect();
      setIndicatorStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        opacity: 1
      });
    }
  };

  const handleMouseLeave = () => {
    const element = tabsRef.current[selectedTab];
    if (element) {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement.getBoundingClientRect();
      setIndicatorStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        opacity: 1
      });
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    const element = tabsRef.current[tab];
    if (element) {
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement.getBoundingClientRect();
      setIndicatorStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        opacity: 1
      });
    }
    if (profileData?._id) {
      navigate(`/profile/${profileData._id}?tab=${tab}`);
    }
  };

  const renderContent = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') || 'posts';

    if (tab === 'posts') {
      if (posts.length === 0) {
        if (isOwnProfile) {
          return (
            <div className="profile__sharePhoto">
              <i><IoCameraOutline /></i>
              <h2>Chia sẻ ảnh</h2>
              <p>Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân của bạn.</p>
              <button onClick={() => setIsUploadModalOpen(true)}>
                Chia sẻ ảnh đầu tiên của bạn
              </button>
            </div>
          );
        } else {
          return (
            <div className="profile__noPosts">
              <i><IoCameraOutline /></i>
              <h2>Chưa có bài viết</h2>
              <p>Khi {profileData?.username} chia sẻ, bạn sẽ thấy ảnh và video của họ tại đây.</p>
            </div>
          );
        }
      }
    }
  };

  if (loading) {
    return <div style={{ color: "#fff" }}></div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="profile">
      <UserProfile
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        userIdFollowing={userIdFollowing}
        followStats={followStats}
        handleProfilePictureClick={handleProfilePictureClick}
        handleFollowUnfollow={handleFollowUnfollow}
        handleFollowerModalOpen={handleFollowerModalOpen}
        handleFollowingModalOpen={handleFollowingModalOpen}
        handleNoteClick={handleNoteClick}
        featuredNote={featuredNote}
        isAvatarUploading={isAvatarUploading}
      />
      {isOwnProfile && (
        <div className="profile__new">
          <div className="profile__upload-new">
            <AddToNew />
          </div>
        </div>
      )}
      <div
        className="profile__tabs"
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={el => {
            tabsRef.current.posts = el;
            if (el && !indicatorStyle) {
              const rect = el.getBoundingClientRect();
              const parentRect = el.parentElement.getBoundingClientRect();
              setIndicatorStyle({
                left: `${rect.left - parentRect.left}px`,
                width: `${rect.width}px`,
                opacity: 1
              });
            }
          }}
          className={selectedTab === 'posts' ? 'active' : ''}
          onClick={() => handleTabChange('posts')}
          onMouseEnter={() => handleMouseEnter('posts')}
        >
          <i><IoAppsOutline /></i> Bài viết
        </button>
        {isOwnProfile && (
          <button
            ref={el => tabsRef.current.saved = el}
            className={selectedTab === 'saved' ? 'active' : ''}
            onClick={() => handleTabChange('saved')}
            onMouseEnter={() => handleMouseEnter('saved')}
          >
            <i><IoStar /></i> Đã lưu
          </button>
        )}

        <button
          ref={el => tabsRef.current.tagged = el}
          className={selectedTab === 'tagged' ? 'active' : ''}
          onClick={() => handleTabChange('tagged')}
          onMouseEnter={() => handleMouseEnter('tagged')}
        >
          <i><IoPersonCircleOutline /></i> Được gắn thẻ
        </button>

        <div
          className="indicator"
          style={indicatorStyle || {}}
        />
      </div>
      {renderContent()}
      {selectedTab === 'posts' && <ProfilePost
        profilePicture={profileData.profilePicture}
        username={profileData.username}
        fullname={profileData.fullname}
        posts={posts}
        myUserId={myUserId}
        youUserId={youUserId}
        userId={userId}
        isOwnProfiles={myUserId === profileData?._id}
      />}
      {selectedTab === 'saved' && <div>bài viết lưu</div>}
      {selectedTab === 'tagged' && <div>gắn thẻ</div>}

      {isAvatarUploading && <Loading />}

      {showModal && !isAvatarUploading && (
        <div className="profile__modal">
          <div className="profile__modal-content">
            <h2>Thay đổi ảnh đại diện</h2>
            <button onClick={() => document.getElementById('fileInput').click()}>
              Tải ảnh lên
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button onClick={handleRemoveProfilePicture}>Gỡ ảnh hiện tại</button>
            <button onClick={handleCloseModal}>Hủy</button>
          </div>
        </div>
      )}
      {showFollowingModal && (
        <FollowingModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          users={followUsers}
          currentUserId={localStorage.getItem('_id')}
          onFollowToggle={handleFollowToggle}
          userIdFollowing={userIdFollowing}
          targetUserId={userId}
        />
      )}

      {showFollowerModal && (
        <FollowerModal
          isOpen={showFollowerModal}
          onClose={() => setShowFollowerModal(false)}
          users={followUsers}
          myUserId={myUserId}
          youUserId={youUserId}
          onFollowToggle={handleFollowToggle}
          userIdFollowing={userIdFollowing}
          setFollowStats={setFollowStats}
        // targetUserId={userId}
        />
      )}

      {showPreview && (
        <PreviewNote
          note={featuredNote}
          onEdit={() => {
            setShowPreview(false);
            setShowNoteModal(true);
          }}
          onDelete={async () => {
            try {
              await fetch(`${config.API_HOST}/api/user/featuredNote`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include'
                // Không cần body vì dùng DELETE
              });
              setFeaturedNote("");
              setShowPreview(false);
            } catch (error) {
              console.error('Error deleting featured note:', error);
            }
          }}
          profileData={profileData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showNoteModal && (
        <NoteModal
          isOpen={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
          }}
          currentNote={featuredNote}
          onSave={(newFeaturedNote) => {
            handleUpdateFeaturedNote(newFeaturedNote);
            setShowNoteModal(false);
            if (newFeaturedNote) {
              setShowPreview(true);
            }
          }}
          profileData={profileData}
        />
      )}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          window.location.reload();
        }}
        profilePicture={profileData?.profilePicture}
        username={profileData?.username}
        fullname={profileData?.fullname}
      />
    </div>
  );
};

export default Profile;