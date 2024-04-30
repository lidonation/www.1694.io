import { useState } from 'react';
import { motion } from 'framer-motion';

const HoverChip = ({ icon, text , handleClick}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center" onClick={handleClick}>
        {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-10 bg-zinc-800 p-2 rounded-md shadow-md text-white text-sm"
          style={{ top: '-55px', transform: 'translateX(-50%)' }}
        >
          {text}
          <div className="w-3 h-3 left-[45%] -translate-x-1/2 bg-zinc-800 transform rotate-45 absolute"></div>
        
        </motion.div>
      )}
      
      <img
        src={icon}
        alt="Icon"
        className="w-6 h-6 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
    </div>
  );
};
export default HoverChip