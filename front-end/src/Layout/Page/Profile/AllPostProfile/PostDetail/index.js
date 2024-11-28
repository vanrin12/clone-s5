import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.scss';
import config from './../../../../../config';

const PostDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { postId } = useParams();
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const response = await fetch(`${config.API_HOST}/api/post/getPost/${postId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        console.log(data)
        if (data.success) {
          setPost(data.post);
        } else {
          throw new Error(data.message || 'Failed to fetch post');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId]);

  if (loading) return <div className="post-detail__loading"></div>;
  if (error) return <div className="post-detail__error">{error}</div>;
  if (!post) return <div className="post-detail__not-found">Post not found</div>;

  return (
    <div className="post-detail">
      <img src={post.img} alt="" />
      <p>{post.caption}</p>
    </div>
  );
};

export default PostDetail;