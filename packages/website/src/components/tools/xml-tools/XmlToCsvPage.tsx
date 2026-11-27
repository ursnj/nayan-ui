import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlToCsvTags } from '@/services/Tags';
import { XmlToCsvContent } from './XmlToolsContent';

const XmlToCsvPage = () => {
  return (
    <Sidebar title="XML to CSV">
      <XmlToCsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToCsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToCsvPage;
