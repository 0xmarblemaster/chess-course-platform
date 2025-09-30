import React from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-screen-overlay">
      <div id="loadingWave">
        <div className="chess-piece king">♚</div>
        <div className="chess-piece queen">♛</div>
        <div className="chess-piece rook">♜</div>
        <div className="chess-piece bishop">♝</div>
        <div className="chess-piece knight">♞</div>
        <div className="chess-piece pawn">♟</div>
        <div className="loading-text">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
