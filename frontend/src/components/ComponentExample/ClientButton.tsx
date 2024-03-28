// ClientButton.js
import { Button } from "@mui/material";

const ClientButton = ({ onClick, children }) => {
  return <Button onClick={onClick}>{children}</Button>;
};

export default ClientButton;
