import React from 'react';
import { Check, X } from 'lucide-react';
import {
  COLUMN_BADGE_LABELS,
  type ProfileColumnKey,
  type ProfileColumnValidation,
} from '../utils/spreadsheetColumns';

interface ColumnAvailabilityBadgesProps {
  validation?: Pick<
    ProfileColumnValidation,
    'name' | 'company' | 'website' | 'position' | 'linkedin'
  >;
  requiredKeys?: ProfileColumnKey[];
  variant?: 'labeled' | 'icons' | 'headers';
}

export const BADGE_ORDER: ProfileColumnKey[] = ['name', 'company', 'website', 'position', 'linkedin'];

const SLOT_CLASS = 'w-6 flex items-center justify-center shrink-0';

const ColumnAvailabilityBadges: React.FC<ColumnAvailabilityBadgesProps> = ({
  validation,
  requiredKeys = ['name', 'company', 'position'],
  variant = 'labeled',
}) => {
  if (variant === 'headers') {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {BADGE_ORDER.map((key) => (
          <span
            key={key}
            className={`${SLOT_CLASS} text-[10px] sm:text-xs font-semibold text-muted-foreground`}
          >
            {COLUMN_BADGE_LABELS[key]}
          </span>
        ))}
      </div>
    );
  }

  if (!validation) return null;

  if (variant === 'icons') {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {BADGE_ORDER.map((key) => {
          const present = validation[key];
          const required = requiredKeys.includes(key);

          return (
            <div key={key} className={SLOT_CLASS}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  present
                    ? 'bg-primary/20 border border-primary/60'
                    : required
                      ? 'bg-destructive/20 border border-destructive/60'
                      : 'bg-muted/30 border border-border'
                }`}
              >
                {present ? (
                  <Check size={12} className="text-primary" />
                ) : (
                  <X
                    size={12}
                    className={required ? 'text-destructive' : 'text-muted-foreground'}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
      {BADGE_ORDER.map((key) => {
        const present = validation[key];
        const required = requiredKeys.includes(key);

        return (
          <div key={key} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-1 sm:mb-2 flex items-center justify-center shadow-md ${
                present
                  ? 'bg-primary/20 border border-primary/60'
                  : required
                    ? 'bg-destructive/20 border border-destructive/60'
                    : 'bg-muted/30 border border-border'
              }`}
            >
              {present ? (
                <Check size={16} className="text-primary" />
              ) : (
                <X
                  size={16}
                  className={required ? 'text-destructive' : 'text-muted-foreground'}
                />
              )}
            </div>
            <span
              className={`text-xs sm:text-sm font-semibold text-center ${
                present ? 'text-primary-text' : required ? 'text-secondary-text' : 'text-muted-foreground'
              }`}
            >
              {COLUMN_BADGE_LABELS[key]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ColumnAvailabilityBadges;
