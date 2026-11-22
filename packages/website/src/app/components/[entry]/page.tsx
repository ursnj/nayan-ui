import { referenceRoute } from '@/components/nayan-reference/ReferencePage';
import { componentReferences } from '@/services/nayan-ui/component-reference';

const route = referenceRoute(componentReferences);

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
