import React from "react";
import { Button as MUIButton } from "@mui/material";
import { Poppins } from "next/font/google";
export interface ButtonProps {
  size?: "extraLarge" | "large" | "medium" | "small";
  variant?: "text" | "outlined" | "contained";
  color?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  width?: number | string;
  bgColor?: string;
  borderRadius?:string
  sx?: object;
  children?: React.ReactNode;
  handleClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  size = "large",
  variant = "contained",
  color = "primary",
  width,
  bgColor,
  borderRadius,
  sx,
  children,
  handleClick,
  ...props
}) => {
  const buttonHeight = {
    extraLarge: 48,
    large: 40,
    medium: 36,
    small: 32,
  }[size];

  return (
    <MUIButton
      sx={{
        fontSize: size === "extraLarge" ? 16 : 12,
        fontFamily:"Poppins",
        height: buttonHeight,
        width: width,
        backgroundColor: bgColor,
        borderRadius:borderRadius,
        ...sx,
      }}
      
      variant={variant}
      color={color}
      onClick={handleClick} // Pass the handleClick function to onClick
      {...props}
    >
      {children}
    </MUIButton>
  );
};

export default Button;
