import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlToTsvTags } from '@/services/Tags';
import { XmlToTsvContent } from './XmlToolsContent';

const XmlToTsvPage = () => {
  return (
    <Sidebar title="XML to TSV">
      <XmlToTsvContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlToTsvTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlToTsvPage;
