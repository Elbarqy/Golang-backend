import React from "react"
import { useNavigate } from "react-router-dom";

const CreateRoomComponent: React.FunctionComponent = () => {
    let navigate = useNavigate()
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        const resp = await fetch("http://localhost:8080/create")
        const { room_id } = await resp.json()
        navigate(`/room/${room_id}`)
    }

    return <div>
        <button onClick={handleClick}>Create Room</button>
    </div>
}

export default CreateRoomComponent