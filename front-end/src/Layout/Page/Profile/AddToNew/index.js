import { IoAddOutline } from "react-icons/io5";
import "./AddToNew.scss";

export default function AddToNew() {
  return (
    <div className="CreateNrew">
      <div className="CreateNrew__wrapper">
        <div className="CreateNrew__icon">
          <div className="CreateNrew__background-icon">
            <IoAddOutline />
          </div>
        </div>
        <span className="CreateNrew__text">Mới</span>
      </div>
    </div>
  );
}