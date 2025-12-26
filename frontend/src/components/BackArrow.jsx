import { useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";

export default function BackArrow({ to = null, text = "Quay về" }) {
  const navigate = useNavigate();
  if (!to) return null;
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-3 hover:text-blue-600 cursor-pointer font-medium mb-4"
      onClick={() => navigate(to)}
    >
      <IoIosArrowRoundBack className="w-10 h-10" />
      {text}
    </button>
  );
}
