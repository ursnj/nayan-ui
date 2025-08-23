import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getMenuItem } from '../services/Utils';
import TagsList from '../tags/TagsList';
import Attributes from './Attributes';
import Code from './Code';
import Meta from './Meta';
import Sidebar from './Sidebar';
import SubHeader from './SubHeader';

interface Props {
  children: any;
}

const ComponentWrapper = (props: Props) => {
  const { children } = props;
  const [code, setCode] = useState('');
  const location = useLocation();
  const type = location.pathname.split('/')[1];
  const component: any = getMenuItem(location.pathname);

  useEffect(() => {
    component.component().then((module: any) => {
      setCode(module.default);
    });
  }, []);

  return (
    <Sidebar title={component.title}>
      <Meta title={component.title} description={component.description} />
      <div className="mb-5">{component.description}</div>

      <SubHeader title="Demo">{children}</SubHeader>

      <SubHeader title="Usage">
        <Code code={code} />
      </SubHeader>

      <Attributes data={component.attributes} />

      <SubHeader title="Tags">
        <TagsList type={type} tags={component.tags} />
      </SubHeader>
    </Sidebar>
  );
};

export default ComponentWrapper;
