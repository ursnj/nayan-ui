import Sidebar from '@/components/helpers/Sidebar';
import SubHeader from '@/components/helpers/SubHeader';
import TagsList from '@/components/helpers/TagsList';
import { passwordGeneratorTags } from '@/services/Tags';
import { PasswordGeneratorContent } from './DevToolsContent';

const PasswordGeneratorPage = () => {
  return (
    <Sidebar title="Password Generator">
      <PasswordGeneratorContent />

      <SubHeader title="Tags">
        <TagsList type="tools" tags={passwordGeneratorTags} />
      </SubHeader>
    </Sidebar>
  );
};

export default PasswordGeneratorPage;
