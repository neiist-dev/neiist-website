import Image from "next/image";
import { Avatar } from "@neiist/ui";
import styles from "./MemberAvatar.module.css";

interface MemberAvatarProps {
  name: string;
  photo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function MemberAvatar({ name, photo, size = "sm", className }: MemberAvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "M";
  const dimension = size === "lg" ? 96 : size === "md" ? 44 : 32;

  return (
    <Avatar
      fallback={initial}
      size={size}
      className={className}
      image={
        photo ? (
          <Image
            src={photo}
            alt={name}
            width={dimension}
            height={dimension}
            className={styles.avatarImage}
            unoptimized
          />
        ) : undefined
      }
    />
  );
}
