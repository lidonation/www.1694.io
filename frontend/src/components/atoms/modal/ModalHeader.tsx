import Typography from "@mui/material/Typography";
import type { SxProps } from "@mui/system";
import './Modal.css'
interface Props {
  children: React.ReactNode;
  sx?: SxProps;
}

export function ModalHeader({ children, sx }: Props) {
  return (
    <Typography
      className='mb-[8px] text-[28px] font-[500] text-center'
      sx={sx}
      
    >
      {children}
    </Typography>
  );
}
