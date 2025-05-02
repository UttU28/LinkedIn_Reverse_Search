import { motion } from 'framer-motion';
import { Link as LinkIcon, ExternalLink } from 'lucide-react';
import LinkedInIcon from '../assets/icons/LinkedInIcon';

// Define team member interface based on backend response
interface TeamMember {
  name: string;
  position: string;
  linkedin?: string | null;
  id?: number | string;
}

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  companyUrl: string;
  isVisible?: boolean;
  className?: string;
}

// Function to extract LinkedIn username from URL
const extractLinkedInUsername = (url: string): string => {
  if (!url) return '';
  
  // Match everything after .com/in/ or .com/company/
  const match = url.match(/linkedin\.com\/(in|company)\/([^/]+)/);
  if (match && match[2]) {
    return match[2];
  }
  return '';
};

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  companyUrl,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || !teamMembers?.length) return null;

  return (
    <motion.section 
      className={`mb-6 sm:mb-10 md:mb-16 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-xl font-heading font-semibold text-primary-text flex items-center">
          <LinkIcon className="mr-2 h-5 w-5 text-primary" />
          Team Members Results
        </h2>
        <div className="text-sm text-secondary-text">
          <span className="text-primary font-medium">{teamMembers.length}</span> members found
          <span className="hidden sm:inline ml-1">
            at <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{new URL(companyUrl).hostname.replace('www.', '')}</a>
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border/50 bg-card/70 mb-10">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background/30">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                Position
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-text uppercase tracking-wider">
                LinkedIn
              </th>
            </tr>
          </thead>
          <tbody className="bg-background/10 divide-y divide-border">
            {teamMembers.map((member) => (
              <motion.tr 
                key={member.id}
                className="hover:bg-background/30 transition-colors duration-150"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-6 py-4 whitespace-nowrap align-middle text-left">
                  <div className="flex items-center">
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-full bg-primary/20 mr-3 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                    >
                      <LinkedInIcon className="h-4 w-4 text-primary" />
                    </a>
                    <a
                      href={member.linkedin} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-text hover:text-primary cursor-pointer transition-colors duration-200"
                    >
                      {member.name}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-center">
                  <div className="text-sm text-secondary-text max-w-[200px] mx-auto truncate">
                    {member.position}
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-right">
                  {member.linkedin ? (
                    <div className="text-sm text-secondary-text max-w-xs ml-auto truncate">
                      <a 
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center justify-end"
                      >
                        <span>{extractLinkedInUsername(member.linkedin)}</span>
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-sm text-secondary-text/50 max-w-xs ml-auto truncate italic">
                      Not available
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
};

export default TeamMembersTable; 