import React from 'react';
import { Button as MUIButton, ButtonProps as MUIButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MUIButtonProps, 'size' | 'onClick' | 'className'> {
  size?: 'extraLarge' | 'large' | 'medium' | 'small' | 'extraSmall' | 'smallest';
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  width?: number | string;
  bgcolor?: string;
  id?: string;
  disabled?: boolean;
  borderRadius?: string;
  sx?: object;
  children?: React.ReactNode;
  handleClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'submit' | 'button';
  className?: string;
  preventDefaultClick?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  size = 'large',
  variant = 'contained',
  color = 'primary',
  id,
  width,
  bgcolor,
  disabled,
  borderRadius,
  sx,
  children,
  handleClick,
  type = 'button',
  className,
  preventDefaultClick = false, // Default to false to allow normal navigation
  ...props
}) => {
  const buttonHeight = {
    extraLarge: 48,
    large: 40,
    medium: 36,
    small: 32,
    extraSmall: 30,
    smallest: 26,
  }[size];

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Only prevent default if explicitly requested
    if (preventDefaultClick) {
      event.preventDefault();
    }
    
    if (handleClick) {
      handleClick(event);
    }
  };

  return (
    <MUIButton
      className={className}
      style={{
        height: buttonHeight,
        width: width,
        backgroundColor: bgcolor,
        borderRadius: borderRadius,
        ...sx,
      }}
      id={id}
      disabled={disabled}
      variant={variant}
      color={color}
      onClick={handleButtonClick}
      type={type}
      {...props}
    >
      {children}
    </MUIButton>
  );
};

export default Button;