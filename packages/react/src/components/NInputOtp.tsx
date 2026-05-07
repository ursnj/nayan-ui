import React, { memo } from 'react';
import { InputOTP } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NInputOtpProps {
  maxLength: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
  isInvalid?: boolean;
  pattern?: string;
  className?: string;
  slotClassName?: string;
  separatorIndices?: number[];
}

const NInputOtpComponent: React.FC<NInputOtpProps> = memo(
  ({
    maxLength,
    value,
    onChange,
    onComplete,
    variant = 'primary',
    isDisabled = false,
    isInvalid = false,
    pattern,
    className = '',
    slotClassName = '',
    separatorIndices = []
  }) => {
    const separatorSet = new Set(separatorIndices);

    return (
      <InputOTP
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        variant={variant}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        pattern={pattern}
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
