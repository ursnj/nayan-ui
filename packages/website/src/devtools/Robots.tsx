import Code from '../helpers/Code';
import { robotsCreateAttributes, robotsValidationAttributes } from '../services/CliAttributes';
import Attributes from './Attributes';

const SEOSitemaps = () => {
  return (
    <div>
      <h2 className="text-xl mb-5">🕹 Robots.txt Creation and Validation</h2>
      <div className="text-lg mb-5"># Robots.txt creation:</div>
      <Code
        language="sh"
        code={`npx seo-master create robots --allowed /home,/about --disallowed /admin,/security --sitemap https://www.nayanui.com/sitemap.xml --output ./robots.txt`}
      />
      <div className="mb-5">You can also use the shorter version of this command.</div>
      <Code
        language="bash"
        code={`npx seo-master create robots -a /home,/about -d /admin,/security -s https://www.nayanui.com/sitemap.xml -o ./robots.txt`}
      />
      <Attributes data={robotsCreateAttributes} />
      <div className="text-lg mb-5"># Robots.txt validation:</div>
      <div className="mb-5">Validate your Robots.txt both local and through URL.</div>
      <Code language="sh" code={`npx seo-master validate robots --input ./robots.txt`} />
      <div className="mb-5">You can also use the shorter version of this command.</div>
      <Code code={`npx seo-master validate robots -i ./robots.txt`} />
      <div className="mb-5">You can also validate robots.txt of your live website by passing URL.</div>
      <Code code={`npx seo-master validate robots --input https://www.nayanui.com/robots.txt --isremote true`} />
      <Attributes data={robotsValidationAttributes} />
    </div>
  );
};

export default SEOSitemaps;
