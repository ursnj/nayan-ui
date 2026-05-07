import { NBadge } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Badge = () => {
  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Variants:</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge className="text-foreground bg-surface border border-default">Default</NBadge>
        <NBadge className="text-blue-700 bg-blue-100">Info</NBadge>
        <NBadge className="text-green-700 bg-green-100">Success</NBadge>
        <NBadge className="text-yellow-700 bg-yellow-100">Warning</NBadge>
        <NBadge className="text-red-700 bg-red-100">Error</NBadge>
      </div>

      <h2 className="text-foreground mb-3 text-lg font-semibold">Solid:</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge className="bg-accent text-accent-foreground">Primary</NBadge>
        <NBadge className="bg-green-600 text-white">Success</NBadge>
        <NBadge className="bg-yellow-600 text-white">Warning</NBadge>
        <NBadge className="bg-red-600 text-white">Danger</NBadge>
      </div>
    </ComponentWrapper>
  );
};

export default Badge;
