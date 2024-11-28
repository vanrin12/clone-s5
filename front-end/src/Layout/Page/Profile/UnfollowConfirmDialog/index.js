import { Modal } from 'antd';
import { useState } from 'react';
import "./Unfollow.scss";

const UnfollowConfirmDialog = ({ isOpen, onClose, onConfirm, username }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOk = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Lỗi khi hủy theo dõi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Xóa người theo dõi?"
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      okText="Xóa"
      cancelText="Hủy"
      centered
      confirmLoading={isLoading}
      styles={{
        content: {
          backgroundColor: '#333',
        },
        header: {
          backgroundColor: '#333',
          color: '#fff',
          borderBottom: '1px solid #444'
        },
        body: {
          backgroundColor: '#333',
          color: '#fff'
        },
        footer: {
          backgroundColor: '#333',
          borderTop: '1px solid #444'
        }
      }}
    >
      <p>Bạn có chắc chắn muốn huỷ theo dõi @{username} không?</p>
    </Modal>
  );
};

export default UnfollowConfirmDialog;