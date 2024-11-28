import React, { useEffect, useRef, useState } from 'react';
import './UploadModal.scss';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../Components/getCroppedImg';
import { FileImageOutlined, CloseOutlined } from '@ant-design/icons';
import { IoArrowBack } from "react-icons/io5";
import config from './../../config';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, profilePicture, username, fullname }) => {
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState(1 / 1);
  const [showGridControls, setShowGridControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [fullNameCaption, setFullnameCaption] = useState(fullname);
  const textareaRef = useRef(null);


  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [caption]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (fullname) {
      const lastName = fullname ? fullname.split(' ').slice(-1)[0] : '';
      setFullnameCaption(`${lastName} ơi, bạn đang nghĩ gì thế?`);
    }
  }, [fullname]);

  const resetModal = () => {
    setCurrentStep('upload');
    setFileList([]);
    setPreviewImage(null);
    setCaption('');
    setShowGridControls(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsLoading(false);
    setShowCancelModal(false);
    setShowSuccessModal(false);
    setCroppedAreaPixels(null);
  };

  const handleModalCancel = () => {
    if (currentStep === 'upload' || !previewImage) {
      onClose();
      resetModal();
    } else {
      setShowCancelModal(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileList([
        {
          originFileObj: file,
          name: file.name,
          status: 'done',
          url: URL.createObjectURL(file),
        },
      ]);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setCurrentStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (croppedAreaPixels && fileList.length > 0) {
      try {
        setIsLoading(true);
        const croppedImage = await getCroppedImg(previewImage, croppedAreaPixels);
        const formData = new FormData();
        formData.append('img', croppedImage);

        if (caption?.trim()) {
          formData.append('caption', caption);
        }

        const response = await fetch(`${config.API_HOST}/api/post/newPost`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (response.ok) {
          const newPost = await response.json();
          onUploadSuccess(newPost);
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
            onClose();
            resetModal();
            window.location.reload();
          }, 2000);
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Tạo bài viết thất bại');
        }
      } catch (error) {
        alert('Lỗi khi upload: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelAction = () => {
    setShowCancelModal(false);
  };

  const handleConfirmCancel = () => {
    onClose();
    resetModal();
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  if (!isOpen) return null;

  const renderUploadStep = () => (
    <div className="upload-container">
      <div className="upload-header">
        <div className="title-upload">Tạo bài viết mới</div>
        <div className="Close-upload" onClick={handleModalCancel}><CloseOutlined /></div>
      </div>
      <div className="upload-content">
        <FileImageOutlined className="upload-icon" />
        <div className="upload-text">Kéo ảnh và video vào đây</div>
        <label className="select-button">
          Chọn từ máy tính
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="crop-container">
      <div className="preview-header">
        <button className="back-button" onClick={() => setCurrentStep('upload')}>
          <IoArrowBack />
        </button>
        <button onClick={() => setShowGridControls(!showGridControls)}>
          Tỷ lệ
        </button>
        <button className="next-button" onClick={() => setCurrentStep('details')}>
          Tiếp
        </button>
      </div>
      <div style={{ height: 'calc(100% - 50px)', position: 'relative' }}>
        <Cropper
          image={previewImage}
          crop={crop}
          zoom={zoom}
          aspect={cropAspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      {showGridControls && (
        <div className="grid-controls">
          <button onClick={() => setCropAspect(1)}>1:1</button>
          <button onClick={() => setCropAspect(4 / 5)}>4:5</button>
          <button onClick={() => setCropAspect(16 / 9)}>16:9</button>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="details-container">
      <div className="details-header">
        <button className="back-button" onClick={() => setCurrentStep('preview')}>
          <IoArrowBack />
        </button>
        <span className="title-z">Tạo bài viết</span>
        <button onClick={handleModalCancel} className="close"><CloseOutlined /></button>
      </div>
      <div className="details-content">
        <div className="scrollable-container">
          {/* Move everything inside scrollable-container */}
          <div className="details-top">
            <div className="user-info">
              <img src={profilePicture} alt="avatar" className="user-avatar" />
              <div className="Name-user">
                <span className="fullname">{fullname}</span>
                <span className="username">@{username}</span>
              </div>
            </div>
            <div className="textCaption">
              <textarea
                ref={textareaRef}
                className="caption-input"
                placeholder={fullNameCaption}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  // Auto adjust height
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                style={{
                  overflow: 'hidden',  // Hide scrollbar
                  minHeight: '50px'    // Minimum height
                }}
              />
            </div>
          </div>
          <div className="details-bottom">
            <div className="content-bottom">
              <div className="preview-image">
                <img src={previewImage} alt="Preview" />
              </div>
            </div>
          </div>
        </div>
        {/* Move button outside of scrollable-container */}
        <div className="test">
          <button
            className="share-button"
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tải...' : 'Đăng bài'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCancelModal = () => (
    showCancelModal && (
      <div
        className="cancel-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCancelAction();
          }
        }}
      >
        <div className="cancel-modal-content">
          <h3>Bỏ bài viết?</h3>
          <p>Nếu bạn rời đi, thay đổi của bạn sẽ không được lưu.</p>
          <div className="modal-actions">
            <button
              className="cancel-button"
              onClick={handleCancelAction}
            >
              Hủy
            </button>
            <button
              className="discard-button"
              onClick={handleConfirmCancel}
            >
              Bỏ
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="modal-overlay" onClick={handleModalCancel}>
      <div className="create-post-modal" onClick={e => e.stopPropagation()}>
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'details' && renderDetailsStep()}
        {renderCancelModal()}
        {/* {renderSuccessModal()} */}
      </div>
    </div>
  );
};

export default UploadModal;