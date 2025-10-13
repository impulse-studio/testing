import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
  }

  return (
    <div className="container">
      <p className="text">You made the cat happy {count} times!</p>
      <button id="happy-cat" className="button" onClick={handleClick}>
        Make the cat happy!
      </button>
    </div>
  )
}

export default App
