import React, { useState } from "react";
import Image from "next/image";
import { GoSignOut } from "react-icons/go";
import NavLinks from "./NavLinks";
import { summarizeName, statusToString, statusToColor } from "../../utils/dataTreatment";
import style from "../css/NavBar.module.css";

interface UserData {
  username: string;
  displayName: string;
  status?: string;
  photo: string;
}

interface LoggedInProps {
  userData: UserData;
  logout?: () => void;
}

const LoggedIn: React.FC<LoggedInProps> = ({ userData, logout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  return (
    <div
      className={style.loggedInContainer}
      onMouseEnter={() => setShowProfileMenu(true)}
      onMouseLeave={() => setShowProfileMenu(false)}
    >
      <div className={style.loggedInInfo}>
        <Image
          src={userData.photo}
          alt="User Photo"
          width={40}
          height={40}
          className={style.userPhoto}
        />
        <div className={style.userDetails}>
          <span className={style.userName}>{summarizeName(userData.displayName)}</span>
          <span
            className={style.userStatus}
            style={{ color: statusToColor(userData.status || "NaoSocio") }}
          >
            {statusToString(userData.status || "NaoSocio")}
          </span>
        </div>
      </div>

      <div className={`${style.profileDropdown} ${showProfileMenu ? style.show : ""}`}>
        <div className={style.dropdownContent}>
          <NavLinks />
          <div className={style.navItem}>
            <button onClick={logout} className={`${style.navLink} ${style.logoutMenuItem}`}>
              <GoSignOut className={style.logoutIcon} /> Terminar Sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggedIn;