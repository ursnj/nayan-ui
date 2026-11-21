import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { organizePdfTags } from '@/services/Tags';
import { OrganizePdfContent } from './PdfToolsContent';

const OrganizePdfPage = () => {
  return (
    <Sidebar title="Organize PDF">
      <OrganizePdfContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={organizePdfTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default OrganizePdfPage;
