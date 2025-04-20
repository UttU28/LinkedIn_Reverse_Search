import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter } from './ui/card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  index?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon,
  index = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="w-full h-full" // Ensure card takes full width of its grid cell
    >
      <Card className="bg-card rounded-xl border border-border/50 h-full">
        <CardContent className="pt-4 sm:pt-5 md:pt-6 px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-secondary-text">{title}</h3>
            <div className="text-accent text-xl sm:text-2xl md:text-3xl">{icon}</div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-primary-text">
            {value}
          </p>
          {subtitle && (
            <CardFooter className="p-0 pt-1 sm:pt-2">
              <p className="text-secondary-text text-xs sm:text-sm">{subtitle}</p>
            </CardFooter>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardCard;
