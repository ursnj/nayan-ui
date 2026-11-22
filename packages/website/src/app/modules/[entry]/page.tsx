import { referenceRoute } from '@/components/nayan-reference/ReferencePage';
import { moduleReferences } from '@/services/nayan-ui/module-reference';

const route = referenceRoute(moduleReferences);

export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
