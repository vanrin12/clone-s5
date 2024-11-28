import { useEffect, useState } from 'react';
import "./cursor.scss";

export default function CursorCustom() {
  const [clicks, setClicks] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      const newClick = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now()
      };

      setClicks(prev => [...prev, newClick]);

      setTimeout(() => {
        setClicks(prev => prev.filter(click => click.id !== newClick.id));
      }, 700);
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <>
      {clicks.map(click => (
        <div
          key={click.id}
          className="click_effect"
          style={{
            left: `${click.x}px`,
            top: `${click.y}px`
          }}
        />
      ))}
    </>
  );
}