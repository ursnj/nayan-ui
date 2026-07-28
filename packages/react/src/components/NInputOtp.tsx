import React, { memo, useMemo } from 'react';
import { InputOTP } from '@heroui/react';
import { cn } from '../lib/utils';

const EMPTY_SEPARATOR_INDICES: number[] = [];

export interface NInputOtpProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  isInvalid?: boolean;
  pattern?: string;
  className?: string;
  slotClassName?: string;
  separatorIndices?: number[];
  'aria-label'?: string;
}

const NInputOtpComponent: React.FC<NInputOtpProps> = memo(
  ({
    maxLength,
    value,
    onChange,
    onComplete,
    variant = 'primary',
    disabled = false,
    isInvalid = false,
    pattern,
    className = '',
    slotClassName = '',
    separatorIndices = EMPTY_SEPARATOR_INDICES,
    'aria-label': ariaLabel = 'One-time password'
  }) => {
    const separatorSet = useMemo(() => new Set(separatorIndices), [separatorIndices]);

    return (
      <InputOTP
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        variant={variant}
        isDisabled={disabled}
        isInvalid={isInvalid}
        pattern={pattern}
        aria-label={ariaLabel}
        className={cn('nyn-input-otp', className)}>
        <InputOTP.Group>
          {Array.from({ length: maxLength }, (_, i) => (
            <React.Fragment key={i}>
              <InputOTP.Slot index={i} className={cn(slotClassName)} />
              {separatorSet.has(i) && i < maxLength - 1 && <InputOTP.Separator />}
            </React.Fragment>
          ))}
        </InputOTP.Group>
      </InputOTP>
    );
  }
);

NInputOtpComponent.displayName = 'NInputOtp';

export const NInputOtp = NInputOtpComponent;
