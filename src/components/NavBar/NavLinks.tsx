import React, { useContext } from "react";
import Link from "next/link";
import UserDataContext from "../../context/UserDataContext";
import style from "../css/NavBar.module.css";

interface NavLinkProps {
  hide: boolean;
  href: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps & { condition: boolean }> = ({ hide, href, children, condition }) => {
  if (condition && !hide) {
    return (
      <div className={style.navItem}>
        <Link href={href} className={style.navLink}>
          {children}
        </Link>
      </div>
    );
  }
  return null;
};

const NavLinks: React.FC = () => {
  const { userData } = useContext(UserDataContext) || {};

  return (
    <>
      <NavLink hide={false} href="/user" condition={!!userData?.isAdmin || !!userData?.isActiveTecnicoStudent}>
        Perfil
      </NavLink>
      <NavLink hide={false} href="/collab" condition={!!userData?.isAdmin || !!userData?.isCollab}>
        Colaborador(a)
      </NavLink>
      <NavLink hide={false} href="/thesismaster" condition={!!userData?.isAdmin || !!userData?.isActiveLMeicStudent}>
        Thesis Master
      </NavLink>
      <NavLink hide={false} href="/admin" condition={!!userData?.isAdmin}>
        Admin
      </NavLink>
      <NavLink hide={false} href="/mag" condition={!!userData?.isAdmin || !!userData?.isGacMember}>
        MAG
      </NavLink>
    </>
  );
};

export default NavLinks;