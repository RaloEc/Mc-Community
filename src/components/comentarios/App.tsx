import React from 'react';
import { CommentSystem } from './CommentSystem';

const App: React.FC = () => {
  return (
    <div className="App">
      <CommentSystem contentType="noticia" contentId="demo" />
    </div>
  );
};

export default App;
