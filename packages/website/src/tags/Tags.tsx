import { useLocation } from 'react-router-dom';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';
import { reactNativeSidebarItems, reactSidebarItems } from '../services/Utils';
import TagsList from './TagsList';

const Tags = () => {
  const reactComponents = reactSidebarItems.filter(item => item.isComponent);
  const reactNativeComponents = reactNativeSidebarItems.filter(item => item.isComponent);

  return (
    <Sidebar title="Component Tags">
      <Meta title="Component Tags" />
      <div className="mb-8 leading-relaxed">
        Our component library offers a variety of customizable and reusable UI elements for both React and React Native. These tags include
        interactive components such as buttons, forms, modals, accordions, and more, designed for seamless integration into your applications. Each
        element is built with flexibility and performance in mind, enabling you to enhance user experience efficiently.
      </div>

      {/* React Components Section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <h2 className="text-2xl font-bold text-text">React Components</h2>
        </div>
        <div className="mb-6 text-muted leading-relaxed">
          React components for web applications with modern design patterns and accessibility features.
        </div>
        {reactComponents.map((component: any) => (
          <div key={`react-${component.title}`} className="mb-8">
            <div className="flex flex-row justify-between items-center mb-3 py-2">
              <h3 className="text-lg font-semibold text-text">{component.title}</h3>
            </div>
            <div className="mb-4 leading-relaxed text-sm text-muted">{component.description}</div>
            <TagsList type="react" tags={component.tags || []} />
          </div>
        ))}
      </div>

      {/* React Native Components Section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">RN</span>
          </div>
          <h2 className="text-2xl font-bold text-text">React Native Components</h2>
        </div>
        <div className="mb-6 text-muted leading-relaxed">
          React Native components for mobile applications with native performance and cross-platform compatibility.
        </div>
        {reactNativeComponents.map((component: any) => (
          <div key={`react-native-${component.title}`} className="mb-8">
            <div className="flex flex-row justify-between items-center mb-3 py-2">
              <h3 className="text-lg font-semibold text-text">{component.title}</h3>
            </div>
            <div className="mb-4 leading-relaxed text-sm text-muted">{component.description}</div>
            <TagsList type="react-native" tags={component.tags || []} />
          </div>
        ))}
      </div>
    </Sidebar>
  );
};

export default Tags;
