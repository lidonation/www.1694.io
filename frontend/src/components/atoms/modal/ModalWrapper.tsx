'use client';
import React, { useEffect, useState } from 'react';
import { styled, SxProps } from '@mui/material/styles';
import { createPortal } from 'react-dom';

interface Props {
  variant?: 'modal' | 'popup';
  onClose?: () => void;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  dataTestId?: string;
  sx?: SxProps;
}

export function ModalWrapper({
  children,
  onClose,
  variant = 'modal',
  hideCloseButton = false,
  dataTestId = 'modal',
  sx,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newHeight = entry.contentRect.height;
          setContentHeight(newHeight);
        }
      });

      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [children]);

  useEffect(() => {
    if (variant === 'modal') {
      document.body.style.overflow = 'hidden';
    }

    setTimeout(() => {
      setIsOpen(true);
    }, 10);

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [variant]);

  const handleClose = () => {
    if (onClose) {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const modalStyle =
    contentHeight && variant === 'modal'
      ? {
          height: `${contentHeight + 86}px`,
        }
      : {};

  return typeof window === 'undefined'
    ? null
    : createPortal(
        <Overlay isOpen={isOpen}>
          <BaseWrapper
            data-testid={dataTestId}
            sx={sx}
            variant={variant}
            isOpen={isOpen}
            style={modalStyle}
          >
            {variant !== 'popup' && !hideCloseButton && (
              <div className="absolute right-6 top-6 cursor-pointer">
                <img
                  data-testid={'close-modal-button'}
                  src="/svgs/close.svg"
                  onClick={handleClose}
                  alt="modal close icon"
                />
              </div>
            )}
            <div ref={contentRef} style={{ width: '100%' }}>
              {children}
            </div>
          </BaseWrapper>
        </Overlay>,
        document.body,
      );
}

const Overlay = styled('div')<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${({ isOpen }) => (isOpen ? 'all' : 'none')};
`;

export const BaseWrapper = styled('div')<
  Pick<Props, 'variant'> & { isOpen: boolean }
>`
  box-shadow: 1px 2px 11px 0px #00123d5e;
  max-height: 90vh;
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  z-index: 99999;
  flex-direction: column;
  background: #fbfbff;
  border-radius: 24px;
  transform: translate(-50%, -50%)
    ${({ isOpen }) => (isOpen ? 'scale(1)' : 'scale(0.9)')};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: height, transform, opacity;
  overflow: hidden;

  ${({ variant }) => {
    if (variant === 'modal') {
      return `
        width: 80vw;
        max-width: 510px;
        padding: 52px 24px 34px 24px;
      `;
    }
    if (variant === 'popup') {
      return `
        width: 320px;
        height: 320px;
      `;
    }
  }}
`;
