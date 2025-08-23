import Code from '../helpers/Code';
import { sitemapsCreateAttributes, sitemapsValidationAttributes } from '../services/CliAttributes';
import Attributes from './Attributes';

const SEOSitemaps = () => {
  return (
    <div>
      <h2 className="text-xl mb-5">🕹 Sitemaps Creation and Validation</h2>
      <div className="text-lg mb-5"># Simple generation usage:</div>
      <Code language="sh" code={`npx seo-master create sitemap -w https://www.nayanui.com`} />
      <div className="text-lg mb-5"># Advanced generation Usage:</div>
      <Code
        language="bash"
        code={`npx seo-master create sitemap --website https://www.nayanui.com --depth 10 --changefreq daily --output ./sitemap.xml`}
      />
      <div className="mb-5">You can also use the shorter version of this command.</div>
      <Code language="bash" code={`npx seo-master create sitemap -w https://www.nayanui.com -d 10 -f daily -o ./sitemap.xml`} />
      <div className="mb-5">You can also integrate Sitemaper with your localhost</div>
      <Code
        language="bash"
        code={`npx seo-master create sitemap -w http://localhost:3000 -r https://www.nayanui.com -d 10 -f daily -o ./sitemap.xml`}
      />
      <div className="mb-5">this case it crawl your localhost URL and replace it with replacement URL.</div>
      <Attributes data={sitemapsCreateAttributes} />
      <div className="text-lg mb-5"># Sitemap validation usage:</div>
      <div className="mb-5">Validate your sitemap both local and through URL.</div>
      <Code language="sh" code={`npx seo-master validate sitemap --input ./sitemap.xml`} />
      <div className="mb-5">You can also use the shorter version of this command.</div>
      <Code code={`npx seo-master validate sitemap -i ./sitemap.xml`} />
      <div className="mb-5">You can also validate sitemap.xml of your live website by passing URL.</div>
      <Code code={`npx seo-master validate sitemap --input https://www.nayanui.com/sitemap.xml --isremote true`} />
      <Attributes data={sitemapsValidationAttributes} />
    </div>
  );
};

export default SEOSitemaps;
