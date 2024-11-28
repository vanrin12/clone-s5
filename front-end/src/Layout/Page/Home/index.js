import React, { useState } from 'react';
import { CenterContent } from './CenterContent';
import { RightSidebar } from './RightSidebar';
import "./Home.scss";
import "./RightSiderbar.scss";

const Home = () => {
  // States
  const [expandSuggestions, setExpandSuggestions] = useState(false);
  const [storyPage, setStoryPage] = useState(0);
  const [postText, setPostText] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  // Constants
  const storiesPerPage = 40;
  const stories = Array(1028).fill(null);

  // Story navigation handlers
  const nextStoryPage = () => {
    if ((storyPage + 1) * storiesPerPage < stories.length) {
      setStoryPage(prev => prev + 1);
    }
  };

  const prevStoryPage = () => {
    if (storyPage > 0) {
      setStoryPage(prev => prev - 1);
    }
  };

  // Mock posts data
  const posts = [...Array(48)].map((_, index) => ({
    id: index,
    author: `Người dùng ${Math.floor(Math.random() * 1000)}`,
    timeAgo: '1 ngày',
    content: 'Quéo quèo =)))\nCre: St',
    imageUrl: `https://res.cloudinary.com/dtahyhx0h/image/upload/v1731394356/jpr7lugxrkxuhysci4ev.jpg`,
    reactions: {
      likes: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 200)
    }
  }));

  return (
    <div className="flex justify-center text-white min-h-screen bg-homeGradient" style={{ width: '100%' }}>
      <div className="flex w-full">
        <CenterContent
          postText={postText}
          setPostText={setPostText}
          storyPage={storyPage}
          nextStoryPage={nextStoryPage}
          prevStoryPage={prevStoryPage}
          stories={stories}
          storiesPerPage={storiesPerPage}
          posts={posts}
        />

        <RightSidebar
          expandSuggestions={expandSuggestions}
          setExpandSuggestions={setExpandSuggestions}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />
      </div>
    </div>
  );
};

export default Home;