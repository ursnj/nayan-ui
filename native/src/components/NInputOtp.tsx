import React from 'react';
import { InputOTP, type InputOTPRootProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NInputOtpProps extends InputOTPRootProps {
  slotVariant?: 'primary' | 'secondary';
  containerClassName?: string;
  groupClassName?: string;
  slotClassName?: string;
}

export const NInputOtp = React.memo<NInputOtpProps>(
  ({ slotVariant = 'primary', containerClassName, groupClassName, slotClassName, className, ...props }) => {
    return (
      <InputOTP className={cn(containerClassName)} {...props}>
        <InputOTP.Group className={cn(groupClassName)}>
          {({ slots }) =>
            slots.map((_, index) => (
              <InputOTP.Slot key={index} index={index} variant={slotVariant} className={cn(slotClassName)}>
                <InputOTP.SlotValue />
                <InputOTP.SlotPlaceholder />
                <InputOTP.SlotCaret />
              </InputOTP.Slot>
            ))
          }
        </InputOTP.Group>
      </InputOTP>
    );
  }
);

NInputOtp.displayName = 'NInputOtp';
