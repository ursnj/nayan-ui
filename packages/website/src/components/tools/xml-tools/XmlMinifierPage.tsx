import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlMinifierTags } from '@/services/Tags';
import { XmlMinifierContent } from './XmlToolsContent';

const XmlMinifierPage = () => {
  return (
    <Sidebar title="XML Minifier">
      <XmlMinifierContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlMinifierTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlMinifierPage;
