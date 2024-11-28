import Settings from '../../../../assets/images/setting.png';
import ProfileNote from './../Note/ProfileNote/index';
import { useNavigate } from 'react-router-dom';

const UserProfile = ({
  profileData,
  isOwnProfile,
  isFollowing,
  userIdFollowing,
  followStats,
  handleProfilePictureClick,
  handleFollowUnfollow,
  handleFollowerModalOpen,
  handleFollowingModalOpen,
  handleNoteClick,
  featuredNote,
}) => {

  const navigate = useNavigate();

  if (!profileData) return null;

  // Hàm điều hướng khi người dùng nhấn nút "Chỉnh sửa trang cá nhân"
  const handleGoToSettings = () => {
    navigate('/account/setting');
  };

  return (
    <div className="profile__header">
      <div className="profile__pictureUser">
        <div className="profile__uploadImageUser">
          <img
            src={profileData.profilePicture}
            alt="Profile"
            onClick={handleProfilePictureClick}
          />
        </div>
        <ProfileNote
          isOwnProfile={isOwnProfile}
          featuredNote={featuredNote}
          onEditClick={handleNoteClick}
          profileData={profileData}
        />
        <h2 className="profile__fullnameResponsive">{profileData.fullname}</h2>
      </div>
      <div className="profile__info">
        <div className="profile__infoTop">
          <h2 className="profile__idUser">{profileData.username}</h2>
          <div className="profile__actions">
            {!isOwnProfile && (
              <button
                className={`follow-button ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowUnfollow}
              >
                {isFollowing ? 'Đang theo dõi' :
                  userIdFollowing?.includes(localStorage.getItem('_id')) ? 'Theo dõi lại' : 'Theo dõi'}
              </button>
            )}
            {isOwnProfile && (
              <>
                {/* Sử dụng nút bấm để điều hướng */}
                <button onClick={handleGoToSettings}>Chỉnh sửa trang cá nhân</button>
                <button>Xem kho lưu trữ</button>
              </>
            )}
          </div>
          {isOwnProfile &&
            <div className="profile__setting">
              <img src={Settings} alt="Settings" />
            </div>
          }
        </div>
        <div className="profile__bottom">
          <span>{profileData?.posts?.length || 0} bài viết</span>
          <span
            className="clickable"
            onClick={() => handleFollowerModalOpen('followers')}
          >
            {followStats.followers.length} người theo dõi
          </span>
          <span
            className="clickable"
            onClick={() => handleFollowingModalOpen('following')}
          >
            Đang theo dõi {followStats.following.length} người dùng
          </span>
        </div>
        <div className="profile__nameUser">{profileData.fullname}</div>
        <div className="profile__bio">{profileData.bio}</div>
      </div>
    </div>
  );
};

export default UserProfile;
