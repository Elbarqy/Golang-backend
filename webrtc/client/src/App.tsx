import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import CreateRoomComponent from './components/createRoomComp'
import CustomRoomComponent from './components/customRoomComponent'
// import RoomComponent from './components/RoomComponent'
function App() {

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path='/' element={<CreateRoomComponent />}></Route>
          <Route path='/room/:roomID' element={<CustomRoomComponent />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
