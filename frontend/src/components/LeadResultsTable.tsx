import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import LinkedInIcon from '../assets/icons/LinkedInIcon';
import { LeadResult } from './LeadSearchForm';

interface LeadResultsTableProps {
  results: LeadResult[];
  searchCriteria?: {
    company: string;
    position: string;
  };
  isVisible?: boolean;
  className?: string;
}

const LeadResultsTable: React.FC<LeadResultsTableProps> = ({
  results,
  searchCriteria,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || !results.length) return null;

  return (
    <motion.section 
      className={`mb-6 sm:mb-10 md:mb-16 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-semibold text-primary-text flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Lead Results
        </h2>
        <div className="text-sm text-secondary-text">
          <span className="text-primary font-medium">{results.length}</span> leads found
          {searchCriteria && (
            <span className="hidden sm:inline ml-1">
              for {searchCriteria.position} at {searchCriteria.company}
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border/50 bg-card/70 mb-10">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background/30">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                Company
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                Position
              </th>
            </tr>
          </thead>
          <tbody className="bg-background/10 divide-y divide-border">
            {/* Exact matches first */}
            {results.filter(result => result.exactMatch).map((result) => (
              <motion.tr 
                key={result.id}
                className="hover:bg-background/30 transition-colors duration-150"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-4 py-4 whitespace-nowrap align-middle">
                  <div className="flex items-center">
                    <a 
                      href={result.linkedinUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-full bg-primary/20 mr-3 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (result.linkedinUrl) {
                          window.open(result.linkedinUrl, '_blank');
                        }
                      }}
                    >
                      <LinkedInIcon className="h-4 w-4 text-primary" />
                    </a>
                    <a
                      href={result.linkedinUrl || "#"} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-text hover:text-primary cursor-pointer transition-colors duration-200"
                      onClick={(e) => {
                        e.preventDefault();
                        if (result.linkedinUrl) {
                          window.open(result.linkedinUrl, '_blank');
                        }
                      }}
                    >
                      {result.name}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-middle">
                  <div className="text-sm text-secondary-text">
                    {result.company}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="text-sm text-secondary-text max-w-[200px] truncate">
                    {result.position}
                  </div>
                </td>
              </motion.tr>
            ))}
            
            {/* Separator for related results */}
            {results.some(result => !result.exactMatch) && results.some(result => result.exactMatch) && (
              <tr className="bg-background/30">
                <td colSpan={3} className="px-4 py-2">
                  <div className="text-xs font-medium text-secondary-text uppercase tracking-wider flex items-center">
                    <span className="mr-2">Additional Results Found For You</span>
                    <div className="h-px flex-grow bg-border"></div>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Related matches second */}
            {results.filter(result => !result.exactMatch).map((result) => (
              <motion.tr 
                key={result.id}
                className="hover:bg-background/30 transition-colors duration-150"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-4 py-4 whitespace-nowrap align-middle">
                  <div className="flex items-center">
                    <a 
                      href={result.linkedinUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-full bg-accent/20 mr-3 flex items-center justify-center hover:bg-accent/40 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (result.linkedinUrl) {
                          window.open(result.linkedinUrl, '_blank');
                        }
                      }}
                    >
                      <LinkedInIcon className="h-4 w-4 text-accent" />
                    </a>
                    <a
                      href={result.linkedinUrl || "#"} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-text hover:text-primary cursor-pointer transition-colors duration-200"
                      onClick={(e) => {
                        e.preventDefault();
                        if (result.linkedinUrl) {
                          window.open(result.linkedinUrl, '_blank');
                        }
                      }}
                    >
                      {result.name}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-middle">
                  <div className="text-sm text-secondary-text">
                    {result.company}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="text-sm text-secondary-text max-w-[200px] truncate">
                    {result.position}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
};

export default LeadResultsTable; 