import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { IconType } from "react-icons";
import {
  LuCalendar,
  LuFileText,
  LuLogOut,
  LuMonitor,
  LuPackage,
  LuShoppingBag,
  LuTicket,
  LuUser,
  LuUsers,
  LuVote,
} from "react-icons/lu";
import { DropdownMenu } from "@neiist/ui";
import styles from "@/styles/components/layout/navbar/UserMenu.module.css";
import { User } from "@/types/user";
import { Permission } from "@/types/permissions";
import { hasPermission } from "@/lib/security/permissions";
import { getFirstAndLastName } from "@/utils/userUtils";
import { Dictionary } from "@/i18n/dictionaries";

interface UserMenuProps {
  userData: User;
  logout: () => void;
  dict: Dictionary["navbar"]["menu"];
  basePath: string;
}

interface MenuPage {
  href: string;
  label: string;
  icon: IconType;
  permission?: Permission | Permission[];
}

const UserMenu: React.FC<UserMenuProps> = ({ userData, logout, dict, basePath }) => {
  const router = useRouter();
  const displayName = getFirstAndLastName(userData.name);

  const personalPages: MenuPage[] = [
    { href: `${basePath}/profile`, label: dict.profile, icon: LuUser },
    { href: `${basePath}/my-orders`, label: dict.my_orders, icon: LuPackage },
    { href: `${basePath}/my-tickets`, label: dict.my_tickets, icon: LuTicket },
  ];

  const managementPages: MenuPage[] = [
    {
      href: `${basePath}/shop/pos`,
      label: dict.pos,
      icon: LuMonitor,
      permission: "pos:access",
    },
    {
      href: `${basePath}/orders`,
      label: dict.manage_orders,
      icon: LuFileText,
      permission: ["orders:read", "orders:deliver", "orders:write"],
    },
    {
      href: `${basePath}/shop/manage`,
      label: dict.manage_shop,
      icon: LuShoppingBag,
      permission: ["shop:read", "shop:write"],
    },
    {
      href: `${basePath}/activities/manage`,
      label: dict.manage_activities,
      icon: LuCalendar,
      permission: ["events:read", "events:write", "events:checkin"],
    },
    {
      href: `${basePath}/voting/manage`,
      label: dict.manage_voting,
      icon: LuVote,
      permission: ["voting:read", "voting:write"],
    },
    {
      href: `${basePath}/management`,
      label: dict.management,
      icon: LuUsers,
      permission: [
        "memberships:read",
        "memberships:write_dept",
        "memberships:write_global",
        "photos:write_dept",
        "photos:write_global",
        "departments:read",
        "departments:write",
        "roles:read",
        "roles:write",
        "users:read",
        "users:write",
      ],
    },
  ];

  const visibleManagementPages = managementPages.filter((page) =>
    page.permission ? hasPermission(userData, page.permission, { match: "any" }) : true
  );

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <button type="button" className={styles.userMenuTrigger}>
          <Image
            src={userData.photo}
            alt={dict.user_photo_alt}
            width={40}
            height={40}
            className={styles.userPhoto}
          />
          <div className={styles.userDetails}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userStatus}>{userData.positionName}</span>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" mobileTitle={displayName} className={styles.menuContent}>
        {personalPages.map((page) => {
          const Icon = page.icon;
          return (
            <DropdownMenu.Item
              key={page.href}
              className={styles.menuItem}
              icon={<Icon size={18} />}
              onClick={() => router.push(page.href)}>
              {page.label}
            </DropdownMenu.Item>
          );
        })}

        {visibleManagementPages.length > 0 && (
          <>
            <DropdownMenu.Divider />
            {visibleManagementPages.map((page) => {
              const Icon = page.icon;
              return (
                <DropdownMenu.Item
                  key={page.href}
                  className={styles.menuItem}
                  icon={<Icon size={18} />}
                  onClick={() => router.push(page.href)}>
                  {page.label}
                </DropdownMenu.Item>
              );
            })}
          </>
        )}

        <DropdownMenu.Divider />
        <DropdownMenu.Item
          className={styles.menuItem}
          icon={<LuLogOut size={18} />}
          destructive
          onClick={logout}>
          {dict.logout}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

export default UserMenu;
