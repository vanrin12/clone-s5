import { useCallback, useEffect, useState } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import "../../../../assets/style/ModalFollow.scss";
import UnfollowConfirmDialog from './../UnfollowConfirmDialog/index';
import { useNavigate } from "react-router-dom";
import config from './../../../../config';

const FollowerModal = ({
  isOpen,
  onClose,
  myUserId, // Changed from currentUserId
  youUserId, // Changed from targetUserId
  onFollowToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [followStates, setFollowStates] = useState({});
  const [mutualFollows, setMutualFollows] = useState({});
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const navigate = useNavigate();

  const isViewingOwnProfile = myUserId === youUserId;

  // Fetch followers list
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/followers/${youUserId || myUserId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Could not fetch followers.');

      const data = await response.json();
      if (data.success) {
        const myFollowingResponse = await fetch(`${config.API_HOST}/api/user/following/${myUserId}`, {
          method: 'GET',
          credentials: 'include',
        });

        const myFollowingData = await myFollowingResponse.json();
        const myFollowingIds = myFollowingData.success
          ? myFollowingData.following.map(user => user._id)
          : [];

        const mutualFollowStates = {};
        for (const user of data.followers) {
          const userFollowingResponse = await fetch(`${config.API_HOST}/api/user/following/${user._id}`, {
            method: 'GET',
            credentials: 'include',
          });
          const userFollowingData = await userFollowingResponse.json();
          const userFollowingIds = userFollowingData.success
            ? userFollowingData.following.map(followedUser => followedUser._id)
            : [];

          mutualFollowStates[user._id] = userFollowingIds.includes(myUserId);
        }
        setMutualFollows(mutualFollowStates);

        const enhancedUsers = data.followers.map(user => ({
          ...user,
          isFollowing: myFollowingIds.includes(user._id),
        }));
        setUsers(enhancedUsers);

        const initialStates = {};
        enhancedUsers.forEach(user => {
          initialStates[user._id] = { isFollowing: user.isFollowing };
        });
        setFollowStates(initialStates);
      }
    } catch (error) {
      console.error(error.message);
    }
  }, [myUserId, youUserId]);

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen, fetchUsers]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const handleConfirmUnfollow = async () => {
    setIsUnfollowing(true);
    try {
      const response = await fetch(`${config.API_HOST}/api/user/follower/${selectedUserId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUserId));
        setFilteredUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUserId));

        setFollowStates(prev => ({
          ...prev,
          [selectedUserId]: { isFollowing: false }
        }));

        setMutualFollows(prev => ({
          ...prev,
          [selectedUserId]: false
        }));

        setShowUnfollowModal(false);
        setSelectedUserId(null);

        await fetchUsers();
      }
    } catch (error) {
      console.error('Lỗi khi hủy theo dõi:', error);
    } finally {
      setIsUnfollowing(false);
    }
  };

  const handleFollowToggle = async (userId) => {
    if (isUnfollowing) return;
    try {
      await onFollowToggle(userId);
      setFollowStates(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          isFollowing: !prev[userId].isFollowing
        }
      }));
      await fetchUsers();
      window.location.reload();
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  const handleUnfollowClick = (userId) => {
    setSelectedUserId(userId);
    setShowUnfollowModal(true);
  };

  const getButtonText = (userId) => {
    if (isViewingOwnProfile) {
      return followStates[userId]?.isFollowing ? 'Đang theo dõi' : 'Theo dõi';
    }
    return followStates[userId]?.isFollowing ? 'Đang theo dõi' : 'Theo dõi lại';
  };

  const shouldShowButton = (userId) => {
    if (userId === myUserId) return false;
    if (!followStates[userId]?.isFollowing) return true;
    if (followStates[userId]?.isFollowing && mutualFollows[userId]) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="follow-modal">
      <div className="follow-modal__content">
        <div className="follow-modal__header">
          <h2>Người theo dõi</h2>
          <button className="follow-modal__close" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="follow-modal__search">
          <IoSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="follow-modal__list">
          {filteredUsers.map(user => (
            <div
              key={user._id}
              className="follow-modal__user"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                // Ngăn việc điều hướng nếu click vào nút follow/unfollow
                if (e.target.closest('.follow-modal__follow-button') ||
                  e.target.closest('.checkButton')) {
                  return;
                }
                navigate(`/profile/${user._id}`);
                onClose();
                // Thêm reload để đảm bảo profile được load lại
                window.location.reload();
              }}
            >
              <div className="follow-modal__user-info">
                <img src={user.profilePicture} alt={user.username} />
                <div className="follow-modal__user-details">
                  <div className="username-container">
                    <span className="username">{user.username}</span>
                    {shouldShowButton(user._id) && (
                      <div
                        className="checkButton"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(user._id);
                        }}
                      >
                        {isViewingOwnProfile
                          ? followStates[user._id]?.isFollowing
                            ? 'Đang theo dõi'
                            : 'Theo dõi lại'
                          : getButtonText(user._id)
                        }
                      </div>
                    )}
                  </div>
                  <span className="fullname">{user.fullname}</span>
                </div>
              </div>
              {isViewingOwnProfile ? (
                <button
                  className="follow-modal__follow-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfollowClick(user._id);
                  }}
                >
                  Huỷ
                </button>
              ) : (
                shouldShowButton(user._id) && (
                  <button
                    className="follow-modal__follow-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(user._id);
                    }}
                  >
                    {getButtonText(user._id)}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
      {showUnfollowModal && (
        <UnfollowConfirmDialog
          isOpen={showUnfollowModal}
          onClose={() => {
            setShowUnfollowModal(false);
            setSelectedUserId(null);
          }}
          onConfirm={handleConfirmUnfollow}
          username={users.find(u => u._id === selectedUserId)?.username}
        />
      )}
    </div>
  );
};

export default FollowerModal;