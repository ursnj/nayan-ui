import React, { useCallback } from 'react';
import { BottomSheetBackdrop, type BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useNTheme } from '@/hooks/useNTheme';

export interface NSheetProps {
  sheetRef: React.RefObject<BottomSheetModal>;
  snapPoints?: string[] | number[];
  children: React.ReactNode;
}

export const NSheet = React.memo<NSheetProps>(({ sheetRef, children, snapPoints = null }) => {
  const { colors } = useNTheme();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} opacity={0.6} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      backdropComponent={renderBackdrop}
      {...(snapPoints && { snapPoints, enableDynamicSizing: false })}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
      handleStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
      }}>
      <BottomSheetView className="flex-1">{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

NSheet.displayName = 'NSheet';
