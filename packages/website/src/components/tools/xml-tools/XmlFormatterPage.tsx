import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlFormatterTags } from '@/services/Tags';
import { XmlFormatterContent } from './XmlToolsContent';

const XmlFormatterPage = () => {
  return (
    <Sidebar title="XML Formatter">
      <XmlFormatterContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlFormatterTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlFormatterPage;
