import { Link, useLocation, useParams } from 'react-router-dom';
import { NCard } from '@nayan-ui/react';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';
import { getMenuItemByTag } from '../services/Utils';

const TagDetails = () => {
  const params: any = useParams();
  const location = useLocation();
  const component: any = getMenuItemByTag(params.tag, location.pathname);
  const tag = component.tags.find((tag: any) => tag.sku === params.tag);
  const Icon = component.icon;

  return (
    <Sidebar title={tag.text}>
      <Meta title={tag.text} description={component.description} />
      <div className="mb-5 leading-relaxed">{component.description}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5">
        <Link to={component.link} key={component.link}>
          <NCard className="p-3 h-full">
            <div className="flex flex-row items-center mb-1">
              <Icon className="w-4 h-4 inline mr-3 text-primary" />
              <div className="text-base font-medium">{component.title}</div>
            </div>
            <div className="text-sm line-clamp-5">{component.description}</div>
          </NCard>
        </Link>
      </div>
    </Sidebar>
  );
};

export default TagDetails;
