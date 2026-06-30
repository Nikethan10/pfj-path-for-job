import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <motion.div
        className="w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
