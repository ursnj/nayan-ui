import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { xmlValidatorTags } from '@/services/Tags';
import { XmlValidatorContent } from './XmlToolsContent';

const XmlValidatorPage = () => {
  return (
    <Sidebar title="XML Validator">
      <XmlValidatorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={xmlValidatorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default XmlValidatorPage;
