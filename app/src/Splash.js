import { useEffect, useRef } from 'react';

const titleText = 'BritePegs.com';
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];

function Splash() {
  const titleRef = useRef(null);

  function malfunctionNeonEffect() { 
    const spans = document.querySelectorAll('.splash-title span');
    const randomIndex = Math.floor(Math.random() * spans.length);
    const selectedSpan = spans[randomIndex];

    selectedSpan.style.opacity = selectedSpan.style.opacity == 1 ? 0.3 : 1;
    setTimeout(() => {
      selectedSpan.style.opacity = 1;
      // Occasionally perform a double flash
      if (Math.random() < 0.9) {
        setTimeout(() => {
          selectedSpan.style.opacity = 0.3;
          setTimeout(() => {
            selectedSpan.style.opacity = 1;
          }, 100);
        }, 100);
      }
    }, 200);
  }
    
  function closeDomModal() {
    const modal = document.getElementById('splash-modal');
    modal.style.display = 'none';
  }

  useEffect(() => {
    const titleElement = titleRef.current;
    titleText.split('').forEach((char, index) => {
      const span = document.createElement('span');
      span.innerText = char;
      span.style.color = colors[index % colors.length];
      span.style.textShadow = `0 0 10px ${colors[index % colors.length]}, 0 0 20px ${colors[index % colors.length]}, 0 0 30px ${colors[index % colors.length]}`;
      titleElement.appendChild(span);
    });

    function initiateFlashes() {
      setTimeout(() => {
        malfunctionNeonEffect();
        initiateFlashes();
      }, Math.random() * 1000 + 2000); // Sporadic interval between 2 and 10 seconds
    }

    initiateFlashes();
  }, []);

  return (
    <div className="container">
      <div className="splash-title" id="splash-title" ref={titleRef}></div>
      <div className="image-container" style={{visibility: 'hidden'}}>
        <img src="path_to_your_image/Create_a_dark-background_splash_page_for_a_web-bas.png" alt="BritePegs" />
      </div>
      <button id="start-button" onClick={closeDomModal}>
        <span className="emoji">🎨Start</span>
      </button>
      <button id="instructions-button" onClick={() => document.getElementById('instructions').style.display = 'block'}>
        <span className="emoji">🤔How To</span>
      </button>
      <div 
        id="instructions"
        style={{textAlign:'left', padding: '20px', borderRadius: '10px', display: 'none'}}>
        <h2>Welcome to BritePegs!</h2>
        <p>Follow these steps to get started with creating your own Lite Brite pixel art:</p>
        <ol>
            <li>
                <strong>Initialize the Game</strong>
                <p>The game automatically initializes when you load the page. It checks for WebGPU or WebGL2 support and sets up the scene, renderer, and controls.</p>
            </li>
            <li>
                <strong>Set Up Your Pegboard</strong>
                <p>The pegboard is initialized with a default setup. You can customize it by adding or removing pegs, changing shapes, and adjusting settings.</p>
            </li>
            <li>
                <strong>Customize Lighting</strong>
                <p>Adjust the lighting in your scene using the provided controls to make your pixel art stand out.</p>
            </li>
            <li>
                <strong>Create and Manipulate Shapes</strong>
                <p>Use the shape controls to draw new pegs, remove existing ones, and change their colors and properties. You can undo or redo your actions using keyboard shortcuts:</p>
                <ul>
                    <li><strong>Undo:</strong> Ctrl + Z</li>
                    <li><strong>Redo:</strong> Ctrl + Y</li>
                </ul>
            </li>
            <li>
                <strong>Save Your Art</strong>
                <p>When you're happy with your creation, save your state and share it with others. Your art will be saved to a URL that you can copy to your clipboard.</p>
            </li>
        </ol>
        <h3>Advanced Features</h3>
        <ul>
            <li>
                <strong>Loading Existing Art</strong>
                <p>Load existing art by appending its ID to the URL, e.g., <code>https://britepegs.com/art/12345</code>. The state will be fetched and displayed.</p>
            </li>
            <li>
                <strong>Using the GUI</strong>
                <p>The GUI provides various options to fine-tune your art. You can open or minimize the GUI as needed.</p>
            </li>
        </ul>
        <p>Enjoy creating your pixel art with BritePegs!</p>
      </div>
    </div>
  );
}

export default Splash;
