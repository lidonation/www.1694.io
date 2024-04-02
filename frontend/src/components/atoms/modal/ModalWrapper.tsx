import { SxProps, styled } from "@mui/material/styles";

import { ICONS } from "@/constants"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface Props {
  variant?: "modal" | "popup";
  onClose?: () => void;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  dataTestId?: string;
  sx?: SxProps;
}

export function ModalWrapper({
  children,
  onClose,
  variant = "modal",
  hideCloseButton = false,
  dataTestId = "modal",
  sx,
}: Props) {

  return (
    <BaseWrapper variant={variant} data-testid={dataTestId} sx={sx}>
      {variant !== "popup" && !hideCloseButton && (
        <FontAwesomeIcon
        style={{position:'absolute', top:20, right:20, cursor:'pointer'}}
        size="xl"
          data-testid={"close-modal-button"}
          icon={faTimes}
          onClick={onClose}
        />
        
      )}
      {children}
    </BaseWrapper>
  );
}

export const BaseWrapper = styled("div")<Pick<Props, "variant">>`
  box-shadow: 1px 2px 11px 0px #00123d5e;
  max-height: 90vh;
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  background: #fbfbff;
  border-radius: 24px;
  transform: translate(-50%, -50%);

  ${({ variant }) => {
    if (variant === "modal") {
      return `
        width: 80vw;
        max-width: 510px;
        padding: 52px 24px 34px 24px;
      `;
    }
    if (variant === "popup") {
      return `
        width: 320px;
        height: 320px;
      `;
    }
  }}
`;

export const CloseButton = styled("img")`
  cursor: pointer;
  position: absolute;
  top: 24px;
  right: 24px;
`;
