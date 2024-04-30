import { useState } from 'react';
import { motion } from 'framer-motion';

const HoverChip = ({ icon, text, handleClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onClick={handleClick}
    >
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-10 rounded-md bg-zinc-800 p-2 text-sm text-white shadow-md"
          style={{ top: '-55px', transform: 'translateX(-50%)' }}
        >
          {text}
          <div className="absolute left-[45%] h-3 w-3 -translate-x-1/2 rotate-45 transform bg-zinc-800"></div>
        </motion.div>
      )}

      <img
        src={icon}
        alt="Icon"
        className="h-6 w-6 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
};
export default HoverChip;
