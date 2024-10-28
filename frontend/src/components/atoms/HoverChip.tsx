import { Tooltip, TooltipProps } from '@mui/material';
import styled from '@emotion/styled';

interface HoverChipProps {
  text?: string;
  handleClick?: () => void;
  position?: 'top' | 'bottom';
  children?: React.ReactElement;
}

const HoverChip = ({
  text,
  handleClick,
  position = 'top',
  children,
}: HoverChipProps) => {
  return (
    <Tooltip
      title={text}
      placement={position === 'top' ? 'top' : 'bottom'}
      arrow
      onClick={handleClick}
      className="cursor-pointer"
      enterDelay={100}
      leaveDelay={100}
    >
      {children}
    </Tooltip>
  );
};

export default HoverChip;

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({});
export { HtmlTooltip };
