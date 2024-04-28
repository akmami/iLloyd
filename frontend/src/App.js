import './App.css';
import Header from './components/header';
import Footer from './components/footer';
import Canvas from './modules/canvas';

function App() {
  return (
    <div className="App">
      <Header/>
      <div className="canvas-container">
        <Canvas />
      </div>
      <Footer />
    </div>
  );
}

export default App;
