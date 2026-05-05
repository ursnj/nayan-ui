import React from 'react';
import { Slider, type SliderProps, cn } from 'heroui-native';

export interface NSliderProps extends SliderProps {
  showOutput?: boolean;
  trackClassName?: string;
  fillClassName?: string;
  thumbClassName?: string;
  outputClassName?: string;
}

export const NSlider = React.memo<NSliderProps>(
  ({ showOutput = false, className, trackClassName, fillClassName, thumbClassName, outputClassName, ...props }) => {
    return (
      <Slider className={cn('w-full', className)} {...props}>
        {showOutput && <Slider.Output className={cn(outputClassName)} />}
        <Slider.Track className={cn('bg-surface', trackClassName)}>
          <Slider.Fill className={cn(fillClassName)} />
          <Slider.Thumb className={cn(thumbClassName)} />
        </Slider.Track>
      </Slider>
    );
  }
);

NSlider.displayName = 'NSlider';
