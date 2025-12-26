import { useState, useEffect } from "react";
// import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { AiFillEdit } from "react-icons/ai";
import RoomForm from "../components/RoomForm";
import LoadingPage from "../components/Loading";
import BackArrow from "../components/BackArrow";

export default function RoomDetail() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState({});
  //   const confirm = useContext(ConfirmContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/room/detail/${roomId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message);
          return navigate("/");
        }
        setRoom(data.room);
        console.log("Room data:", data.room);
      } catch (err) {
        console.log(err);
        setError("Failed to load room.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [navigate, roomId]);
  const handleDelete = async () => {
    //   const confirmed = await confirm("Xóa phòng này?", "Xác nhận xóa");
    //   if (!confirmed) return;

    try {
      const res = await fetch(`/api/room/${roomId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // toast.success("Đã xóa phòng thành công.");
        navigate("/room");
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Failed to delete room:", err);
      setError("Không thể xóa phòng.");
    }
  };
  return (
    <>
      <BackArrow to="/room" />
      <div className="bg-white p-6 rounded shadow-lg max-w-3xl mx-auto mt-5">
        <h1 className="text-2xl font-bold mb-4">Chi tiết phòng</h1>
        {loading ? (
          <LoadingPage />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <RoomForm room={room} />
        )}
        <button
          onClick={handleDelete}
          className="mt-4 ml-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Xóa phòng
        </button>
      </div>
    </>
  );
}
